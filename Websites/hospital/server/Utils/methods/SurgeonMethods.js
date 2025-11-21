const executeMySqlQuery = require("../executeMySqlQuery");
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
class SurgeonMethods {

    // ============================
    //              Check
    // ============================
            static async IsMyPatient(doctor_id){
                throw new Error("SurgeonMethods.IsMyPatient is not implemented yet")
    }
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
                    -- from employees
                    e.emp_id AS user_id,
                    e.emp_name,
                    e.emp_abscence,
                    e.emp_rate,
                    e.emp_title,
                    e.emp_specialty,
                    e.emp_email AS user_email,
                    
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

                    GROUP_CONCAT(
                        CONCAT(sa.day_of_week, ': ', sa.start_time, '-', sa.end_time)
                        ORDER BY FIELD(sa.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                        SEPARATOR '; '
                    ) AS availability_schedule

                FROM surgeons s
                JOIN employees e ON s.hosp_emp_id = e.emp_id
                LEFT JOIN availability sa ON s.surgeon_id = sa.hosp_emp_id
                
                -- Join with hospital_emp_perms to get perm_id
                LEFT JOIN hospital_emp_perms hep ON s.hosp_emp_id = hep.hosp_emp_id
                
                -- Join with hospital_perms to get perm_name using the perm_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                
                -- Join with hospital_roles and use COALESCE for default role name
                LEFT JOIN hospital_roles hr ON s.hosp_emp_id = hr.hosp_emp_id

                ${whereClause } 

                GROUP BY 
                    e.emp_id, 
                    s.surgeon_id, 
                    s.hosp_emp_id, 
                    s.initial_consultation_price, 
                    s.followup_consultation_price, 
                    s.surgery_price, 
                    s.years_of_exp,
                    hr.role_name
                ${perms_CONDITION}
                LIMIT ${limit} OFFSET ${offset}
            `;
        const result = await executeMySqlQuery(query);
        return result;
    }

    static async getSurgeonFullData(surgeon_id){
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

                    GROUP_CONCAT(
                        CONCAT(sa.day_of_week, ': ', sa.start_time, '-', sa.end_time)
                        ORDER BY FIELD(sa.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                        SEPARATOR '; '
                    ) AS availability_schedule

                FROM surgeons s
                JOIN employees e ON s.hosp_emp_id = e.emp_id
                LEFT JOIN availability sa ON s.surgeon_id = sa.hosp_emp_id
                
                -- Join with hospital_emp_perms to get perm_id
                LEFT JOIN hospital_emp_perms hep ON s.hosp_emp_id = hep.hosp_emp_id
                
                -- Join with hospital_perms to get perm_name using the perm_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                
                -- Join with hospital_roles and use COALESCE for default role name
                LEFT JOIN hospital_roles hr ON s.hosp_emp_id = hr.hosp_emp_id

                WHERE s.surgeon_id = ?

                GROUP BY 
                    e.emp_id, 
                    s.surgeon_id, 
                    s.hosp_emp_id, 
                    s.initial_consultation_price, 
                    s.followup_consultation_price, 
                    s.surgery_price, 
                    s.years_of_exp,
                    hr.role_name

            `;
        const result = await executeMySqlQuery(query,[surgeon_id]);
        return result;
    }

    static async getAllSurgeonsSpecificData(){
        const query = `SELECT 
                        e.emp_id AS user_id,
                        e.emp_name,
                        e.emp_abscence,
                        e.emp_rate,
                        e.emp_title,
                        e.emp_specialty,
                        e.emp_email AS user_email,
                        
                        s.surgeon_id,
                        s.hosp_emp_id,
                        s.initial_consultation_price,
                        s.followup_consultation_price,
                        s.surgery_price,
                        s.years_of_exp,

                        GROUP_CONCAT(
                        CONCAT(sa.day_of_week, ': ', sa.start_time, '-', sa.end_time)
                        ORDER BY FIELD(sa.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                        SEPARATOR '; '
                    ) AS availability_schedule

                    FROM surgeons s
                    JOIN employees e ON s.hosp_emp_id = e.emp_id
                    LEFT JOIN availability sa ON s.surgeon_id = sa.hosp_emp_id

                    GROUP BY e.emp_id, s.surgeon_id, s.hosp_emp_id, s.initial_consultation_price, s.followup_consultation_price, s.surgery_price, s.years_of_exp;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }
    static async getSurgeonSpecificData(user_id){
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
                        
                        s.surgeon_id,
                        s.hosp_emp_id,
                        s.initial_consultation_price,
                        s.followup_consultation_price,
                        s.surgery_price,
                        s.years_of_exp,

                        GROUP_CONCAT(
                        CONCAT(sa.day_of_week, ': ', sa.start_time, '-', sa.end_time)
                        ORDER BY FIELD(sa.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                        SEPARATOR '; '
                    ) AS availability_schedule

                    FROM surgeons s
                    JOIN employees e ON s.hosp_emp_id = e.emp_id
                    LEFT JOIN availability sa ON s.surgeon_id = sa.hosp_emp_id
                    WHERE s.hosp_emp_id = ${user_id}
                    GROUP BY e.emp_id, s.surgeon_id, s.hosp_emp_id, s.initial_consultation_price, s.followup_consultation_price, s.surgery_price, s.years_of_exp;
                    `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getListedSurgeonsDataForPaitent(){
        
    }
    
    // ============================
    //              Update
    // ============================
    static async updateSurgeonSpecificData(user_id, data) {
        try{
            // ===1. Filter data to only include fields relevant to nurses table
                const surgeons_table_fields = Tables.surgeons;
                const MapOfData = new Map(Object.entries(data));
                let fieldsToUpdate = {};
                for (const field of surgeons_table_fields) {
                    if( MapOfData.has(field)){
                        fieldsToUpdate[field] = MapOfData.get(field);
                    }
                }
                // ===2.  Construct dynamic fields string for SQL
                const fields = stringifyFields( "joined",Object.entries(fieldsToUpdate))
            const query = `
                UPDATE surgeons
                SET 
                    ${fields}
                WHERE hosp_emp_id = ${user_id};
            `;
            await executeMySqlQuery(query);
            return true;
        }
        catch(err){
            console.error("Error updating surgeon data:", err);
            return false;
        }
                
        }

        static #mapToAction ={
            "Surgeon core": SurgeonMethods.updateSurgeonSpecificData,
        }
        static async MapToUpdateSurgeonData(user_id, data, actions ) {
            const results = [];
            for( const action of actions){
                const fn = SurgeonMethods.#mapToAction[action];
                if (!fn) continue; // skip if no function for this action
                const result = await fn.call(this, user_id, data);
                results.push({ action, result });
            }

                return results; // return array of results for each action
        }

        






}

module.exports = SurgeonMethods;