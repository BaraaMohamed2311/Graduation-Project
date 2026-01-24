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

    static async MapUserToFullUpdateFunction(user_id, title, updating_string) {
        return await HospitalUserFactory.updateFullCore(user_id, title, updating_string);
    }

    // ========================================
    // Cross-User-Type Methods
    // ========================================

    /**
     * Check if a patient belongs to a staff member
     */
    static async patientBelongsToStaff(staff_id, patient_id) { 
        const query = `
            SELECT EXISTS (
                SELECT 1
                FROM staff_patient sp
                JOIN patients p 
                    ON sp.patient_id = p.patient_id
                WHERE sp.staff_id = ? 
                AND sp.patient_id = ? AND relation_type = 'Doctor'
            ) AS patient_exists;
        `;

        const result = await executeMySqlQuery(query, [staff_id, patient_id]);
        return !!result[0].patient_exists;
    }

    /**
     * Get count of all hospital employees with optional filters
     */
    static async getAllHospitalEmployeesCOUNT(filtering_string = null, emp_perms = null) { 
        const perms_CONDITION = emp_perms 
            ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` 
            : "";

        const query = `
            SELECT COUNT(*) as total_count
            FROM (
                SELECT u.user_id
                FROM users u
                INNER JOIN employees e ON u.user_id = e.emp_id
                INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id

                LEFT JOIN doctors d ON eh.hosp_emp_id = d.doctor_id AND eh.emp_title = 'Doctor'
                LEFT JOIN surgeons s ON eh.hosp_emp_id = s.surgeon_id AND eh.emp_title = 'Surgeon'
                LEFT JOIN nurses n ON eh.hosp_emp_id = n.nurse_id AND eh.emp_title = 'Nurse'

                LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id

                WHERE u.user_type = 'employee' AND eh.emp_title != 'Employee' 
                ${filtering_string ? "AND " + filtering_string : ""}

                GROUP BY u.user_id
                ${perms_CONDITION}
            ) as subquery;
        `;

        const COUNT = await executeMySqlQuery(query);
        return COUNT[0]?.total_count;
    }

    /**
     * Get all hospital employees with full data and optional filters
     */
    static async getAllHospitalEmployeesFullData(limit = 10, offset = 0, filtering_string = null, emp_perms = null) { 
        const perms_CONDITION = emp_perms 
            ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` 
            : "";

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
                
                CASE 
                    WHEN eh.emp_title = 'Doctor' THEN d.initial_consultation_price
                    WHEN eh.emp_title = 'Surgeon' THEN s.initial_consultation_price
                    ELSE NULL 
                END AS initial_consultation_price,
                
                CASE 
                    WHEN eh.emp_title = 'Doctor' THEN d.followup_consultation_price
                    WHEN eh.emp_title = 'Surgeon' THEN s.followup_consultation_price
                    ELSE NULL 
                END AS followup_consultation_price,
                
                CASE 
                    WHEN eh.emp_title = 'Surgeon' THEN s.surgery_price
                    ELSE NULL 
                END AS surgery_price,
                
                CASE 
                    WHEN eh.emp_title = 'Doctor' THEN d.years_of_exp
                    WHEN eh.emp_title = 'Surgeon' THEN s.years_of_exp
                    ELSE NULL 
                END AS years_of_exp,
                
                CASE 
                    WHEN eh.emp_title = 'Nurse' THEN n.floor_number
                    ELSE NULL 
                END AS floor_number,
                
                COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                COALESCE(hr.role_name, 'NormalUser') AS role_name,
                
                COALESCE((
                    SELECT GROUP_CONCAT(
                        DISTINCT CONCAT(
                            formatted.day_of_week, 
                            ': ', 
                            formatted.formatted_start, 
                            '-', 
                            formatted.formatted_end
                        )
                        ORDER BY formatted.day_of_week
                        SEPARATOR '; '
                    )
                    FROM (
                        SELECT 
                            day_of_week,
                            DATE_FORMAT(start_time, '%H:%i') as formatted_start,
                            DATE_FORMAT(end_time, '%H:%i') as formatted_end
                        FROM availability 
                        WHERE hosp_emp_id = eh.hosp_emp_id
                    ) AS formatted
                ), 'None') AS availability_schedule

            FROM users u
            INNER JOIN employees e ON u.user_id = e.emp_id
            INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id

            LEFT JOIN doctors d ON eh.hosp_emp_id = d.doctor_id AND eh.emp_title = 'Doctor'
            LEFT JOIN surgeons s ON eh.hosp_emp_id = s.surgeon_id AND eh.emp_title = 'Surgeon'
            LEFT JOIN nurses n ON eh.hosp_emp_id = n.nurse_id AND eh.emp_title = 'Nurse'

            LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
            LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id

            WHERE u.user_type = 'employee' AND eh.emp_title != 'Employee' 
            ${filtering_string ? "AND " + filtering_string : ""}

            GROUP BY 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                eh.emp_title,
                e.emp_specialty,
                d.initial_consultation_price,
                d.followup_consultation_price,
                s.initial_consultation_price,
                s.followup_consultation_price,
                s.surgery_price,
                d.years_of_exp,
                s.years_of_exp,
                n.floor_number,
                hr.role_name
            ${perms_CONDITION}
            ORDER BY u.user_id
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        const result = await executeMySqlQuery(query);
        return result;
    }
}

module.exports = HospitalUsersMethods;