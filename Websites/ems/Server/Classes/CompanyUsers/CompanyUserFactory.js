const CEOMethods = require("../../Utils/methods/CEOMethods");
const CloudEngineerMethods = require("../../Utils/methods/CloudEngineerMethods");
const DesignerMethods = require("../../Utils/methods/DesignerMethods");
const DeveloperMethods = require("../../Utils/methods/DeveloperMethods");
const DevOpsEngineerMethods = require("../../Utils/methods/DevOpsEngineerMethods");
const DoctorMethods = require("../../Utils/methods/DoctorMethods");
const EngineerMethods = require("../../Utils/methods/EngineerMethods");
const HRMethods = require("../../Utils/methods/HRMethods");
const InternMethods = require("../../Utils/methods/InternMethods");
const NurseMethods = require("../../Utils/methods/NurseMethods");
const ScientistMethods = require("../../Utils/methods/ScientistMethods");
const SurgeonMethods = require("../../Utils/methods/SurgeonMethods");

/**
 * Factory class for mapping company employee titles to their respective method classes
 * Centralizes all employee-type-specific operations
 */
class CompanyUserFactory {
    static #company_users = new Set([
        "ceo",
        "cloud engineer",
        "designer",
        "developer",
        "devops engineer",
        "doctor",
        "engineer",
        "hr",
        "intern",
        "nurse",
        "scientist",
        "surgeon"
    ]);

    // ========================================
    // Method Class Mapping
    // ========================================
    static #methodClassMap = {
        "CEO": CEOMethods,
        "Cloud Engineer": CloudEngineerMethods,
        "Designer": DesignerMethods,
        "Developer": DeveloperMethods,
        "DevOps Engineer": DevOpsEngineerMethods,
        "Doctor": DoctorMethods,
        "Engineer": EngineerMethods,
        "HR": HRMethods,
        "Intern": InternMethods,
        "Nurse": NurseMethods,
        "Scientist": ScientistMethods,
        "Surgeon": SurgeonMethods,
    };

    // ========================================
    // Specific Data Methods
    // ========================================
    static #specificDataMethods = {
        "CEO": CEOMethods.getCEOSpecificData,
        "Cloud Engineer": CloudEngineerMethods.getCloudEngineerSpecificData,
        "Designer": DesignerMethods.getDesignerSpecificData,
        "Developer": DeveloperMethods.getDeveloperSpecificData,
        "DevOps Engineer": DevOpsEngineerMethods.getDevOpsEngineerSpecificData,
        "Doctor": DoctorMethods.getDoctorSpecificData,
        "Engineer": EngineerMethods.getEngineerSpecificData,
        "HR": HRMethods.getHRSpecificData,
        "Intern": InternMethods.getInternSpecificData,
        "Nurse": NurseMethods.getNurseSpecificData,
        "Scientist": ScientistMethods.getScientistSpecificData,
        "Surgeon": SurgeonMethods.getSurgeonSpecificData,
    };

    // ========================================
    // Full Data Methods
    // ========================================
    static #fullDataMethods = {
        "CEO": CEOMethods.getCEOFullData,
        "Cloud Engineer": CloudEngineerMethods.getCloudEngineerFullData,
        "Designer": DesignerMethods.getDesignerFullData,
        "Developer": DeveloperMethods.getDeveloperFullData,
        "DevOps Engineer": DevOpsEngineerMethods.getDevOpsEngineerFullData,
        "Doctor": DoctorMethods.getDoctorFullData,
        "Engineer": EngineerMethods.getEngineerFullData,
        "HR": HRMethods.getHRFullData,
        "Intern": InternMethods.getInternFullData,
        "Nurse": NurseMethods.getNurseFullData,
        "Scientist": ScientistMethods.getScientistFullData,
        "Surgeon": SurgeonMethods.getSurgeonFullData,
    };

    // ========================================
    // All Full Data Methods (with pagination)
    // ========================================
    static #allFullDataMethods = {
        "CEO": CEOMethods.getAllCEOsFullData,
        "Cloud Engineer": CloudEngineerMethods.getAllCloudEngineersFullData,
        "Designer": DesignerMethods.getAllDesignersFullData,
        "Developer": DeveloperMethods.getAllDevelopersFullData,
        "DevOps Engineer": DevOpsEngineerMethods.getAllDevOpsEngineersFullData,
        "Doctor": DoctorMethods.getAllDoctorsFullData,
        "Engineer": EngineerMethods.getAllEngineersFullData,
        "HR": HRMethods.getAllHRsFullData,
        "Intern": InternMethods.getAllInternsFullData,
        "Nurse": NurseMethods.getAllNursesFullData,
        "Scientist": ScientistMethods.getAllScientistsFullData,
        "Surgeon": SurgeonMethods.getAllSurgeonsFullData,
    };

    // ========================================
    // Count Methods
    // ========================================
    static #countMethods = {
        "CEO": CEOMethods.getAllCEOsCOUNT,
        "Cloud Engineer": CloudEngineerMethods.getAllCloudEngineersCOUNT,
        "Designer": DesignerMethods.getAllDesignersCOUNT,
        "Developer": DeveloperMethods.getAllDevelopersCOUNT,
        "DevOps Engineer": DevOpsEngineerMethods.getAllDevOpsEngineersCOUNT,
        "Doctor": DoctorMethods.getAllDoctorsCOUNT,
        "Engineer": EngineerMethods.getAllEngineersCOUNT,
        "HR": HRMethods.getAllHRsCOUNT,
        "Intern": InternMethods.getAllInternsCOUNT,
        "Nurse": NurseMethods.getAllNursesCOUNT,
        "Scientist": ScientistMethods.getAllScientistsCOUNT,
        "Surgeon": SurgeonMethods.getAllSurgeonsCOUNT,
    };

    // ========================================
    // Update Methods (Partial)
    // ========================================
    static #updateMethods = {
        "CEO": CEOMethods.MapToUpdateCEOData,
        "Cloud Engineer": CloudEngineerMethods.MapToUpdateCloudEngineerData,
        "Designer": DesignerMethods.MapToUpdateDesignerData,
        "Developer": DeveloperMethods.MapToUpdateDeveloperData,
        "DevOps Engineer": DevOpsEngineerMethods.MapToUpdateDevOpsEngineerData,
        "Doctor": DoctorMethods.MapToUpdateDoctorData,
        "Engineer": EngineerMethods.MapToUpdateEngineerData,
        "HR": HRMethods.MapToUpdateHRData,
        "Intern": InternMethods.MapToUpdateInternData,
        "Nurse": NurseMethods.MapToUpdateNurseData,
        "Scientist": ScientistMethods.MapToUpdateScientistData,
        "Surgeon": SurgeonMethods.MapToUpdateSurgeonData,
    };

    // ========================================
    // Update Methods (Full/Core)
    // ========================================
    static #fullUpdateMethods = {
        "CEO": CEOMethods.updateCEOFullCore,
        "Cloud Engineer": CloudEngineerMethods.updateCloudEngineerFullCore,
        "Designer": DesignerMethods.updateDesignerFullCore,
        "Developer": DeveloperMethods.updateDeveloperFullCore,
        "DevOps Engineer": DevOpsEngineerMethods.updateDevOpsEngineerFullCore,
        "Doctor": DoctorMethods.updateDoctorFullCore,
        "Engineer": EngineerMethods.updateEngineerFullCore,
        "HR": HRMethods.updateHRFullCore,
        "Intern": InternMethods.updateInternFullCore,
        "Nurse": NurseMethods.updateNurseFullCore,
        "Scientist": ScientistMethods.updateScientistFullCore,
        "Surgeon": SurgeonMethods.updateSurgeonFullCore,
    };

    // ========================================
    // Role Categories
    // ========================================
    static #roleCategories = {
        leadership: ["CEO", "HR"],
        technical: ["Cloud Engineer", "Developer", "DevOps Engineer", "Engineer"],
        medical: ["Doctor", "Nurse", "Surgeon"],
        creative: ["Designer"],
        research: ["Scientist"],
        trainee: ["Intern"]
    };

    // ========================================
    // Validation Methods
    // ========================================
    
    /**
     * Check if a user title is a valid company user type

     */
    static isCompanyUser(user_title) {
        if (!user_title) return false;
        return this.#company_users.has(user_title.toLowerCase());
    }

    /**
     * Check if a user title is a valid hospital user type

     */
    static isHospitalUser(user_title) {
        if (!user_title) return false;
        return this.#company_users.has(user_title.toLowerCase());
    }

    /**
     * Validate user title and throw error if invalid

     */
    static #validateUserTitle(user_title) {
        if (!user_title) {
            throw new Error("User title is required");
        }
        if (!this.#methodClassMap[user_title]) {
            throw new Error(`Invalid user title: ${user_title}. Valid titles: ${Object.keys(this.#methodClassMap).join(', ')}`);
        }
    }

    /**
     * Get the category of a user title

     */
    static getUserCategory(user_title) {
        for (const [category, titles] of Object.entries(this.#roleCategories)) {
            if (titles.includes(user_title)) {
                return category;
            }
        }
        return null;
    }

    /**
     * Check if a user title belongs to a specific category

     */
    static isInCategory(user_title, category) {
        const categoryTitles = this.#roleCategories[category];
        return categoryTitles ? categoryTitles.includes(user_title) : false;
    }

    /**
     * Get all titles in a category

     */
    static getTitlesByCategory(category) {
        return this.#roleCategories[category] || [];
    }

    // ========================================
    // Get Method Class
    // ========================================
    
    /**
     * Get the method class for a specific user title

     */
    static getMethodClass(user_title) {
        this.#validateUserTitle(user_title);
        return this.#methodClassMap[user_title];
    }

    // ========================================
    // Execute Methods by Title
    // ========================================

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
    static async updateFullCore(user_id, user_title, updating_string) {
        this.#validateUserTitle(user_title);
        const method = this.#fullUpdateMethods[user_title];
        if (!method) return false;
        return await method.call(this.#methodClassMap[user_title], user_id, updating_string);
    }

    // ========================================
    // Batch Operations by Category
    // ========================================

    /**
     * Get all users in a category

     */
    static async getAllByCategory(category, limit = 10, offset = 0, whereClause = '') {
        const titles = this.getTitlesByCategory(category);
        if (!titles.length) return [];

        const results = [];
        for (const title of titles) {
            const data = await this.getAllFullData(title, limit, offset, whereClause);
            results.push(...data.map(item => ({ ...item, category })));
        }
        return results;
    }

    /**
     * Get count of all users in a category

     */
    static async getCountByCategory(category, whereClause = '') {
        const titles = this.getTitlesByCategory(category);
        if (!titles.length) return 0;

        let total = 0;
        for (const title of titles) {
            const count = await this.getCount(title, whereClause);
            total += count;
        }
        return total;
    }

    // ========================================
    // Utility Methods
    // ========================================

    /**
     * Get all valid company user titles
     * @returns {Array<string>}
     */
    static getAllValidTitles() {
        return Object.keys(this.#methodClassMap);
    }

    /**
     * Get all categories
     * @returns {Array<string>}
     */
    static getAllCategories() {
        return Object.keys(this.#roleCategories);
    }

    /**
     * Check if a method exists for a user title

     */
    static hasMethod(user_title, methodType) {
        const maps = {
            'specific': this.#specificDataMethods,
            'full': this.#fullDataMethods,
            'count': this.#countMethods,
            'update': this.#updateMethods,
            'fullUpdate': this.#fullUpdateMethods
        };
        const map = maps[methodType];
        return map ? !!map[user_title] : false;
    }
}

module.exports = CompanyUserFactory;