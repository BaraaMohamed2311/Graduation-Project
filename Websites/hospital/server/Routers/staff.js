const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const AuditLogs = require("../Utils/methods/AuditLogs.js");
const extractUserFromToken = require("../Utils/extractUserFromToken.js");
const User = require("../Classes/User.js");
const executeMySqlQuery = require("../Utils/executeMySqlQuery.js");
const sqlTransaction = require("../Utils/sqlTransaction.js");

// ============================
//              POST
// ============================

router.post("/add-patient-to-staff", jwtVerify, async function (req, res) {
    try {
        const { nurse_id, nurse_email, staff_email, patient_user_id } = req.body;

        // ===1. Validate required fields
        if (!nurse_id || !nurse_email || !staff_email || !patient_user_id) {
            return res.status(400).json({ success: false, message: "Bad Request: missing required fields" });
        }

        // ===2. Verify the requester is indeed a Nurse (from the token, not just the body)
        const tokenFields = extractUserFromToken(req);
        const requesterTitle = await User.getUserTitleByID(tokenFields.user_id);

        if (!requesterTitle || requesterTitle.toLowerCase() !== "nurse") {
            return res.status(403).json({
                success: false,
                message: "Only Nurses are allowed to assign patients to staff"
            });
        }

        // ===3. Confirm nurse_id in body matches the token (prevent spoofing)
        if (parseInt(nurse_id) !== tokenFields.user_id) {
            return res.status(403).json({ success: false, message: "Unauthorized: nurse_id does not match token" });
        }

        // ===4. Resolve staff member by email and validate their title
        const staff_id = await User.getUserIDByEmail(staff_email);
        if (!staff_id) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        const staffTitle = await User.getUserTitleByID(staff_id);
        const allowedTitles = ["doctor", "surgeon"];

        if (!staffTitle || !allowedTitles.includes(staffTitle.toLowerCase())) {
            return res.status(403).json({
                success: false,
                message: "Target staff member must be a Doctor or Surgeon"
            });
        }

        // ===5. Confirm the staff member exists in employees_hospital
        const [staffHospitalRow] = await executeMySqlQuery(
            `SELECT emp_id, emp_title FROM employees_hospital WHERE emp_id = ?`,
            [staff_id]
        );

        if (!staffHospitalRow) {
            return res.status(404).json({ success: false, message: "Staff member is not registered as a hospital employee" });
        }

        // ===6. Confirm the patient exists in the patients table
        const [patientRow] = await executeMySqlQuery(
            `SELECT user_id FROM patients WHERE user_id = ?`,
            [patient_user_id]
        );

        if (!patientRow) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // ===7. Determine the relation_type based on staff title
        const relation_type = staffTitle.charAt(0).toUpperCase() + staffTitle.slice(1).toLowerCase(); // "Doctor" | "Surgeon"

        // ===8. Check if this exact assignment already exists to avoid duplicate primary key error
        const [existingAssignment] = await executeMySqlQuery(
            `SELECT staff_id FROM staff_patient WHERE staff_id = ? AND user_id = ? AND relation_type = ?`,
            [staff_id, patient_user_id, relation_type]
        );

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                message: `Patient is already assigned to this ${relation_type}`
            });
        }

        // ===9. Insert into staff_patient and increment table_version in a transaction
        const insertQuery = `
            INSERT INTO staff_patient (staff_id, user_id, relation_type)
            VALUES (?, ?, ?)
        `;
        console.log("insertQuery",insertQuery)
        // Increment version for mypatients so the frontend cache knows to re-sync
        const versionQuery = `
            INSERT INTO table_version (table_name, current_version)
            VALUES ('mypatients', 1)
            ON DUPLICATE KEY UPDATE current_version = current_version + 1
        `;

        await sqlTransaction(
            [insertQuery, versionQuery],
            [
                [staff_id, patient_user_id, relation_type],
                []
            ]
        );

        // ===10. Audit the action
        await AuditLogs.addLog(
            "hospital",                                                     // site_id
            nurse_id,                                                       // who made the change
            `Nurse assigned patient ${patient_user_id} to ${relation_type} ${staff_email}`, // method/action
            {
                assigned_to: staff_email,
                patient_id: patient_user_id,
                relation_type,
                status: "info"
            }
        );

        return res.status(200).json({
            success: true,
            message: `Patient successfully assigned to ${relation_type} ${staff_email}`
        });

    } catch (err) {
        console.error("Error in add-patient-to-staff:", err);

        // Surface a friendly duplicate-entry message if the transaction race-conditions
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ success: false, message: "Patient is already assigned to this staff member" });
        }

        return res.status(500).json({
            success: false,
            message: err.message || "Error assigning patient to staff"
        });
    }
});

module.exports = router;