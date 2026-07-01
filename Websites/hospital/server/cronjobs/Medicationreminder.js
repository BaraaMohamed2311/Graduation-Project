const cron = require("node-cron");
const nodemailer = require("nodemailer");
const executeQuery = require("../Utils/executeMySqlQuery");
const { broadcast } = require("../Utils/alertBroadcaster");
const Alert = require("../Models/alert");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "baraamohamed2311@gmail.com",
    pass: process.env.MAILERPASS,
  },
});

const WINDOW_MINUTES = 60; // ±1hr

cron.schedule("* * * * *", async () => {
  try {
    console.log("[cronjob]: Medicationreminder");
    const now = new Date();

    const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60000);
    const windowEnd = new Date(now.getTime() + WINDOW_MINUTES * 60000);

    // IMPORTANT: patient_med_times.take_at is stored in UTC (converted client-side
    // before being saved). We must compare against UTC hours/minutes here too,
    // otherwise the window shifts by the server host's local UTC offset and
    // due meds are silently missed in production (where TZ often differs from dev).
    const fmt = (d) =>
      `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;

    const startTime = fmt(windowStart);
    const endTime = fmt(windowEnd);
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD, UTC

    // Handle windows that cross midnight (e.g. 23:30 -> 00:30 and 01:30), in UTC
    const crossesMidnight = windowStart.getUTCDate() !== windowEnd.getUTCDate();

    const timeCondition = crossesMidnight
      ? `(TIME_FORMAT(pmt.take_at, '%H:%i') >= ? OR TIME_FORMAT(pmt.take_at, '%H:%i') <= ?)`
      : `TIME_FORMAT(pmt.take_at, '%H:%i') BETWEEN ? AND ?`;

    const dueMeds = await executeQuery(
      `
      SELECT
          u.user_name,
          pm.med_id,
          pmt.id AS patient_med_time_id,
          pmt.take_at,
          p.floor_number
      FROM patient_med_times pmt
      JOIN patient_meds pm  ON pmt.patient_med_id = pm.id
      JOIN patients     p   ON pm.user_id = p.user_id
      JOIN users        u   ON u.user_id = p.user_id
      WHERE p.isAssignedToRoom = 1
        AND ${timeCondition}
        AND NOT EXISTS (
          SELECT 1 FROM med_alert_log mal
          WHERE mal.patient_med_time_id = pmt.id
            AND mal.alert_date = ?
        );
      `,
      crossesMidnight ? [startTime, endTime, today] : [startTime, endTime, today]
    );

    if (dueMeds.length === 0) return;

    // Group by floor
    const byFloor = {};
    for (const row of dueMeds) {
      if (!byFloor[row.floor_number]) byFloor[row.floor_number] = [];
      byFloor[row.floor_number].push(row);
    }

    for (const [floor, meds] of Object.entries(byFloor)) {
      const nurses = await executeQuery(
        `
        SELECT u.user_email
        FROM nurses n
        JOIN users u ON n.emp_id = u.user_id
        WHERE n.floor_number = ?
        `,
        [floor]
      );

      if (nurses.length === 0) {
        console.log(`[CRON] No nurses on floor ${floor}`);
        continue;
      }

      // Mark these as sent FIRST (idempotency guard against double-send on race)
      // INSERT IGNORE relies on the UNIQUE KEY to skip dupes safely
      const insertValues = meds.map((m) => [m.patient_med_time_id, today]);
      await executeQuery(
        `INSERT IGNORE INTO med_alert_log (patient_med_time_id, alert_date) VALUES ?`,
        [insertValues]
      );

      // take_at (from MySQL TIME_FORMAT) is "HH:MM:SS" in UTC — keep it as UTC in the
      // stored alert, and give the client structured fields to localize with,
      // instead of baking a pre-formatted, unlocalizable sentence into alert_details.
      const medsPayload = meds.map((m) => ({
        patient_name: m.user_name,
        med_id: m.med_id,
        take_at_utc: m.take_at, // "HH:MM:SS" UTC — client converts to local for display
      }));

      const medListForEmail = meds
        .map((m) => `  - Patient: ${m.user_name} → Medicine ID: ${m.med_id} (scheduled ${m.take_at} UTC)`)
        .join("\n");

      const newAlert = await Alert.create({
        alert_name: `Medication Reminder — Floor ${floor}`,
        alert_type: "medication",
        alert_time: new Date(), // stored as UTC internally by MongoDB (BSON Date)
        alert_status: "active",
        floor_number: Number(floor),
        alert_details: medListForEmail, // kept for backwards compatibility / logs
        meds: medsPayload, // structured, UTC-based — use this for UI rendering
      });

      broadcast(newAlert.toObject());

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: nurses.map((n) => n.user_email).join(", "),
          subject: `💊 Medication Reminder — Floor ${floor}`,
          text: `Hello,\n\nThe following patients on Floor ${floor} have medication due:\n\n${medListForEmail}\n\nPlease administer the medicines promptly.\n\nHospital System`,
        });
      } catch (mailErr) {
        console.error(`[CRON] Email failed for floor ${floor}:`, mailErr.message);
      }

      console.log(
        `[CRON] Reminder sent → floor ${floor} | ${nurses.length} nurse(s) | ${meds.length} patient(s)`
      );
    }
  } catch (err) {
    console.error("[CRON] Medication reminder error:", err.message);
  }
});