const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const Tables = require("../../Tables/data");
class PatientMethods {
    // ============================
    //              GET
    // ============================
    static async getPatientSpecificData(patient_id){
        const query = `SELECT 
                            -- from users
                            u.user_email,
                            u.user_password,
                            u.user_name,

                            -- from patients
                            p.patient_id AS user_id,    
                            p.patient_phone,
                            p.patient_address,
                            p.isAssignedToRoom,  
                            p.room_number,
                            p.floor_number,
                            p.date_of_birth,
                            p.next_check_date,
                            p.patient_gender,
                            p.emergency_contact
                        FROM patients p
                        JOIN users u ON u.user_type = 'patient' AND u.user_id = p.patient_id
                        WHERE p.patient_id = ${patient_id}`;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getOnePatientDataByFilters(filter_fields){
        if(!filter_fields) return null;
        const query = `SELECT * FROM patients p JOIN users u ON p.patient_id = u.user_id  WHERE  ${filter_fields}`;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getAllPatientsData(){
        const query = `SELECT * FROM patients `;
        const result = await executeMySqlQuery(query);
        return result;
    }


    static async getAllPatientsCOUNT(whereClause = ""){
        let query = `SELECT COUNT(*) as count FROM patients p JOIN users u ON p.patient_id = u.user_id`;
        if (whereClause) {
            query += whereClause;
        }
        const result = await executeMySqlQuery(query);
        return result[0]?.count;
    }

    static async getAllPatientsSpecificData(limit, offset,filtering_string = null){
        let query = `SELECT  
                        -- from users
                        u.user_email, 
                        u.user_name,

                        -- from patients
                        p.patient_id AS user_id,    
                        p.patient_phone,
                        p.patient_address,
                        p.isAssignedToRoom,  
                        p.room_number,
                        p.floor_number,
                        p.date_of_birth,
                        p.next_check_date,
                        p.patient_gender,
                        p.emergency_contact  
                    FROM patients p 
                    JOIN users u ON u.user_type = 'patient' AND u.user_id = p.patient_id`;

        if (filtering_string) { 
                query += " WHERE " + filtering_string;
            }
        if(limit >0 &&  offset > -1) {
            query += " LIMIT ? OFFSET ? "
        }

        const result = await executeMySqlQuery(query,[limit, offset]);
        return result;
    }
    // ==========================================
    // Patient need his own functions for listing others, as we do not want to expose all data of doctors/surgeons/nurses to patients
    // ==========================================

        static async getListedDoctorDataForPaitent(limit, offset,filtering_string , orderByClause) {
            console.log("filtering_string", filtering_string , filtering_string.length)
            let query = `
                SELECT
                    -- from users
                    u.user_email,
                    u.user_name,

                    -- from employees
                    e.emp_title AS user_title,
                    e.emp_specialty AS user_specialty,

                    -- from doctors
                    d.doctor_id AS user_id, 
                    d.hosp_emp_id,
                    d.initial_consultation_price,
                    d.followup_consultation_price,
                    d.years_of_exp,

                    GROUP_CONCAT(
                        CONCAT(a.day_of_week, ': ', DATE_FORMAT(a.start_time, '%H:%i'), '-', DATE_FORMAT(end_time, '%H:%i'))
                        ORDER BY a.day_of_week
                        SEPARATOR '; '
                    ) AS availability_schedule
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                JOIN users u ON u.user_type = 'employee' AND u.user_id = d.doctor_id
                LEFT JOIN availability a 
                    ON d.doctor_id = a.hosp_emp_id
            `;

            const params = [];
            if (filtering_string) {
                query += " WHERE " + filtering_string ;
            }

            query += `
                GROUP BY 
                    d.doctor_id,
                    d.hosp_emp_id,
                    d.initial_consultation_price,
                    d.followup_consultation_price,
                    d.years_of_exp,
                    e.emp_specialty,
                    e.emp_title,
                    u.user_email
                    ${orderByClause}
                    ${ limit ? `LIMIT ${limit}`:""}
                    ${ offset ? `OFFSET ${offset}`:""}
            `;
            
            const result = await executeMySqlQuery(query, params);

            return result;
        }

        static async getListedSurgeonDataForPaitent(limit, offset , filtering_string ,orderByClause) {
            console.log(limit, offset , filtering_string ,orderByClause)
            let query = `
                SELECT 
                    -- from users
                    u.user_email, 
                    u.user_name,

                    -- from employees
                    e.emp_title AS user_title,
                    e.emp_specialty AS user_specialty,
                    
                    -- from surgeons
                    s.surgeon_id AS user_id, 
                    s.hosp_emp_id,
                    s.initial_consultation_price,
                    s.followup_consultation_price,
                    s.surgery_price,
                    s.years_of_exp,
                    

                    GROUP_CONCAT(
                        CONCAT(a.day_of_week, ': ', DATE_FORMAT(a.start_time, '%H:%i'), '-', DATE_FORMAT(a.end_time, '%H:%i'))
                        ORDER BY a.day_of_week
                        SEPARATOR '; '
                    ) AS availability_schedule
                    
                FROM surgeons s
                JOIN employees e ON s.hosp_emp_id = e.emp_id
                JOIN users u ON u.user_type = 'employee' AND u.user_id = s.surgeon_id
                LEFT JOIN availability a 
                    ON s.surgeon_id = a.hosp_emp_id
            `;

            const params = [];
            if (filtering_string) {
                query += " WHERE " + filtering_string;
            }

            query += `
                GROUP BY 
                    s.surgeon_id,
                    s.hosp_emp_id,
                    s.initial_consultation_price,
                    s.followup_consultation_price,
                    s.surgery_price,
                    s.years_of_exp,
                    e.emp_title,
                    e.emp_specialty,
                    u.user_email
                    ${orderByClause}
                    ${ limit ? `LIMIT ${limit}` :""}
                    ${ offset ? `OFFSET ${offset}` :""}
            `;

            const result = await executeMySqlQuery(query, params);
            return result;
        }
    // ==========================================
    // Get Patient Consultions
    // ==========================================

    static async getPatientConsultions(patient_id){
        const query = `SELECT *
        FROM consultations
        WHERE patient_id = ?   
        ORDER BY consultation_date, start_time;
        `

        const result = await executeMySqlQuery(query,[patient_id]);
        return result || [];
    }

    static async getPatientConsultionByDate(patient_id,consultation_date){
        const query = `SELECT *
        FROM consultations
        WHERE patient_id = ? AND consultation_date= ?  
        ORDER BY consultation_date, start_time;
        `

        const result = await executeMySqlQuery(query,[patient_id,consultation_date]);
        return result[0];
    }

    static async isPatientAvailable(patient_id,consultation_date,start_time){


        const query = "SELECT * FROM consultations WHERE patient_id = ? AND consultation_date= ? AND  start_time = ?";

        const result = await executeMySqlQuery(query,[patient_id,consultation_date,start_time]);
        // Since not having a consultation record in the table means he is available

        if(!result || result.length === 0 ) return true;
        // if exists check status
        return result[0].consultation_status !== "Scheduled";
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

        
    // ============================
    //              Booking
    // ============================

    static async bookAppointment(doctor_id, patient_id,availability_id,consultation_date,start_time,end_time) {
        const query = `
            INSERT INTO consultations  (hosp_emp_id ,patient_id,availability_id,consultation_date,start_time,end_time)
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [doctor_id, patient_id,availability_id,consultation_date,start_time,end_time];
        const result = await executeMySqlQuery(query, params);
        return result;
    }

    static async getAppointmentStatus() {
        const query = `
           SELECT status
            FROM consultations
            WHERE hosp_emp_id = ?
            AND consultation_date = ?
            AND start_time = ?
            AND patient_id = ?
        `;
        const params = [];
        const result = await executeMySqlQuery(query, params);
        return result;
    }


    static async updateAppointmentStatus() {
        const query = `
           UPDATE consultations
            SET 
            status = ?
            WHERE consultation_id = ? 
        `;
        const params = [];
        const result = await executeMySqlQuery(query, params);
        return result;
    }

}

module.exports = PatientMethods;