const express = require("express");
const router = express.Router();
const executeQuery = require("../Utils/executeMySqlQuery");

const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

function validateTimes(times) {
  return Array.isArray(times) && times.length > 0 && times.every((t) => TIME_REGEX.test(t));
}

// GET /patient-meds
// Returns every assignment with its scheduled times aggregated.
// NOTE: scheduled_times returned here are stored/returned as UTC "HH:MM" strings.
// The client is responsible for converting to/from the user's local time.
router.get("/patient-meds", async (req, res) => {
  try {
    const { user_id } = req.query;
    const rows = await executeQuery(`
      SELECT
        pm.id             AS assignment_id,
        pm.user_id,
        pm.med_id,
        p.floor_number    AS patient_floor,
        u.user_email      AS patient_email,
        GROUP_CONCAT(
          TIME_FORMAT(pmt.take_at, '%H:%i')
          ORDER BY pmt.take_at
          SEPARATOR ', '
        )                 AS scheduled_times
      FROM patient_meds pm
      JOIN patients  p   ON pm.user_id      = p.user_id
      JOIN users     u   ON p.user_id        = u.user_id
      LEFT JOIN patient_med_times pmt ON pmt.patient_med_id = pm.id
      WHERE p.isAssignedToRoom = 1 AND u.user_id = ?
      GROUP BY pm.id
      ORDER BY pm.user_id, pm.med_id
    `, [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /patient-meds
// Body: { user_id, med_id, times: ["08:00", "14:00", "20:00"] }
// IMPORTANT: `times` must already be converted to UTC by the caller (client) before this is called.
router.post("/patient-meds", async (req, res) => {
  try {
    const { user_id, med_id, times } = req.body;

    if (!user_id || !med_id || !validateTimes(times)) {
      return res.status(400).json({
        success: false,
        message: "user_id, med_id, and times[] (valid HH:MM strings, in UTC) are required",
      });
    }

    const [patient] = await executeQuery(
      `SELECT user_id FROM patients WHERE user_id = ? AND isAssignedToRoom = 1`,
      [user_id]
    );
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or not currently assigned to a room",
      });
    }

    // Insert the assignment row
    const result = await executeQuery(
      `INSERT INTO patient_meds (user_id, med_id) VALUES (?, ?)`,
      [user_id, med_id]
    );
    const patient_med_id = result.insertId;

    // Insert one row per scheduled time (already UTC)
    for (const time of times) {
      await executeQuery(
        `INSERT INTO patient_med_times (patient_med_id, take_at) VALUES (?, ?)`,
        [patient_med_id, time]
      );
    }

    res.status(201).json({ id: patient_med_id, user_id, med_id, times });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/patient-meds/:id", async (req, res) => {
  try {
    const { times } = req.body;
    const assignmentId = req.params.id;

    if (!validateTimes(times)) {
      return res.status(400).json({
        success: false,
        message: "times[] (valid HH:MM strings, in UTC) is required",
      });
    }

    // Ensure assignment exists
    const [assignment] = await executeQuery(
      `SELECT id FROM patient_meds WHERE id = ?`,
      [assignmentId]
    );
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

    // Delete old times
    await executeQuery(
      `DELETE FROM patient_med_times WHERE patient_med_id = ?`,
      [assignmentId]
    );

    // Insert new times (already UTC)
    for (const time of times) {
      await executeQuery(
        `INSERT INTO patient_med_times (patient_med_id, take_at) VALUES (?, ?)`,
        [assignmentId, time]
      );
    }

    res.json({ message: "Times updated successfully", assignmentId, times });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /patient-meds/:id
// Deletes assignment + cascades to its times
router.delete("/patient-meds/:id", async (req, res) => {
  try {
    const result = await executeQuery(
      `DELETE FROM patient_meds WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;