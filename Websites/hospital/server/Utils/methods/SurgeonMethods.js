const executeMySqlQuery = require("../executeMySqlQuery");
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const sqlTransaction = require("../sqlTransaction");
class SurgeonMethods {

    // ============================
    //              COUNT
    // ============================

    static async getAllSurgeonsCOUNT(whereClause = "", perms_CONDITION = ""){
    let query = "";
    // Optimize query construction based on presence of filters
    if(!whereClause && !perms_CONDITION){
        query = "SELECT COUNT(*) as count FROM surgeons ";
    }
    else if(whereClause && !perms_CONDITION){
        query = `
            SELECT COUNT(DISTINCT s.surgeon_id) as count 
            FROM surgeons s
            JOIN employees e ON s.hosp_emp_id = e.emp_id
            LEFT JOIN hospital_roles hr ON s.hosp_emp_id = hr.hosp_emp_id
            ${whereClause}
        `;
    }
    else if(!whereClause && perms_CONDITION){
        query = `
            SELECT COUNT(DISTINCT s.surgeon_id) as count 
            FROM surgeons s
            JOIN employees e ON s.hosp_emp_id = e.emp_id
            LEFT JOIN hospital_emp_perms hep ON s.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
            ${perms_CONDITION}
        `;
    }
    else{
        query = `
            SELECT COUNT(DISTINCT s.surgeon_id) as count 
            FROM surgeons s
            JOIN employees e ON s.hosp_emp_id = e.emp_id
            LEFT JOIN hospital_emp_perms hep ON s.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
            LEFT JOIN hospital_roles hr ON s.hosp_emp_id = hr.hosp_emp_id
            ${whereClause}
            ${perms_CONDITION}
        `;
    }
    const result = await executeMySqlQuery(query);
    return result[0]?.count;
}

    // ============================
    //              GET
    // ============================
    static async getAllSurgeonsFullData(limit=10,offset=0,whereClause='', perms_CONDITION=''){
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
                    
                    -- from surgeons
                    s.hosp_emp_id,
                    s.initial_consultation_price,
                    s.followup_consultation_price,
                    s.surgery_price,
                    s.years_of_exp,

                    -- from hospital_perms via hospital_emp_perms
                    COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                    
                    -- from hospital_roles with COALESCE for default
                    COALESCE(hr.role_name, 'NormalUser') AS role_name,

                    -- availability schedule with DISTINCT to remove duplicates
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
                            WHERE hosp_emp_id = s.surgeon_id
                        ) AS formatted
                    ), 'None') AS availability_schedule

                FROM surgeons s
                JOIN employees e ON s.hosp_emp_id = e.emp_id
                JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id
                LEFT JOIN availability a ON s.surgeon_id = a.hosp_emp_id

                -- Join with hospital_emp_perms to get perm_id
                LEFT JOIN hospital_emp_perms hep ON s.hosp_emp_id = hep.hosp_emp_id

                -- Join with hospital_perms to get perm_name using the perm_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id

                -- Join with hospital_roles and use COALESCE for default role name
                LEFT JOIN hospital_roles hr ON s.hosp_emp_id = hr.hosp_emp_id

                ${whereClause} 

                GROUP BY 
                    e.emp_id, 
                    s.surgeon_id, 
                    s.hosp_emp_id, 
                    s.initial_consultation_price, 
                    s.followup_consultation_price, 
                    s.surgery_price, 
                    s.years_of_exp,
                    hr.role_name,
                    u.user_email
                ${perms_CONDITION}
                LIMIT ${limit} OFFSET ${offset}
            `;
        const result = await executeMySqlQuery(query);
        return result;
    }

    static async getSurgeonFullData(surgeon_id){
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

                    
                    -- from surgeons
                    s.hosp_emp_id,
                    s.initial_consultation_price,
                    s.followup_consultation_price,
                    s.surgery_price,
                    s.years_of_exp,

                    -- from hospital_perms via hospital_emp_perms (subquery)
                    COALESCE(NULLIF((
                        SELECT GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', ')
                        FROM hospital_emp_perms hep
                        JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                        WHERE hep.hosp_emp_id = s.hosp_emp_id
                    ), ''), 'None') AS emp_perms,
                    
                    -- from hospital_roles with COALESCE for default (subquery)
                    COALESCE((
                        SELECT hr.role_name
                        FROM hospital_roles hr
                        WHERE hr.hosp_emp_id = s.hosp_emp_id
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
                            WHERE hosp_emp_id = s.surgeon_id
                        ) AS formatted
                    ), 'None') AS availability_schedule

                FROM surgeons s
                JOIN employees e ON s.hosp_emp_id = e.emp_id
                JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id
                WHERE s.surgeon_id = ?

            `;
        const result = await executeMySqlQuery(query,[surgeon_id]);
        return result[0];
    }

    static async getAllSurgeonsSpecificData(){
        const query = `SELECT 
                        -- from users
                        u.user_id,
                        u.user_email,
                        u.user_name,

                        -- from employees

                        e.emp_abscence,
                        e.emp_rate,
                        e.emp_title,
                        e.emp_specialty,
                        
                        s.surgeon_id,
                        s.hosp_emp_id,
                        s.initial_consultation_price,
                        s.followup_consultation_price,
                        s.surgery_price,
                        s.years_of_exp,

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
                            WHERE hosp_emp_id = s.surgeon_id
                        ) AS formatted
                    ), 'None') AS availability_schedule

                    FROM surgeons s
                    JOIN employees e ON s.hosp_emp_id = e.emp_id
                    JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id
                    LEFT JOIN availability a ON s.surgeon_id = a.hosp_emp_id

                    GROUP BY e.emp_id, s.surgeon_id, s.hosp_emp_id, s.initial_consultation_price, s.followup_consultation_price, s.surgery_price, s.years_of_exp;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }
    static async getSurgeonSpecificData(user_id){
        const query = `SELECT 
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

                        -- from surgeons
                        s.surgeon_id,
                        s.hosp_emp_id,
                        s.initial_consultation_price,
                        s.followup_consultation_price,
                        s.surgery_price,
                        s.years_of_exp,

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
                                    WHERE hosp_emp_id = s.surgeon_id
                                ) AS formatted
                            ), 'None') AS availability_schedule

                    FROM surgeons s
                    JOIN employees e ON s.hosp_emp_id = e.emp_id
                    JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id
                    LEFT JOIN availability a ON s.surgeon_id = a.hosp_emp_id
                    WHERE s.hosp_emp_id = ${user_id}
                    GROUP BY 
                    e.emp_id,
                    s.surgeon_id,
                    s.hosp_emp_id,
                    s.initial_consultation_price,
                    s.followup_consultation_price,
                    s.surgery_price,
                    s.years_of_exp,
                    u.user_email;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getListedSurgeonsDataForPaitent(){
        
    }
    
    // ============================
    //              Update
    // ============================
    static async updateSurgeonFullCore(surgeon_id, updating_string){
        const query = `
        UPDATE surgeons s
            JOIN employees e 
                ON s.hosp_emp_id = e.emp_id
            JOIN users u 
                ON u.user_type = 'employee' AND u.user_id = e.emp_id

            SET
                ${updating_string}

            WHERE s.surgeon_id = ${surgeon_id};
        `
        const version_query = `UPDATE table_version
                            SET current_version = current_version + 1
                            WHERE table_name = 'hospital_employees';
                            `
        const result = await sqlTransaction([query,version_query])

        return result;

    }
    
        






}

module.exports = SurgeonMethods;