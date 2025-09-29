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
    //              GET
    // ============================
    static async getSurgeonSpecificData(user_id){
        const query = `SELECT 
                        e.emp_id,
                        e.emp_name,
                        e.emp_salary,
                        e.emp_abscence,
                        e.emp_bonus,
                        e.emp_rate,
                        e.emp_title,
                        e.emp_specialty,
                        e.emp_email,
                        e.emp_password,
                        
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