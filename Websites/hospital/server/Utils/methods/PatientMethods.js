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