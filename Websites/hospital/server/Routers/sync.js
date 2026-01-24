const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const SyncMethods = require("../Utils/methods/SyncMethods.js");

// =================================
//  Get All Employees Data Sync
// =================================
router.get("/employees", async (req, res) => {
    try {
        const {  max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncAllHospitalEmployeesFullData( max_version);

        res.json({ success: true, needsSync, latest_version });

    } catch (err) {
        console.error("Error List Employees Profile Data", err);
        res.status(500).json({ success: false, message: "Error List Employees Data" });
    }
});


// =================================
//  Get All Doctors Data Sync
// =================================
router.get("/doctors", async (req, res) => {
    try {
        const { max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncListedDoctorDataForPatientBatch( max_version);

        res.json({ success: true, needsSync, latest_version });

    } catch (err) {
        console.error("Error List Doctors", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// =================================
//  Get All Surgeons Data Sync
// =================================
router.get("/surgeons", async (req, res) => {
    try {
        const {  max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncListedSurgeonDataForPatientBatch( max_version);

        res.json({ success: true, needsSync, latest_version });

    } catch (err) {
        console.error("Error List Surgeons", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =================================
//  Get All Patients Data Sync
// =================================
router.get("/patients", async (req, res) => {
    try {
        const {  max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncAllPatientsSpecificData( max_version);
        console.log("needsSync, latest_version",needsSync, latest_version)
        res.json({ success: true, needsSync, latest_version });

    } catch (err) {
        console.error("Error List Patients", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// =================================
//  Get My Patients Data Sync (for Doctors)
// =================================
router.get("/mypatients", async (req, res) => {
    try {

        const {  max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncDoctorRangedPatientsBatch(max_version);

        res.json({ success: true, needsSync, latest_version });

    } catch (err) {
        console.error("Error List My Patients", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


module.exports = router;
