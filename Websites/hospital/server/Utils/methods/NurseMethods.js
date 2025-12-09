const executeMySqlQuery = require("../executeMySqlQuery");
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const sqlTransaction = require("../sqlTransaction");
class NurseMethods {



    // ============================
    //              COUNT
    // ============================
    static async getAllNursesCOUNT(whereClause = "", perms_CONDITION = ""){
    let query = "";
    // Optimize query construction based on presence of filters
    if(!whereClause && !perms_CONDITION){
        query = "SELECT COUNT(*) as count FROM nurses ";
    }
    else if(whereClause && !perms_CONDITION){
        query = `
            SELECT COUNT(DISTINCT n.nurse_id) as count 
            FROM nurses n
            JOIN employees e ON n.hosp_emp_id = e.emp_id
            LEFT JOIN hospital_roles hr ON n.hosp_emp_id = hr.hosp_emp_id
            ${whereClause}
        `;
    }
    else if(!whereClause && perms_CONDITION){
        query = `
            SELECT COUNT(DISTINCT n.nurse_id) as count 
            FROM nurses n
            JOIN employees e ON n.hosp_emp_id = e.emp_id
            LEFT JOIN hospital_emp_perms hep ON n.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
            ${perms_CONDITION}
        `;
    }
    else{
        query = `
            SELECT COUNT(DISTINCT n.nurse_id) as count 
            FROM nurses n
            JOIN employees e ON n.hosp_emp_id = e.emp_id
            LEFT JOIN hospital_emp_perms hep ON n.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
            LEFT JOIN hospital_roles hr ON n.hosp_emp_id = hr.hosp_emp_id
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

    static async getAllNursesFullData(limit=10,offset=0,whereClause='', perms_CONDITION=''){
        
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
                
                -- from nurses
                n.nurse_id,
                n.hosp_emp_id,
                n.floor_number,
                
                -- from hospital_perms via hospital_emp_perms
                COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                
                -- from hospital_roles with COALESCE for default
                COALESCE(hr.role_name, 'NormalUser') AS role_name,
                
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
                        WHERE hosp_emp_id = n.nurse_id
                    ) AS formatted
                ), 'None') AS availability_schedule

            FROM nurses n
            JOIN employees e ON n.hosp_emp_id = e.emp_id
            JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id -- Added JOIN with users table
            LEFT JOIN availability a ON n.nurse_id = a.hosp_emp_id

            -- Join with hospital_emp_perms to get perm_id
            LEFT JOIN hospital_emp_perms hep ON n.hosp_emp_id = hep.hosp_emp_id

            -- Join with hospital_perms to get perm_name using the perm_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id

            -- Join with hospital_roles and use COALESCE for default role name
            LEFT JOIN hospital_roles hr ON n.hosp_emp_id = hr.hosp_emp_id

            ${whereClause} 

            GROUP BY 
                e.emp_id, 
                n.nurse_id, 
                n.hosp_emp_id, 
                n.floor_number,
                hr.role_name,
                u.user_email
            ${perms_CONDITION}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const result = await executeMySqlQuery(query);

        return result;
    }

    static async getNurseFullData(nurse_id){
        
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

            
            -- from nurses
            n.nurse_id,
            n.hosp_emp_id,
            n.floor_number,
            
            -- from hospital_perms via hospital_emp_perms (subquery)
            COALESCE(NULLIF((
                SELECT GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', ')
                FROM hospital_emp_perms hep
                JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                WHERE hep.hosp_emp_id = n.hosp_emp_id
            ), ''), 'None') AS emp_perms,
            
            -- from hospital_roles with COALESCE for default (subquery)
            COALESCE((
                SELECT hr.role_name
                FROM hospital_roles hr
                WHERE hr.hosp_emp_id = n.hosp_emp_id
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
                        WHERE hosp_emp_id = n.nurse_id
                    ) AS formatted
                ), 'None') AS availability_schedule

        FROM nurses n
        JOIN employees e ON n.hosp_emp_id = e.emp_id
        JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id -- Added JOIN with users table
        WHERE n.nurse_id = ?

        `;

        const result = await executeMySqlQuery(query,[nurse_id]);

        return result[0];
    }

        static async getAllNursesSpecificData(){
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
                        
                        -- from nurses
                        n.hosp_emp_id,
                        n.floor_number,
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
                                WHERE hosp_emp_id = n.nurse_id
                            ) AS formatted
                        ), 'None') AS availability_schedule

                    FROM nurses n
                    JOIN employees e ON n.hosp_emp_id = e.emp_id
                    JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id -- Added JOIN with users table
                    LEFT JOIN availability a ON n.nurse_id = a.hosp_emp_id
                    GROUP BY e.emp_id, n.nurse_id, n.hosp_emp_id, n.floor_number;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getNurseSpecificData(nurse_id){
        const query = `SELECT 
                        -- from users
                        u,user_id,
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


                        -- from nurses
                        n.hosp_emp_id,
                        n.floor_number,
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
                                WHERE hosp_emp_id = n.nurse_id
                            ) AS formatted
                        ), 'None') AS availability_schedule

                    FROM nurses n
                    JOIN employees e ON n.hosp_emp_id = e.emp_id
                    JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id -- Added JOIN with users table
                    LEFT JOIN availability a ON n.nurse_id = a.hosp_emp_id
                    WHERE n.hosp_emp_id = ${nurse_id}
                    GROUP BY e.emp_id, n.nurse_id, n.hosp_emp_id, n.floor_number;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }
    // ============================
    //              Update
    // ============================

    static async updateNurseFullCore(nurse_id, updating_string){
        console.log("updateNurseFullCore",nurse_id, updating_string)
        const query = `
        UPDATE nurses n
            JOIN employees e 
                ON n.hosp_emp_id = e.emp_id
            JOIN users u 
                ON u.user_type = 'employee' AND u.user_id = e.emp_id

            SET
                ${updating_string},
                u.latest_update = NOW()

            WHERE n.nurse_id = ${nurse_id};
        `

        const result = await sqlTransaction([query])

        return result[0]?.affectedRows > 0;

    }



}

module.exports = NurseMethods;