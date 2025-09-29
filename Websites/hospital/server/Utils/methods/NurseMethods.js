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
    //              GET
    // ============================

    static async getNurseSpecificData(nurse_id){
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
                        
                        n.nurse_id,
                        n.hosp_emp_id,
                        n.floor_number,
                        GROUP_CONCAT(
                        CONCAT(na.day_of_week, ': ', na.start_time, '-', na.end_time)
                        ORDER BY FIELD(na.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                        SEPARATOR '; '
                    ) AS availability_schedule

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