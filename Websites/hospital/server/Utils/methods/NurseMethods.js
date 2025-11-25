const executeMySqlQuery = require("../executeMySqlQuery");
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
class NurseMethods {


    // ============================
    //              Check
    // ============================
            static async IsMyPatient(doctor_id){
                throw new Error("NurseMethodsv.IsMyPatient is not implemented yet")
    }


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
                -- from employees
                e.emp_id AS user_id,
                e.emp_name,
                e.emp_abscence,
                e.emp_rate,
                e.emp_title,
                e.emp_specialty,
                e.emp_email AS user_email,
                
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
            LEFT JOIN availability na ON n.nurse_id = na.hosp_emp_id

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
                hr.role_name
            ${perms_CONDITION}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const result = await executeMySqlQuery(query);
        console.log("result",result);
        return result;
    }

    static async getNurseFullData(nurse_id){
        
        const query = `
            SELECT 
            -- from employees
            e.emp_id AS user_id,
            e.emp_name,
            e.emp_abscence,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            e.emp_email AS user_email,
            
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
        WHERE n.nurse_id = ?

        `;

        const result = await executeMySqlQuery(query,[nurse_id]);
        console.log("result",result);
        return result;
    }

        static async getAllNursesSpecificData(){
        const query = `SELECT 
                        e.emp_id AS user_id,
                        e.emp_name,
                        e.emp_abscence,
                        e.emp_rate,
                        e.emp_title,
                        e.emp_specialty,
                        e.emp_email AS user_email,
                        
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
                    LEFT JOIN availability na ON n.nurse_id = na.hosp_emp_id
                    GROUP BY e.emp_id, n.nurse_id, n.hosp_emp_id, n.floor_number;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getNurseSpecificData(nurse_id){
        const query = `SELECT 
                        e.emp_id AS user_id,
                        e.emp_name,
                        e.emp_salary,
                        e.emp_abscence,
                        e.emp_bonus,
                        e.emp_rate,
                        e.emp_title,
                        e.emp_specialty,
                        e.emp_email AS user_email,
                        e.emp_password AS user_password, -- include password for authentication purposes
                        
                        n.nurse_id,
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
                    LEFT JOIN availability na ON n.nurse_id = na.hosp_emp_id
                    WHERE n.hosp_emp_id = ${nurse_id}
                    GROUP BY e.emp_id, n.nurse_id, n.hosp_emp_id, n.floor_number;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }
    // ============================
    //              Update
    // ============================
    static async updateNurseSpecificData(nurse_id, data) {
        try{
            // ===1. Filter data to only include fields relevant to nurses table
                const nurses_table_fields = Tables.nurses;
                const MapOfData = new Map(Object.entries(data));
                let fieldsToUpdate = {};
                for (const field of nurses_table_fields) {
                    if( MapOfData.has(field)){
                        fieldsToUpdate[field] = MapOfData.get(field);
                    }
                }
                // ===2.  Construct dynamic fields string for SQL
                const fields = stringifyFields( "joined",Object.entries(fieldsToUpdate))
            const query = `
                UPDATE nurses
                SET 
                    ${fields}
                WHERE hosp_emp_id = ${nurse_id};
            `;
            await executeMySqlQuery(query);
            return true;
        }
        catch(err){
            console.error("Error updating nurse data:", err);
            return false;
        }
                
        }

        static #mapToAction ={
            "Nurse core": NurseMethods.updateNurseSpecificData,
            
        }
        static async MapToUpdateNurseData(nurse_id, data, actions ) {
            const results = [];
            for( const action of actions){
                const fn = NurseMethods.#mapToAction[action];
                if (!fn) continue; // skip if no function for this action
                const result = await fn.call(this, nurse_id, data);
                results.push({ action, result });
            }

                return results; // return array of results for each action
        }


}

module.exports = NurseMethods;