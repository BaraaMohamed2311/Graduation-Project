const executeMySqlQuery = require("../executeMySqlQuery");

class SyncMethods {

    // ================================================
    // Helper: increment version for a table
    // ================================================
    static async incrementVersion(table_name) {
        const query = `
            UPDATE table_version
            SET current_version = current_version + 1
            WHERE table_name = ?;
        `;
        await executeMySqlQuery(query, [table_name]);
    }

    // ================================================
    // 1) Employees full data (global version)
    // ================================================
    static async syncAllHospitalEmployeesFullData(max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'hospital_employees';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;
        console.log("globalVersion > max_version",globalVersion , max_version)
        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

   

    // ================================================
    // 2) Listed doctors for patient batch (employees)
    // ================================================
    static async syncListedDoctorDataForPatientBatch(max_version) {
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
    static async syncListedSurgeonDataForPatientBatch(max_version) {
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
    static async syncAllPatientsSpecificData(max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'patients';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;
        console.log("max_version",max_version, globalVersion)
        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

    // ================================================
    // 5) Doctor ranged patients (patients global version)
    // ================================================
    static async syncDoctorRangedPatientsBatch(max_version) {
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
    // 6) Doctors-specific data track
    // ================================================
    static async syncAllDoctorsFullData(max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'doctors';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;

        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

    // ================================================
    // 7) Surgeons-specific data track
    // ================================================
    static async syncAllSurgeonsFullData(max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'surgeons';
        `;
        const versionResult = await executeMySqlQuery(versionQuery);
        const globalVersion = versionResult[0]?.current_version ?? 0;

        return {
            needsSync: fallbackToDB || (max_version < globalVersion),
            latest_version: globalVersion
        };
    }

    // ================================================
    // 8) Nurses-specific data track
    // ================================================
    static async syncAllNursesFullData(max_version) {
        const fallbackToDB = !max_version || max_version === "undefined" || max_version === "null";

        const versionQuery = `
            SELECT current_version
            FROM table_version
            WHERE table_name = 'nurses';
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