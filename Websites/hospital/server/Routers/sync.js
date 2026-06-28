const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const SyncMethods = require("../Utils/methods/SyncMethods.js");

// ============================================================================
//                               GET REQUESTS
// ============================================================================

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
            await SyncMethods.syncListedDoctorDataForPatientBatch(max_version);

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
        const { max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncListedSurgeonDataForPatientBatch(max_version);

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
        const { max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncAllPatientsSpecificData(max_version);

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
        const { max_version } = req.query;

        const { needsSync, latest_version } =
            await SyncMethods.syncAllPatientsSpecificData(max_version);
        console.log("before sync" , latest_version)
        res.json({ success: true, needsSync, latest_version });

    } catch (err) {
        console.error("Error List My Patients", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// ============================================================================
//                               PUT REQUESTS
// Client calls these after successfully fetching fresh data, to confirm the
// local cache is now up to date. We increment the DB version so the next
// GET sync check returns needsSync: false for any client already on this version.
// ============================================================================

// =================================
//  Put Employees Data Sync
// =================================
router.put("/employees", async (req, res) => {
    try {
        await SyncMethods.incrementVersion("hospital_employees");
        const { latest_version } =
            await SyncMethods.syncAllHospitalEmployeesFullData(undefined);

        res.json({ success: true, latest_version });
    } catch (err) {
        console.error("Error Syncing Employees Data via PUT", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =================================
//  Put Doctors Data Sync
// =================================
router.put("/doctors", async (req, res) => {
    try {
        await SyncMethods.incrementVersion("hospital_employees");
        const { latest_version } =
            await SyncMethods.syncListedDoctorDataForPatientBatch(undefined);

        res.json({ success: true, latest_version });
    } catch (err) {
        console.error("Error Syncing Doctors Data via PUT", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =================================
//  Put Surgeons Data Sync
// =================================
router.put("/surgeons", async (req, res) => {
    try {
        await SyncMethods.incrementVersion("hospital_employees");
        const { latest_version } =
            await SyncMethods.syncListedSurgeonDataForPatientBatch(undefined);

        res.json({ success: true, latest_version });
    } catch (err) {
        console.error("Error Syncing Surgeons Data via PUT", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =================================
//  Put Patients Data Sync
// =================================
router.put("/patients", async (req, res) => {
    try {
        await SyncMethods.incrementVersion("patients");
        const { latest_version } =
            await SyncMethods.syncAllPatientsSpecificData(undefined);

        res.json({ success: true, latest_version });
    } catch (err) {
        console.error("Error Syncing Patients Data via PUT", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =================================
//  Put My Patients Data Sync
// =================================
router.put("/mypatients", async (req, res) => {
    try {
        console.log("put mypatients triggered")
        await SyncMethods.incrementVersion("patients");
        const { latest_version } =
            await SyncMethods.syncDoctorRangedPatientsBatch(undefined);

        res.json({ success: true, latest_version });
    } catch (err) {
        console.error("Error Syncing My Patients Data via PUT", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


module.exports = router;