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

// Runs every 30mins
cron.schedule("*/30 * * * *", async () => {
  try {
    console.log("[cronjob]: Medicationreminder");
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;

    const dueMeds = await executeQuery(
      `
      SELECT
          u.user_name,
          pm.med_id,
          pmt.take_at,
          p.floor_number
      FROM patient_med_times pmt
      JOIN patient_meds pm  ON pmt.patient_med_id = pm.id
      JOIN patients     p   ON pm.user_id = p.user_id
      JOIN users        u   ON u.user_id = p.user_id
      WHERE p.isAssignedToRoom = 1
        AND TIME_FORMAT(pmt.take_at, '%H:%i') = ?;
      `,
      [currentTime]
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

      const medList = meds
        .map((m) => `  - Patient: ${m.user_name} → Medicine ID: ${m.med_id}`)
        .join("\n");

      // Save + broadcast FIRST — email failure must never block the real-time alert
      const newAlert = await Alert.create({
        alert_name: `Medication Reminder — Floor ${floor}`,
        alert_type: "medication",
        alert_time: new Date(),
        alert_status: "active",
        alert_details: meds
          .map((m) => `Patient: ${m.user_name} → Med ID: ${m.med_id}`)
          .join(" | "),
      });

      broadcast(newAlert.toObject());

      // Email is best-effort — its failure must never crash the loop iteration
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: nurses.map((n) => n.user_email).join(", "),
          subject: `💊 Medication Reminder — Floor ${floor} — ${currentTime}`,
          text: `Hello,\n\nThe following patients on Floor ${floor} need their medication at ${currentTime}:\n\n${medList}\n\nPlease administer the medicines promptly.\n\nHospital System`,
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