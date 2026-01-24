const CompanyUserFactory = require("./CompanyUserFactory");
const executeMySqlQuery = require("../../Utils/executeMySqlQuery");

/**
 * Simplified CompanyUsersMethods class that delegates to CompanyUserFactory
 * Keeps only methods that work across multiple user types
 */
class CompanyUsersMethods {
    
    // ========================================
    // Delegation to Factory Methods
    // ========================================
    
    /**
     * Check if a user title is a valid company user type

     */
    static isCompanyUser(user_title) {
        return CompanyUserFactory.isCompanyUser(user_title);
    }

    /**
     * Check if a user title is a valid hospital user type

     */
    static isHospitalUser(user_title) {
        return CompanyUserFactory.isHospitalUser(user_title);
    }

    /**
     * Get specific data for a user by title

     */
    static async MapUserToGETSpecificDataFunction(user_id, user_title) {
        return await CompanyUserFactory.getSpecificData(user_id, user_title);
    }

    /**
     * Get full data for a user by title

     */
    static async MapUserToGETFullDataFunction(user_id, user_title) {
        return await CompanyUserFactory.getFullData(user_id, user_title);
    }

    /**
     * Update user data (partial update)

     */
    static async MapUserToUpdateFunction(user_id, title, data, actions) {
        console.log(user_id, title, data, actions);
        return await CompanyUserFactory.updateData(user_id, title, data, actions);
    }

    /**
     * Update user data (full/core update)

     */
    static async MapUserToFullUpdateFunction(user_id, title, updating_string) {
        console.log(user_id, title);
        return await CompanyUserFactory.updateFullCore(user_id, title, updating_string);
    }

    // ========================================
    // Cross-User-Type Methods
    // ========================================

    /**
     * Get count of all company employees with optional filters
     */
    static async getAllCompanyEmployeesCOUNT(filtering_string = null, emp_perms = null) { 
        const perms_CONDITION = emp_perms 
            ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT p.perm_name)) > 0` 
            : "";

        const query = `
            SELECT COUNT(*) as total_count
            FROM (
                SELECT u.user_id
                FROM users u
                INNER JOIN employees e ON u.user_id = e.emp_id

                -- Permissions and roles
                LEFT JOIN employee_perms ep ON e.emp_id = ep.emp_id
                LEFT JOIN perms p ON ep.perm_id = p.perm_id
                LEFT JOIN roles r ON e.emp_id = r.emp_id

                WHERE u.user_type = 'employee'
                ${filtering_string ? "AND " + filtering_string : ""}

                GROUP BY u.user_id
                ${perms_CONDITION}
            ) as subquery;
        `;

        const COUNT = await executeMySqlQuery(query);
        return COUNT[0]?.total_count;
    }


    /**
     * Get all company employees with full data and optional filters
     */
    static async getAllCompanyEmployeesFullData(limit = 10, offset = 0, filtering_string = null, emp_perms = null) { 
        const perms_CONDITION = emp_perms 
            ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT p.perm_name)) > 0` 
            : "";

        const query = `
                    SELECT 
                        u.user_id,
                        u.user_email,
                        u.user_name,
                        u.created_at,
                        e.emp_abscence,
                        e.emp_rate,
                        e.emp_salary,
                        e.emp_bonus,
                        e.emp_title,
                        e.emp_specialty,
                        
                        -- Permissions
                        COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                        
                        -- Role
                        COALESCE(r.role_name, 'NormalUser') AS role_name

                    FROM users u
                    INNER JOIN employees e ON u.user_id = e.emp_id

                    -- Permissions and roles
                    LEFT JOIN employee_perms ep ON e.emp_id = ep.emp_id
                    LEFT JOIN perms p ON ep.perm_id = p.perm_id
                    LEFT JOIN roles r ON e.emp_id = r.emp_id

                    WHERE u.user_type = 'employee'
                    ${filtering_string ? "AND " + filtering_string : ""}

                    GROUP BY 
                        u.user_id,
                        u.user_email,
                        u.user_name,
                        u.created_at,
                        e.emp_abscence,
                        e.emp_rate,
                        e.emp_salary,
                        e.emp_bonus,
                        e.emp_specialty,
                        r.role_name

                    ${perms_CONDITION}
                    ORDER BY u.user_id
                    LIMIT ${limit} OFFSET ${offset}
                    `;

        
        const result = await executeMySqlQuery(query);
        
        return result;
    }

    // ========================================
    // Category-based Operations
    // ========================================

    /**
     * Get all employees by category (leadership, technical, medical, etc.)

     */
    static async getEmployeesByCategory(category, limit = 10, offset = 0, whereClause = '') {
        return await CompanyUserFactory.getAllByCategory(category, limit, offset, whereClause);
    }

    /**
     * Get count of employees by category

     */
    static async getEmployeesCategoryCount(category, whereClause = '') {
        return await CompanyUserFactory.getCountByCategory(category, whereClause);
    }

    /**
     * Check if user title is in a specific category

     */
    static isInCategory(user_title, category) {
        return CompanyUserFactory.isInCategory(user_title, category);
    }

    /**
     * Get the category of a user title

     */
    static getUserCategory(user_title) {
        return CompanyUserFactory.getUserCategory(user_title);
    }

    // ========================================
    // Utility Methods
    // ========================================

    /**
     * Get all valid company employee titles

     */
    static getAllValidTitles() {
        return CompanyUserFactory.getAllValidTitles();
    }

    /**
     * Get all employee categories

     */
    static getAllCategories() {
        return CompanyUserFactory.getAllCategories();
    }

    /**
     * Get all titles in a specific category

     */
    static getTitlesByCategory(category) {
        return CompanyUserFactory.getTitlesByCategory(category);
    }
}

module.exports = CompanyUsersMethods;