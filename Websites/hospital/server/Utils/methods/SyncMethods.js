const executeMySqlQuery = require("../executeMySqlQuery");

class SyncMethods {

    // ================================================
    // 1) Employees full data (global version)
    // ================================================
    static async syncAllHospitalEmployeesFullData( max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        // fetch global version for employees
        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'hospital_employees';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;

        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

    // ================================================
    // 2) Listed doctors for patient batch (employees)
    // ================================================
    static async syncListedDoctorDataForPatientBatch( max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'hospital_employees';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;

        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

    // ================================================
    // 3) Listed surgeons for patient batch (employees)
    // ================================================
    static async syncListedSurgeonDataForPatientBatch( max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'hospital_employees';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;

        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

    // ================================================
    // 4) Patients specific data (global version)
    // ================================================
    static async syncAllPatientsSpecificData( max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'patients';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;

        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

    // ================================================
    // 5) Doctor ranged patients (patients global version)
    // ================================================
    static async syncDoctorRangedPatientsBatch( max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'patients';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;

        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

}

module.exports = SyncMethods;
