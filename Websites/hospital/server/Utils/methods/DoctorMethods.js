const executeMySqlQuery = require("../executeMySqlQuery");
const sqlTransaction = require("../sqlTransaction")
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const parseUpdatingStringByTable = require("../parseUpdatingStringByTable");
const parsedUpdatesToObjects = require("../parsedUpdatesToObjects");

class DoctorMethods {


    // ============================
    //              Count
    // ============================

    static async getAllDoctorsCOUNT(filtering_string = "", perms_CONDITION = ""){

        let query = "";
        // Optimize query construction based on presence of filters
        if(!filtering_string && !perms_CONDITION){
                query = "SELECT COUNT(*) as count FROM doctors ";
            }
        else if(filtering_string && !perms_CONDITION){
                    query = `
                SELECT COUNT(DISTINCT d.emp_id) as count 
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id
                ${filtering_string ? " AND " + filtering_string : ""}
            `;
        }
        else if(!filtering_string && perms_CONDITION){
            query = `
                SELECT COUNT(DISTINCT d.emp_id) as count 
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                LEFT JOIN hospital_emp_perms hep ON d.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                ${perms_CONDITION}
            `;
        
        }
        else{
            query = `
                SELECT COUNT(DISTINCT d.emp_id) as count 
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                LEFT JOIN hospital_emp_perms hep ON d.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id
                ${filtering_string ? " AND " + filtering_string : ""}
                ${perms_CONDITION}
            `;
        }
        const result = await executeMySqlQuery(query);
        return result[0]?.count;
    }

    // ============================
    //              GET
    // ============================

    

        static async getAllDoctorsFullData(limit=10,offset=0,whereClause='', perms_CONDITION=''){

        
        const query = `
            SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_name,
            
            -- from employees
            e.emp_abscence,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            
            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from doctors (may be NULL)
            ANY_VALUE(d.emp_id) AS emp_id,
            ANY_VALUE(d.initial_consultation_price) AS initial_consultation_price,
            ANY_VALUE(d.followup_consultation_price) AS followup_consultation_price,
            ANY_VALUE(d.years_of_exp) AS years_of_exp,
            
            -- from hospital_perms via hospital_emp_perms
            COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
            
            -- from hospital_roles with COALESCE for default
            COALESCE(ANY_VALUE(hr.role_name), 'NormalUser') AS role_name,
            
            -- FIXED: Format availability schedule to remove seconds and use DISTINCT to avoid duplicates
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
        
        -- LEFT JOIN for optional doctor data
        LEFT JOIN doctors d ON eh.hosp_emp_id = d.hosp_emp_id

        -- LEFT JOIN for permissions and roles
        LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
        LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
        LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id

        WHERE u.user_type = 'employee' 
        AND eh.emp_title = 'Doctor'
        ${whereClause} 

        GROUP BY u.user_id, eh.hosp_emp_id, e.emp_id
        ${perms_CONDITION}
        LIMIT ${limit} OFFSET ${offset}
    `;

        const result = await executeMySqlQuery(query);
        
        return result;
    }


     static async getDoctorFullData(emp_id){

        
        const query = `
        SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_name,
            
            -- from employees
            e.emp_abscence,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            
            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from doctors (may be NULL)
            d.emp_id,
            d.initial_consultation_price,
            d.followup_consultation_price,
            d.years_of_exp,
            
            -- from hospital_perms via hospital_emp_perms (subquery)
            COALESCE(NULLIF((
                SELECT GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', ')
                FROM hospital_emp_perms hep
                JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                WHERE hep.hosp_emp_id = eh.hosp_emp_id
            ), ''), 'None') AS emp_perms,
            
            -- from hospital_roles with COALESCE for default (subquery)
            COALESCE((
                SELECT hr.role_name
                FROM hospital_roles hr
                WHERE hr.hosp_emp_id = eh.hosp_emp_id
            ), 'NormalUser') AS role_name,
            
            -- FIXED: availability schedule using subquery to format times first
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
        
        -- LEFT JOIN for optional doctor data
        LEFT JOIN doctors d ON eh.hosp_emp_id = d.hosp_emp_id
        
        WHERE u.user_type = 'employee' 
        AND eh.hosp_emp_id = ?
        AND eh.emp_title = 'Doctor'
    `;

        const result = await executeMySqlQuery(query,[emp_id]);
        
        return result[0];
    }

    // =============================================
    //  No Roles Or Perms are fetched in Specific queries
    // =============================================


    static async getAllDoctorsSpecificData(){
        
        const query = `
        SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_name,
            
            -- from employees
            e.emp_abscence,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            
            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from doctors (may be NULL)
            d.initial_consultation_price,
            d.followup_consultation_price,
            d.years_of_exp,

            -- availability schedule (subquery)
            -- FIXED: availability schedule using subquery to format times first
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
        
        -- LEFT JOIN for optional doctor data
        LEFT JOIN doctors d ON eh.hosp_emp_id = d.hosp_emp_id
        
        WHERE u.user_type = 'employee'
        AND eh.emp_title = 'Doctor'
    `;
    
    const result = await executeMySqlQuery(query);
    return result[0];
    }

    static async getDoctorSpecificData(emp_id){
        
        const query = `
        SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_password,
            u.user_name,
            
            -- from employees
            e.emp_salary,
            e.emp_abscence,
            e.emp_bonus,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            
            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from doctors (may be NULL)
            d.emp_id,
            d.initial_consultation_price,
            d.followup_consultation_price,
            d.years_of_exp,

            -- availability schedule (subquery)
            -- FIXED: availability schedule using subquery to format times first
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
        
        -- LEFT JOIN for optional doctor data
        LEFT JOIN doctors d ON eh.hosp_emp_id = d.hosp_emp_id
        
        WHERE u.user_type = 'employee'
        AND eh.hosp_emp_id = ?
        AND eh.emp_title = 'Doctor'
    `;
    
    const result = await executeMySqlQuery(query, [emp_id]);
    return result[0];
    }

    


    static async getDoctorAllPatients(staff_id){
        const query = `SELECT 
                        -- from users
                        u.user_email,
                        u.user_name,
                        -- from patients
                        p.user_id AS user_id,
                        p.patient_phone,
                        p.patient_address,
                        p.isAssignedToRoom,
                        p.floor_number,
                        p.date_of_birth,
                        p.next_check_date,
                        p.patient_gender,
                        p.emergency_contact,
                        p.created_at,
                        sp.assigned_date
                    FROM staff_patient sp
                    JOIN patients p ON sp.user_id = p.user_id
                    JOIN users u ON u.user_type = 'patient' AND u.user_id = p.user_id
                    WHERE sp.staff_id = ? AND relation_type = 'Doctor';
                    `;
            const result = await executeMySqlQuery(query,[staff_id]);
            
            return result;
    }

    static async getDoctorRangedPatients(staff_id,limit, offset,filtering_string=null){
        let query = `SELECT 
                        -- from users
                        u.user_email,
                        u.user_name,

                        -- from patients
                        p.user_id AS user_id,
                        p.patient_phone,
                        p.patient_address,
                        p.isAssignedToRoom,
                        p.floor_number,
                        p.date_of_birth,
                        p.next_check_date,
                        p.patient_gender,
                        p.emergency_contact,
                        p.created_at,
                        sp.assigned_date
                    FROM staff_patient sp
                    JOIN patients p ON sp.user_id = p.user_id
                    JOIN users u ON u.user_type = 'patient' AND u.user_id = p.user_id
                    WHERE sp.staff_id = ?  AND relation_type = 'Doctor'
                    `;
            if(filtering_string){
                query += " AND " + filtering_string
            }

            if(limit> 0 &&  offset > -1){
                query += " LIMIT ? OFFSET ? "
            }
            const result = await executeMySqlQuery(query,[staff_id,limit, offset]);
            
            return result;
    }

    static async getDoctorAllPatientsCOUNT(staff_id){
        const query = `SELECT 
                        COUNT(p.user_id) as count
                    FROM staff_patient sp
                    JOIN patients p 
                        ON sp.user_id = p.user_id
                    WHERE sp.staff_id = ?  AND relation_type = 'Doctor';
                    `;
            const result = await executeMySqlQuery(query,[staff_id]);
            
            return result[0];
    }



    // ============================
    //              Update
    // ============================

    static async updateDoctorFullCore(emp_id, updating_string) {
    const parsedUpdates = parseUpdatingStringByTable(updating_string);
    const parsedObjects = parsedUpdatesToObjects(parsedUpdates);
    const queries = [];

    // 1. Ensure user exists
    if (parsedUpdates.users) {
        queries.push(`
            UPDATE users
            SET ${parsedUpdates.users}
            WHERE user_id = ${emp_id} AND user_type = 'employee'
        `);
    }

    // 2. UPSERT employees
    if (parsedUpdates.employees) {
        const { columns_field, values_field } = stringifyFields(
            "seperate",
            Object.entries(parsedObjects.employees) || {}
        );
        queries.push(`
            INSERT INTO employees (emp_id,${columns_field})
            VALUES (${emp_id},${values_field})
            ON DUPLICATE KEY UPDATE
                ${parsedUpdates.employees}
        `);
    }

    // 3. UPSERT doctors
    if (parsedUpdates.doctors) {
        const { columns_field, values_field } = stringifyFields(
            "seperate",
            Object.entries(parsedObjects.doctors) || {}
        );
        queries.push(`
            INSERT INTO doctors (emp_id, hosp_emp_id${columns_field ? ', ' + columns_field : ''})
            SELECT
                ${emp_id},
                ${emp_id}
                ${values_field ? ', ' + values_field : ''}
            FROM employees e
            JOIN users u
                ON u.user_type = 'employee' AND u.user_id = e.emp_id
            WHERE e.emp_id = ${emp_id}
            ON DUPLICATE KEY UPDATE
                ${parsedUpdates.doctors}
        `);
    }

    // 4. Version update
    queries.push(`
        UPDATE table_version
        SET current_version = current_version + 1
        WHERE table_name = 'ems_employees'
    `);

    const result = await sqlTransaction(queries);

    // Check if user update affected any rows (to know if user exists)
    if (parsedUpdates.users && !result) {
        throw new Error('User not found. Please register the user first.');
    }
    
    return result;
}



   

}

module.exports = DoctorMethods;