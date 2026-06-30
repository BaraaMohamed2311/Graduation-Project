const DoctorMethods = require("../../Utils/methods/DoctorMethods");
const NurseMethods = require("../../Utils/methods/NurseMethods");
const SurgeonMethods = require("../../Utils/methods/SurgeonMethods");
const PatientMethods = require("../../Utils/methods/PatientMethods");
const generalUserMethods = require("../../Utils/methods/generalUserMethods");

/**
 * Factory class for mapping user titles to their respective method classes
 * Centralizes all user-type-specific operations
 */
class HospitalUserFactory {
    static #hospital_users = new Set(["doctor", "nurse", "surgeon", "patient","manager","hr"]);

    // ========================================
    // Method Class Mapping
    // ========================================
    static #methodClassMap = {
        "Doctor": DoctorMethods,
        "Surgeon": SurgeonMethods,
        "Nurse": NurseMethods,
        "Patient": PatientMethods,
        "Manager": generalUserMethods,
        "HR": generalUserMethods,
    };

    // ========================================
    // Specific Data Methods
    // ========================================
    static #specificDataMethods = {
        "Doctor": DoctorMethods.getDoctorSpecificData,
        "Surgeon": SurgeonMethods.getSurgeonSpecificData,
        "Nurse": NurseMethods.getNurseSpecificData,
        "Patient": PatientMethods.getPatientSpecificData,
        "Manager": generalUserMethods.getUserSpecific,
        "HR": generalUserMethods.getUserSpecific,
    };

    // ========================================
    // Full Data Methods
    // ========================================
    static #fullDataMethods = {
        "Doctor": DoctorMethods.getDoctorFullData,
        "Surgeon": SurgeonMethods.getSurgeonFullData,
        "Nurse": NurseMethods.getNurseFullData,
        "Patient": PatientMethods.getPatientFullData,
        "Manager": generalUserMethods.getUserFullData,
        "HR": generalUserMethods.getUserFullData,
    };

    // ========================================
    // All Full Data Methods (with pagination)
    // ========================================
    static #allFullDataMethods = {
        "Doctor": DoctorMethods.getAllDoctorsFullData,
        "Surgeon": SurgeonMethods.getAllSurgeonsFullData,
        "Nurse": NurseMethods.getAllNursesFullData,
        "Patient": PatientMethods.getAllPatientsSpecificData, // Patients use specific data
        "Manager": generalUserMethods.getAllUsersFullData,
        "HR": generalUserMethods.getAllUsersFullData,
    };

    // ========================================
    // Count Methods
    // ========================================
    static #countMethods = {
        "Doctor": DoctorMethods.getAllDoctorsCOUNT,
        "Surgeon": SurgeonMethods.getAllSurgeonsCOUNT,
        "Nurse": NurseMethods.getAllNursesCOUNT,
        "Patient": PatientMethods.getAllPatientsCOUNT,
        "Manager": generalUserMethods.getAllUsersCOUNT,
        "HR": generalUserMethods.getAllUsersCOUNT,
    };

    // ========================================
    // Update Methods (Partial)
    // ========================================
    static #updateMethods = {
        "Doctor": DoctorMethods.MapToUpdateDoctorData,
        "Surgeon": SurgeonMethods.MapToUpdateSurgeonData,
        "Nurse": NurseMethods.MapToUpdateNurseData,
        "Patient": PatientMethods.MapToUpdatePatientData,
    };

    // ========================================
    // Update Methods (Full/Core)
    // ========================================
    static #fullUpdateMethods = {
        "Doctor": DoctorMethods.updateDoctorFullCore,
        "Surgeon": SurgeonMethods.updateSurgeonFullCore,
        "Nurse": NurseMethods.updateNurseFullCore,
        "Patient": PatientMethods.updatePatientFullCore,
        "default": generalUserMethods.updateUserFullCore
    };

    // ========================================
// Availability Methods (Get)
// ========================================
static #availabilityGetMethods = {
    "Doctor":  DoctorMethods.getDoctorAvailability,
    "Surgeon": SurgeonMethods.getSurgeonAvailability,
    "Nurse":   NurseMethods.getNurseAvailability,
    "Manager": generalUserMethods.getUserAvailability,
    "HR":      generalUserMethods.getUserAvailability,
};

// ========================================
// Availability Methods (Update)
// ========================================
static #availabilityUpdateMethods = {
    "Doctor":  DoctorMethods.updateDoctorAvailability,
    "Surgeon": SurgeonMethods.updateSurgeonAvailability,
    "Nurse":   NurseMethods.updateNurseAvailability,
    "Manager": generalUserMethods.updateUserAvailability,
    "HR":      generalUserMethods.updateUserAvailability,
};

static async getAvailability(hosp_emp_id, user_title) {
    this.#validateUserTitle(user_title);
    const method = this.#availabilityGetMethods[user_title];
    if (!method) return "None";
    try {
        return (await method.call(this.#methodClassMap[user_title], hosp_emp_id)) || "None";
    } catch (err) {
        console.error(`Error in getAvailability for ${user_title}:`, err);
        return "None";
    }
}

static async updateAvailability(hosp_emp_id, user_title, availabilityString) {
    this.#validateUserTitle(user_title);
    const method = this.#availabilityUpdateMethods[user_title];
    if (!method) return false;
    return await method.call(this.#methodClassMap[user_title], hosp_emp_id, availabilityString);
}

    // ========================================
    // Validation Methods
    // ========================================

    

    static isHospitalUser(user_title) {
        if (!user_title) return false;
        return this.#hospital_users.has(user_title.toLowerCase());
    }

    static #validateUserTitle(user_title) {
        if (!user_title) {
            throw new Error("User title is required");
        }
        if (!this.#methodClassMap[user_title]) {
            throw new Error(`Invalid user title: ${user_title}`);
        }
    }

    // ========================================
    // Get Method Class
    // ========================================
    

    static getMethodClass(user_title) {
        this.#validateUserTitle(user_title);
        return this.#methodClassMap[user_title];
    }

    // ========================================
    // Execute Methods by Title
    // ========================================
// ========================================
// My Patients Count Methods (staff-scoped)
// ========================================
static #myPatientCountMethods = {
    "Doctor":  DoctorMethods.getDoctorAllPatientsCOUNT.bind(DoctorMethods),
    "Surgeon": SurgeonMethods.getSurgeonAllPatientsCOUNT.bind(SurgeonMethods),
};

// ========================================
// My Patients Ranged Methods (staff-scoped)
// ========================================
static #myPatientRangedMethods = {
    "Doctor":  DoctorMethods.getDoctorRangedPatients.bind(DoctorMethods),
    "Surgeon": SurgeonMethods.getSurgeonRangedPatients.bind(SurgeonMethods),
};

static getMyPatientCountMethod(user_title) {
    return this.#myPatientCountMethods[user_title] || null;
}

static async getStaffRangedPatients(staff_id, limit, offset, filtering_string = null, user_title) {
    const method = this.#myPatientRangedMethods[user_title];
    if (!method) return [];
    return await method(staff_id, limit, offset, filtering_string);
}

    /**
 * Get specific data for a user
 */
static async getSpecificData(user_id, user_title) {
    this.#validateUserTitle(user_title);
    const method = this.#specificDataMethods[user_title];
    if (!method || typeof method !== "function") return {}; // default empty object
    try {
        return (await method.call(this.#methodClassMap[user_title], user_id)) || {};
    } catch (err) {
        console.error(`Error in getSpecificData for ${user_title}:`, err);
        return {};
    }
}

    /**
     * Get full data for a user
     */
    static async getFullData(user_id, user_title) {
        this.#validateUserTitle(user_title);
        const method = this.#fullDataMethods[user_title];
        if (!method || typeof method !== "function") return {}; // default empty object
        try {
            return (await method.call(this.#methodClassMap[user_title], user_id)) || {};
        } catch (err) {
            console.error(`Error in getFullData for ${user_title}:`, err);
            return {};
        }
    }

    /**
     * Get all users of a type (with pagination)
     */
    static async getAllFullData(user_title, limit = 10, offset = 0, whereClause = '', perms_CONDITION = '') {
        this.#validateUserTitle(user_title);
        const method = this.#allFullDataMethods[user_title];
        if (!method || typeof method !== "function") return []; // default empty array
        try {
            return (await method.call(this.#methodClassMap[user_title], limit, offset, whereClause, perms_CONDITION)) || [];
        } catch (err) {
            console.error(`Error in getAllFullData for ${user_title}:`, err);
            return [];
        }
    }

    /**
     * Get count of all users of a type
     */
    static async getCount(user_title, whereClause = '', perms_CONDITION = '') {
        this.#validateUserTitle(user_title);
        const method = this.#countMethods[user_title];
        if (!method) return 0;
        return await method.call(this.#methodClassMap[user_title], whereClause, perms_CONDITION);
    }

    /**
     * Update user data (partial update)
     */
    static async updateData(user_id, user_title, data, actions) {
        this.#validateUserTitle(user_title);
        const method = this.#updateMethods[user_title];
        if (!method) return false;
        return await method.call(this.#methodClassMap[user_title], user_id, data, actions);
    }

    /**
     * Update user data (full/core update)
     */
    static async updateFullCore(user_id, user_title, updatingObj) {
    this.#validateUserTitle(user_title);

    // Fallback to "default" if the specific user_title isn't registered
    const method = this.#fullUpdateMethods[user_title] || this.#fullUpdateMethods["default"];
    const targetClass = this.#methodClassMap[user_title] || this.#methodClassMap["default"];

    if (!method || !targetClass) return false;

    return await method.call(targetClass, user_id, updatingObj);
}

    // ========================================
    // Specialized Methods
    // ========================================

    /**
     * Get patients for a doctor
     */
    static async getDoctorPatients(staff_id, limit, offset, filtering_string = null) {
        return await DoctorMethods.getDoctorRangedPatients(staff_id, limit, offset, filtering_string);
    }

    /**
     * Get count of doctor's patients
     */
    static async getDoctorPatientsCount(staff_id) {
        const result = await DoctorMethods.getDoctorAllPatientsCOUNT(staff_id);
        return result?.count || 0;
    }

    /**
     * Update doctor-patient relationship
     */
    static async updateDoctorPatient(emp_id, user_id, data) {
        return await DoctorMethods.updateDoctorPatient(emp_id, user_id, data);
    }

    /**
     * Replace doctor availability schedule
     */
    static async replaceDoctorAvailability(emp_id, data) {
        return await DoctorMethods.replaceDoctorAvailability(emp_id, data);
    }

    /**
     * Get listed doctors for patient view
     */
    static async getListedDoctorsForPatient(limit, offset, filtering_string, orderByClause) {
        return await PatientMethods.getListedDoctorDataForPaitent(limit, offset, filtering_string, orderByClause);
    }

    /**
     * Get listed surgeons for patient view
     */
    static async getListedSurgeonsForPatient(limit, offset, filtering_string, orderByClause) {
        return await PatientMethods.getListedSurgeonDataForPaitent(limit, offset, filtering_string, orderByClause);
    }

    /**
     * Delete patient and cascade related data
     */
    static async deletePatient(user_id) {
        return await PatientMethods.cascadeDeletePatientData(user_id);
    }
}

module.exports = HospitalUserFactory;