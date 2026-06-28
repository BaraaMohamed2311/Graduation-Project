const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const Tables = require("../../Tables/data");
const sqlTransaction = require("../../Utils/sqlTransaction")
const parseUpdatingStringByTable = require("../parseUpdatingStringByTable");
const parsedUpdatesToObjects = require("../parsedUpdatesToObjects");
const generatePlaceholders = require("../generatePlaceholders")
class PatientMethods {
    // ============================
    //              GET
    // ============================
    static async getPatientFullData(user_id){
        const query = `SELECT 
                            -- from users
                            u.user_email,
                            u.user_password,
                            u.user_name,

                            -- from patients
                            p.user_id AS user_id,    
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
                        JOIN users u ON u.user_type = 'patient' AND u.user_id = p.user_id
                        WHERE p.user_id = ${user_id}`;
                        
        const result = await executeMySqlQuery(query);

        return result[0];
    }

    static async getPatientSpecificData(user_id){
        console.log("get specific patient data triggered" , user_id)
        const query = `SELECT 
                            -- from users
                            u.user_email,
                            u.user_password,
                            u.user_name,

                            -- from patients
                            p.user_id AS user_id,    
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
                        JOIN users u ON u.user_type = 'patient' AND u.user_id = p.user_id
                        WHERE p.user_id = ${user_id}`;
                        
        const result = await executeMySqlQuery(query);

        return result[0];
    }

    static async getOnePatientDataByFilters(filter_fields){
        if(!filter_fields) return null;
        const query = `SELECT * FROM patients p JOIN users u ON p.user_id = u.user_id  WHERE  ${filter_fields}`;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getAllPatientsData(){
        const query = `SELECT * FROM patients `;
        const result = await executeMySqlQuery(query);
        return result;
    }


    static async getAllPatientsCOUNT(whereClause = ""){
        let query = `SELECT COUNT(*) as count FROM patients p JOIN users u ON p.user_id = u.user_id`;
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
                        p.user_id AS user_id,    
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
                    JOIN users u ON u.user_type = 'patient' AND u.user_id = p.user_id
                    `;

        if (filtering_string) { 
                query += " WHERE " + filtering_string;
            }
        // Then ORDER BY To match sync function
        query += " ORDER BY p.user_id ";

        if(limit >0 &&  offset > -1) {
            query += ` LIMIT ${limit} OFFSET ${offset} `
        }
        
        const result = await executeMySqlQuery(query,[limit, offset]);
        return result;
    }
    // ==========================================
    // Patient need his own functions for listing others, as we do not want to expose all data of doctors/surgeons/nurses to patients
    // ==========================================

        static async getListedDoctorDataForPaitent(limit, offset,filtering_string , orderByClause) {

            let query = `
                SELECT
                    -- from users
                    u.user_email,
                    u.user_name,

                    -- from employees
                    e.emp_title AS user_title,
                    e.emp_specialty AS user_specialty,

                    -- from doctors
                    d.emp_id AS user_id, 
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
                JOIN users u ON u.user_type = 'employee' AND u.user_id = d.emp_id
                LEFT JOIN availability a 
                    ON d.emp_id = a.hosp_emp_id
            `;

            const params = [];
            if (filtering_string) {
                query += " WHERE " + filtering_string ;
            }

            query += `
                GROUP BY 
                    d.emp_id,
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

            let query = `
                SELECT 
                    -- from users
                    u.user_email, 
                    u.user_name,

                    -- from employees
                    e.emp_title AS user_title,
                    e.emp_specialty AS user_specialty,
                    
                    -- from surgeons
                    s.emp_id AS user_id, 
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
                JOIN users u ON u.user_type = 'employee' AND u.user_id = s.emp_id
                LEFT JOIN availability a 
                    ON s.emp_id = a.hosp_emp_id
            `;

            const params = [];
            if (filtering_string) {
                query += " WHERE " + filtering_string;
            }

            query += `
                GROUP BY 
                    s.emp_id,
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

    static async getPatientConsultions(user_id){
        const query = `SELECT *
        FROM consultations
        WHERE user_id = ?   
        ORDER BY consultation_date, start_time;
        `

        const result = await executeMySqlQuery(query,[user_id]);
        return result || [];
    }

    static async getPatientConsultionByDate(user_id,consultation_date){
        const query = `SELECT *
        FROM consultations
        WHERE user_id = ? AND consultation_date= ?  
        ORDER BY consultation_date, start_time;
        `

        const result = await executeMySqlQuery(query,[user_id,consultation_date]);
        return result[0];
    }

    static async isPatientAvailable(user_id,consultation_date,start_time){


        const query = "SELECT * FROM consultations WHERE user_id = ? AND consultation_date= ? AND  start_time = ?";

        const result = await executeMySqlQuery(query,[user_id,consultation_date,start_time]);
        // Since not having a consultation record in the table means he is available

        if(!result || result.length === 0 ) return true;
        // if exists check status
        return result[0].consultation_status !== "Scheduled";
    }

    
    // ============================
    //              Update
    // ============================

    static async updatePatientFullCore(user_id, updatingObj) {
    // parsedUpdates = {
        //   users: { sql: "user_name = ?, user_email = ?", values: ["Ali", "a@b.com"] },
        //   employees: { sql: "emp_salary = ?", values: [5000] }
        // }
        const FIELD_PRIORITY = {
            floor_number: "patients"
            }
        const parsedUpdates = parseUpdatingStringByTable(updatingObj,FIELD_PRIORITY);
        // parsedObjects = {
        //   users: { user_name: "Ali", user_email: "a@b.com" },
        //   employees: { emp_salary: 5000 }
        // }

        
        const parsedObjects = parsedUpdatesToObjects(parsedUpdates);
        const queries = [];
        const params = []

    // 1. Ensure user exists
    if (parsedUpdates.users) {
        queries.push(`
            UPDATE users
            SET ${parsedUpdates.users.sql}
            WHERE user_id = ? AND user_type = 'patient'
        `);
        params.push([...parsedUpdates.users.values, user_id])
    }

    // 2. UPSERT patients
    if (parsedUpdates.patients) {
        const { columns_field } = stringifyFields(
            "seperate",
            Object.entries(parsedObjects.patients) || {}
        );
        const placeholders = generatePlaceholders(columns_field.split(',').length);
        queries.push(`
            INSERT INTO patients (user_id , ${columns_field})
            SELECT
                ?,
                ${placeholders}
            FROM users u
            WHERE u.user_type = 'patient' AND u.user_id = ?
            ON DUPLICATE KEY UPDATE
                ${parsedUpdates.patients.sql}
        `);
        // id , insert values, id , update values
        params.push([user_id, ...parsedUpdates.patients.values,user_id ,...parsedUpdates.patients.values])
    }

    
    console.log(queries,params)
    // 3. Version update    
    queries.push(`
        UPDATE table_version
        SET current_version = current_version + 1
        WHERE table_name = 'patients'
    `);

    const result = await sqlTransaction(queries,params);

    // Check if user update affected any rows (to know if user exists)
    if (parsedUpdates.users && !result) {
        throw new Error('User not found. Please register the user first.');
    }
    
    return result;

    
}
    


    // ============================
    //              Delete User (Only Patient; Any other user must use EMS website to delete) 
    // ============================

static async cascadeDeletePatientData(user_id) {

            // ===1. Delete Patient Record (IMPORTANT: This will also delete related records via foreign key constraints, since we used CASCADE on delete)
            const query = `
                DELETE FROM users WHERE user_id = ${user_id}
            `;
            const result = await executeMySqlQuery(query);

            return result?.affectedRows > 0;
        

    }



        
    // ============================
    //              Booking
    // ============================

    static async bookAppointment(emp_id, user_id,availability_id,consultation_date,start_time,end_time) {
        const query = `
            INSERT INTO consultations  (hosp_emp_id ,user_id,availability_id,consultation_date,start_time,end_time)
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [emp_id, user_id,availability_id,consultation_date,start_time,end_time];
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
            AND user_id = ?
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