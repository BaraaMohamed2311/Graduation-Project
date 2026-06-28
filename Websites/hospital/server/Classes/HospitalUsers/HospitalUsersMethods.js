const HospitalUserFactory = require("./HospitalUserFactory");
const executeMySqlQuery = require("../../Utils/executeMySqlQuery");

/**
 * Simplified HospitalUsersMethods class that delegates to HospitalUserFactory
 * Keeps only methods that work across multiple user types
 */
class HospitalUsersMethods {
    
    // ========================================
    // Delegation to Factory Methods
    // ========================================
    
    static isHospitalUser(user_title) {
        return HospitalUserFactory.isHospitalUser(user_title);
    }

    static async MapUserToGETSpecificDataFunction(user_id, user_title) {
        return await HospitalUserFactory.getSpecificData(user_id, user_title);
    }

    static async MapUserToGETFullDataFunction(user_id, user_title) {
        return await HospitalUserFactory.getFullData(user_id, user_title);
    }

    static async MapUserToUpdateFunction(user_id, title, data, actions) {
        return await HospitalUserFactory.updateData(user_id, title, data, actions);
    }

    static async MapUserToFullUpdateFunction(user_id, title, updatingObj ) {
        return await HospitalUserFactory.updateFullCore(user_id, title, updatingObj);
    }

    // ========================================
    // Cross-User-Type Methods
    // ========================================

    /**
     * Check if a patient belongs to a staff member
     */
    static async patientBelongsToStaff(staff_id, user_id) { 
        const query = `
            SELECT EXISTS (
                SELECT 1
                FROM staff_patient sp
                JOIN patients p 
                    ON sp.user_id = p.user_id
                WHERE sp.staff_id = ? 
                AND sp.user_id = ? AND relation_type = 'Doctor'
            ) AS patient_exists;
        `;

        const result = await executeMySqlQuery(query, [staff_id, user_id]);
        return !!result[0].patient_exists;
    }

    /**
 * Get count of all hospital employees with optional filters
 * OPTIMIZED VERSION
 */
static async getAllHospitalEmployeesCOUNT(filtering_string = null, emp_perms = null) { 
    const perms_CONDITION = emp_perms 
        ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` 
        : "";

    const query = `
        SELECT COUNT(DISTINCT u.user_id) as total_count
        FROM users u
        INNER JOIN employees e ON u.user_id = e.emp_id
        INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id
        INNER JOIN hospital_roles hr ON hr.hosp_emp_id = u.user_id

        -- Only join what's needed for filtering and permissions
        ${emp_perms ? `
            LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
        ` : ''}

        WHERE u.user_type = 'employee' 
        AND eh.emp_title IN ('Doctor', 'Surgeon', 'Nurse')
        ${filtering_string ? "AND " + filtering_string : ""}

        ${emp_perms ? `
            GROUP BY u.user_id
            ${perms_CONDITION}
        ` : ''}
    `;

    const COUNT = await executeMySqlQuery(query);
    
    // Handle both grouped and non-grouped results
    if (emp_perms) {
        // When grouped, count the rows
        return COUNT.length;
    } else {
        // When not grouped, use the COUNT result
        return COUNT[0]?.total_count || 0;
    }
}

/**
 * Get all hospital employees with full data and optional filters
 * OPTIMIZED VERSION
 */
/**
 * Get all hospital employees with full data and optional filters
 */
static async getAllHospitalEmployeesFullData(limit = 10, offset = 0, filtering_string = null, emp_perms = null) { 
    const perms_CONDITION = emp_perms 
        ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` 
        : "";
    console.log("filtering",filtering_string)
    const query = `
        SELECT 
            u.user_id,
            u.user_email,
            u.user_name,
            u.created_at,
            e.emp_abscence,
            e.emp_rate,
            e.emp_specialty,
            eh.emp_title,
            
            -- Use ANY_VALUE for non-aggregated columns from 1:1 relationships
            COALESCE(ANY_VALUE(d.initial_consultation_price), ANY_VALUE(s.initial_consultation_price)) AS initial_consultation_price,
            COALESCE(ANY_VALUE(d.followup_consultation_price), ANY_VALUE(s.followup_consultation_price)) AS followup_consultation_price,
            ANY_VALUE(s.surgery_price) AS surgery_price,
            COALESCE(ANY_VALUE(d.years_of_exp), ANY_VALUE(s.years_of_exp)) AS years_of_exp,
            ANY_VALUE(n.floor_number) AS floor_number,
            
            -- Permissions (aggregated)
            COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
            
            -- Role (use ANY_VALUE since it's 1:1 with hospital employee)
            COALESCE(ANY_VALUE(hr.role_name), 'NormalUser') AS role_name,
            
            -- Availability schedule
            COALESCE(
                (SELECT GROUP_CONCAT(
                    CONCAT(
                        day_of_week, 
                        ': ', 
                        DATE_FORMAT(start_time, '%H:%i'), 
                        '-', 
                        DATE_FORMAT(end_time, '%H:%i')
                    )
                    ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
                    SEPARATOR '; '
                )
                FROM availability 
                WHERE hosp_emp_id = eh.hosp_emp_id
                ),
                'None'
            ) AS availability_schedule

        FROM users u
        INNER JOIN employees e ON u.user_id = e.emp_id
        INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id

        -- Title-specific joins
        LEFT JOIN doctors d ON eh.hosp_emp_id = d.emp_id
        LEFT JOIN surgeons s ON eh.hosp_emp_id = s.emp_id
        LEFT JOIN nurses n ON eh.hosp_emp_id = n.emp_id

        -- Permissions and roles
        LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
        LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
        LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id

        WHERE u.user_type = 'employee' 
        AND eh.emp_id = e.emp_id
        ${filtering_string ? "AND " + filtering_string : ""}

        -- Minimal GROUP BY
        GROUP BY u.user_id, eh.hosp_emp_id, e.emp_id
            
        ${perms_CONDITION}
        ORDER BY u.user_id
        LIMIT ${limit} OFFSET ${offset}
    `;
    
    const result = await executeMySqlQuery(query);
    return result;
}


}

module.exports = HospitalUsersMethods;