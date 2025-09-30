const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const Tables = require("../../Tables/data");
class PatientMethods {
    // ============================
    //              GET
    // ============================
    static async getPatientSpecificData(patient_id){
        const query = `SELECT * FROM patients WHERE patient_id = ${patient_id}`;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getAllPatientsData(){
        const query = `SELECT * FROM patients `;
        const result = await executeMySqlQuery(query);
        return result;
    }

    static async getAllPatientsCOUNT(){
        const query = `SELECT COUNT(*) as count FROM patients `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getAllPatientsRangedData(limit, offset){
        const query = `SELECT * FROM patients LIMIT ? OFFSET ?`;
        const result = await executeMySqlQuery(query,[limit, offset]);
        return result;
    }

        static async getListedDoctorDataForPaitent(restFilters = null,limit=null, offset=null) {
            let query = `
                SELECT 
                    d.doctor_id,
                    d.hosp_emp_id,
                    d.initial_consultation_price,
                    d.followup_consultation_price,
                    d.years_of_exp,
                    e.emp_specialty,
                    e.emp_email AS user_email, -- You MUST Rename Column For fetchImagesForListedUsers function to work
                    GROUP_CONCAT(
                        CONCAT(da.day_of_week, ': ', da.start_time, '-', da.end_time)
                        ORDER BY FIELD(da.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                        SEPARATOR '; '
                    ) AS availability_schedule
                FROM doctors d
                JOIN employees e 
                    ON d.hosp_emp_id = e.emp_id
                LEFT JOIN availability da 
                    ON d.doctor_id = da.hosp_emp_id
            `;

            const params = [];
            if (restFilters) {
                query += ` WHERE ${restFilters}`;
            }

            query += `
                GROUP BY 
                    d.doctor_id,
                    d.hosp_emp_id,
                    d.initial_consultation_price,
                    d.followup_consultation_price,
                    d.years_of_exp,
                    e.emp_specialty,
                    e.emp_email
                    ${ limit ? `LIMIT ${limit}`:""}
                    ${ offset ? `OFFSET ${offset}`:""}
            `;
            
            const result = await executeMySqlQuery(query, params);
            console.log("query",query, "\n",result)
            return result;
        }

        static async getListedSurgeonDataForPaitent(restFilters = null,limit=null, offset=null) {
            let query = `
                SELECT 
                    s.surgeon_id,
                    s.hosp_emp_id,
                    s.initial_consultation_price,
                    s.followup_consultation_price,
                    s.surgery_price,
                    s.years_of_exp,
                    e.emp_specialty,
                    e.emp_email AS user_email, -- You MUST Rename Column For fetchImagesForListedUsers function to work
                    GROUP_CONCAT(
                        CONCAT(sa.day_of_week, ': ', sa.start_time, '-', sa.end_time)
                        ORDER BY FIELD(sa.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                        SEPARATOR '; '
                    ) AS availability_schedule
                FROM surgeons s
                JOIN employees e 
                    ON s.hosp_emp_id = e.emp_id
                LEFT JOIN availability sa 
                    ON s.surgeon_id = sa.hosp_emp_id
            `;

            const params = [];
            if (restFilters) {
                query += ` WHERE ${restFilters}`;
            }

            query += `
                GROUP BY 
                    s.surgeon_id,
                    s.hosp_emp_id,
                    s.initial_consultation_price,
                    s.followup_consultation_price,
                    s.surgery_price,
                    s.years_of_exp,
                    e.emp_specialty,
                    e.emp_email
                    ${ limit ? `LIMIT ${limit}` :""}
                    ${ offset ? `OFFSET ${offset}` :""}
            `;

            const result = await executeMySqlQuery(query, params);
            return result;
        }


    
    // ============================
    //              Update
    // ============================
    static async updatePatientCoreData(patient_id, data) {
        try {
        // ===1. Filter data to only include fields relevant to doctors table
                const patients_table_fields = Tables.patients;
                const MapOfData = new Map(Object.entries(data));
                let fieldsToUpdate = {};
                for (const field of patients_table_fields) {
                    if( MapOfData.has(field)){
                        fieldsToUpdate[field] = MapOfData.get(field);
                    }
                }
                // ===2.  Construct dynamic fields string for SQL
                const fields = stringifyFields( "joined",Object.entries(fieldsToUpdate));
                
            const query = `
                UPDATE patients
                SET 
                    ${fields}
                    
                WHERE patient_id = ${patient_id};
            `;

            await executeMySqlQuery(query);

            return true;
        } 
        catch (error) {
            console.error("Error updating patient data:", error);
            return false;
        }
        }

        static #mapToUpdateAction ={
            "Patient core": PatientMethods.updatePatientCoreData,
        }
        static async MapToUpdatePatientData(patient_id, data, actions ) {
            const results = [];
            for( const action of actions){
                const fn = PatientMethods.#mapToUpdateAction[action];
                if (!fn) continue; // skip if no function for this action
                const result = await fn.call(this, patient_id, data);
                results.push({ action, result });
            }

            return results; // return array of results for each action
        }

    // ============================
    //              Delete User (Only Patient; Any other user must use EMS website to delete) 
    // ============================

static async deletePatientCoreData(patient_id) {
        try {

            // ===1. Delete Patient Record (IMPORTANT: This will also delete related records via foreign key constraints, since we used CASCADE on delete)
            const query = `
                DELETE FROM patients WHERE patient_id = ${patient_id}
            `;
            await executeMySqlQuery(query);

            return true;
        } 
        catch (error) {
            console.error("Error updating patient data:", error);
            return false;
        }
    }



    static #mapDeleteToAction ={
            "Patient core": PatientMethods.deletePatientCoreData,
        }
        static async MapToDeletePatientData(patient_id, data, actions ) {
            const results = [];
            for( const action of actions){
                const fn = PatientMethods.#mapDeleteToAction[action];
                if (!fn) continue; // skip if no function for this action
                const result = await fn.call(this, patient_id, data);
                results.push({ action, result });
            }

            return results; // return array of results for each action
        }
}

module.exports = PatientMethods;