const executeMySqlQuery = require("../executeMySqlQuery");
const sqlTransaction = require("../sqlTransaction")
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const JoinFiltering = require("../JoinFiltering");
class DoctorMethods {

    // ============================
    //              Check
    // ============================
           static async IsMyPatient(doctor_id, patient_id) {
            const query = `
                SELECT EXISTS (
                    SELECT 1
                    FROM doctor_patient dp
                    JOIN patients p 
                        ON dp.patient_id = p.patient_id
                    WHERE dp.doctor_id = ? 
                    AND dp.patient_id = ?
                ) AS patient_exists;
            `;

            const result = await executeMySqlQuery(query, [doctor_id, patient_id]);

            // Returns true if the patient is linked to the doctor
            return !!result[0].patient_exists;
        }

    // ============================
    //              Count
    // ============================

    static async getAllDoctorsCOUNT(whereClause = "", perms_CONDITION = ""){
        let query = "";
        // Optimize query construction based on presence of filters
        if(!whereClause && !perms_CONDITION){
                query = "SELECT COUNT(*) as count FROM doctors ";
            }
        else if(whereClause && !perms_CONDITION){
                    query = `
                SELECT COUNT(DISTINCT d.doctor_id) as count 
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id
                ${whereClause}
            `;
        }
        else if(!whereClause && perms_CONDITION){
            query = `
                SELECT COUNT(DISTINCT d.doctor_id) as count 
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                LEFT JOIN hospital_emp_perms hep ON d.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                ${perms_CONDITION}
            `;
        
        }
        else{
            query = `
                SELECT COUNT(DISTINCT d.doctor_id) as count 
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                LEFT JOIN hospital_emp_perms hep ON d.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id
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

    

        static async getAllDoctorsFullData(limit=10,offset=0,whereClause='', perms_CONDITION=''){

        
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
            
            -- from doctors
            d.doctor_id,
            d.hosp_emp_id,
            d.initial_consultation_price,
            d.followup_consultation_price,
            d.years_of_exp,
            
            -- from hospital_perms via hospital_emp_perms
            COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
            
            -- from hospital_roles with COALESCE for default
            COALESCE(hr.role_name, 'NormalUser') AS role_name,
            
            GROUP_CONCAT(
                CONCAT(da.day_of_week, ': ', da.start_time, '-', da.end_time)
                ORDER BY FIELD(da.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                SEPARATOR '; '
            ) AS availability_schedule

        FROM doctors d
        JOIN employees e ON d.hosp_emp_id = e.emp_id
        LEFT JOIN availability da ON d.doctor_id = da.hosp_emp_id
        
        -- Join with hospital_emp_perms to get perm_id
        LEFT JOIN hospital_emp_perms hep ON d.hosp_emp_id = hep.hosp_emp_id
        
        -- Join with hospital_perms to get perm_name using the perm_id
        LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
        
        -- Join with hospital_roles and use COALESCE for default role name
        LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id

        ${whereClause } 

        GROUP BY 
            e.emp_id, 
            d.doctor_id, 
            d.hosp_emp_id, 
            d.initial_consultation_price, 
            d.followup_consultation_price, 
            d.years_of_exp,
            hr.role_name
        ${perms_CONDITION}
        LIMIT ${limit} OFFSET ${offset}
    `;

        const result = await executeMySqlQuery(query);
        console.log("result",result);
        return result;
    }


     static async getDoctorFullData(doctor_id){

        
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
            
            -- from doctors
            d.doctor_id,
            d.hosp_emp_id,
            d.initial_consultation_price,
            d.followup_consultation_price,
            d.years_of_exp,
            
            -- from hospital_perms via hospital_emp_perms
            COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
            
            -- from hospital_roles with COALESCE for default
            COALESCE(hr.role_name, 'NormalUser') AS role_name,
            
            GROUP_CONCAT(
                CONCAT(da.day_of_week, ': ', da.start_time, '-', da.end_time)
                ORDER BY FIELD(da.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                SEPARATOR '; '
            ) AS availability_schedule

        FROM doctors d
        JOIN employees e ON d.hosp_emp_id = e.emp_id
        LEFT JOIN availability da ON d.doctor_id = da.hosp_emp_id
        
        -- Join with hospital_emp_perms to get perm_id
        LEFT JOIN hospital_emp_perms hep ON d.hosp_emp_id = hep.hosp_emp_id
        
        -- Join with hospital_perms to get perm_name using the perm_id
        LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
        
        -- Join with hospital_roles and use COALESCE for default role name
        LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id

        WHERE d.doctor_id = ?

        GROUP BY 
            e.emp_id, 
            d.doctor_id, 
            d.hosp_emp_id, 
            d.initial_consultation_price, 
            d.followup_consultation_price, 
            d.years_of_exp,
            hr.role_name
    `;

        const result = await executeMySqlQuery(query,[doctor_id]);
        console.log("result",result);
        return result;
    }

    static async getAllDoctorsSpecificData(){
        
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
                
                -- from doctors
                d.hosp_emp_id,
                d.initial_consultation_price,
                d.followup_consultation_price,
                d.years_of_exp,
                GROUP_CONCAT(
                    CONCAT(da.day_of_week, ': ', da.start_time, '-', da.end_time)
                    ORDER BY FIELD(da.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                    SEPARATOR '; '
                ) AS availability_schedule

            FROM doctors d
            JOIN employees e ON d.hosp_emp_id = e.emp_id
            LEFT JOIN availability da ON d.doctor_id = da.hosp_emp_id
            GROUP BY e.emp_id, d.hosp_emp_id, d.initial_consultation_price, d.followup_consultation_price, d.years_of_exp;

`;

        const result = await executeMySqlQuery(query);

        return result[0];
    }

    static async getDoctorSpecificData(doctor_id){
        
        const query = `
         
                SELECT 
                -- from employees
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
                
                -- from doctors
                d.doctor_id,
                d.hosp_emp_id,
                d.initial_consultation_price,
                d.followup_consultation_price,
                d.years_of_exp,
                GROUP_CONCAT(
                    CONCAT(da.day_of_week, ': ', da.start_time, '-', da.end_time)
                    ORDER BY FIELD(da.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
                    SEPARATOR '; '
                ) AS availability_schedule

            FROM doctors d
            JOIN employees e ON d.hosp_emp_id = e.emp_id
            LEFT JOIN availability da ON d.doctor_id = da.hosp_emp_id

            WHERE d.doctor_id = ${doctor_id}
            GROUP BY e.emp_id, d.doctor_id, d.hosp_emp_id, d.initial_consultation_price, d.followup_consultation_price, d.years_of_exp;

`;

        const result = await executeMySqlQuery(query);

        return result[0];
    }

    


    static async getDoctorAllPatients(doctor_id){
        const query = `SELECT 
                        p.patient_id AS user_id,
                        p.patient_name,
                        p.patient_email AS user_email,
                        p.patient_phone,
                        p.patient_address,
                        p.isAssignedToRoom,
                        p.floor_number,
                        p.date_of_birth,
                        p.next_check_date,
                        p.patient_gender,
                        p.emergency_contact,
                        p.created_at,
                        dp.assigned_date
                    FROM doctor_patient dp
                    JOIN patients p 
                        ON dp.patient_id = p.patient_id
                    WHERE dp.doctor_id = ?;
                    `;
            const result = await executeMySqlQuery(query,[doctor_id]);
            console.log("result",result);
            return result;
    }

    static async getDoctorRangedPatients(doctor_id,limit, offset,restfilters=null){
        let query = `SELECT 
                        p.patient_id AS user_id,
                        p.patient_name,
                        p.patient_email AS user_email,
                        p.patient_phone,
                        p.patient_address,
                        p.isAssignedToRoom,
                        p.floor_number,
                        p.date_of_birth,
                        p.next_check_date,
                        p.patient_gender,
                        p.emergency_contact,
                        p.created_at,
                        dp.assigned_date
                    FROM doctor_patient dp
                    JOIN patients p 
                        ON dp.patient_id = p.patient_id
                    WHERE dp.doctor_id = ? 
                    `;
            if(restfilters){
                
            }
            if(limit> 0 &&  offset > -1){
                query += "LIMIT ? OFFSET ?"
            }
            const result = await executeMySqlQuery(query,[doctor_id,limit, offset]);
            console.log("result",result);
            return result;
    }

    static async getDoctorAllPatientsCOUNT(doctor_id){
        const query = `SELECT 
                        COUNT(p.patient_id) as count
                    FROM doctor_patient dp
                    JOIN patients p 
                        ON dp.patient_id = p.patient_id
                    WHERE dp.doctor_id = ? ;
                    `;
            const result = await executeMySqlQuery(query,[doctor_id]);
            console.log("result",result);
            return result[0];
    }



    // ============================
    //              Update
    // ============================

    
    static async updateDoctorSpecificCore(doctor_id, data) {
        try{
        // ===1. Filter data to only include fields relevant to doctors table
        const doctors_table_fields = Tables.doctors;
        const MapOfData = new Map(Object.entries(data));
        let fieldsToUpdate = {};
        for (const field of doctors_table_fields) {
            if( MapOfData.has(field)){
                fieldsToUpdate[field] = MapOfData.get(field);
            }
        }
        // ===2.  Construct dynamic fields string for SQL
        const fields = stringifyFields( "joined",Object.entries(fieldsToUpdate))
            const query = `
                UPDATE doctors
                SET 
                    ${fields}
                WHERE doctor_id = ${doctor_id};
            `;
        // ===3.  Update and return result
            await executeMySqlQuery(query);
            return true;
    }
    catch(err){
        console.error("Error updating doctor data:", err);
        return false;
    }
        }


        static async updateDoctorPatient(doctor_id, patient_id, data ) {
            try{
                // ===1. Filter data to only include fields relevant to doctor_patient table
                const doctor_patient_table_fields = Tables.doctor_patient;
                const MapOfData = new Map(Object.entries(data));
                let fieldsToUpdate = {};
                for (const field of doctor_patient_table_fields) {
                    if( MapOfData.has(field)){
                        fieldsToUpdate[field] = MapOfData.get(field);
                    }
                }
                // ===2.  Construct dynamic fields string for SQL
                const fields = stringifyFields( "joined",Object.entries(fieldsToUpdate))

                    const query = `UPDATE doctor_patient SET ${fields} 
                                    WHERE doctor_id = ? AND patient_id = ?;`;
                    params.push(doctor_id, patient_id);

                    await executeMySqlQuery(query, params);
                    return true
            }
            catch(err){
                console.error("Error updating doctor-patient data:", err);
                return false;
            }
        
            }



        static async replaceDoctorAvailability(doctor_id, data ) {
            // ===0. Extract days, start_time, end_time from array of availability it has a format of 'Monday: 09:00:00-13:00:00; Wednesday: 14:00:00-18:00:00'
            const shifts = data.availability_schedule.split("; ")
            const availabilities = [];
            const seenDuplicateDay = new Set();
            shifts.forEach((shift) => {
                const [day_of_week, time] = shift.split(": ");
                const [start_time, end_time] = time.split("-");
                // Check for repition
                if (!seenDuplicateDay.has(day_of_week)) {
                    availabilities.push({ day_of_week, start_time, end_time });
                    seenDuplicateDay.add(day_of_week);
                }
            });

            const queries = [];
            // ===1. Delete Old Availabilities
            queries.push(`DELETE FROM availability WHERE hosp_emp_id = ${doctor_id}`);

            // ===2. Insert New Ones 
            for (const availability of availabilities) {
                queries.push(`
                INSERT INTO availability (hosp_emp_id, day_of_week,start_time,end_time)
                VALUES (${doctor_id},'${availability.day_of_week}','${availability.start_time}','${availability.end_time}')
                `);
            }

            return await sqlTransaction(queries); 
            }


            static #mapToAction ={
                "Doctor core": DoctorMethods.updateDoctorSpecificCore,
                "Doctor Patients": DoctorMethods.updateDoctorPatient,
                "Doctor Availabilty": DoctorMethods.replaceDoctorAvailability,
            }

            static async MapToUpdateDoctorData(user_id, data, actions ) {
                const results = [];
                for( const action of actions){
                    const fn = DoctorMethods.#mapToAction[action];
                    if (!fn) continue; // skip if no function for this action
                    const result = await fn.call(this, user_id, data);
                    results.push({ action, result });
            }

                return results; // return array of results for each action
            }



   

}

module.exports = DoctorMethods;