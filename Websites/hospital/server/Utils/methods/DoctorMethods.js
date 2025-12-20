const executeMySqlQuery = require("../executeMySqlQuery");
const sqlTransaction = require("../sqlTransaction")
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const JoinFiltering = require("../JoinFiltering");
class DoctorMethods {


    // ============================
    //              Count
    // ============================

    static async getAllDoctorsCOUNT(filtering_string = "", perms_CONDITION = ""){
        console.log("filtering_string",filtering_string.length,perms_CONDITION)
        let query = "";
        // Optimize query construction based on presence of filters
        if(!filtering_string && !perms_CONDITION){
                query = "SELECT COUNT(*) as count FROM doctors ";
            }
        else if(filtering_string && !perms_CONDITION){
                    query = `
                SELECT COUNT(DISTINCT d.doctor_id) as count 
                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id
                ${filtering_string ? " AND " + filtering_string : ""}
            `;
        }
        else if(!filtering_string && perms_CONDITION){
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
                ${filtering_string ? " AND " + filtering_string : ""}
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
                -- from users
                u.user_id,
                u.user_email,
                u.user_name,
                -- from employees

                e.emp_abscence,
                e.emp_rate,
                e.emp_title,
                e.emp_specialty,
                
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
                
                -- FIXED: Format availability schedule to remove seconds and use DISTINCT to avoid duplicates
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
                        WHERE hosp_emp_id = d.doctor_id
                    ) AS formatted
                ), 'None') AS availability_schedule

            FROM doctors d
            JOIN employees e ON d.hosp_emp_id = e.emp_id
            JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id
            LEFT JOIN availability a ON d.doctor_id = a.hosp_emp_id

            -- Join with hospital_emp_perms to get perm_id
            LEFT JOIN hospital_emp_perms hep ON d.hosp_emp_id = hep.hosp_emp_id

            -- Join with hospital_perms to get perm_name using the perm_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id

            -- Join with hospital_roles and use COALESCE for default role name
            LEFT JOIN hospital_roles hr ON d.hosp_emp_id = hr.hosp_emp_id

            ${whereClause} 

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
        
        return result;
    }


     static async getDoctorFullData(doctor_id){

        
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

            
            -- from doctors
            d.doctor_id,
            d.hosp_emp_id,
            d.initial_consultation_price,
            d.followup_consultation_price,
            d.years_of_exp,
            
            -- from hospital_perms via hospital_emp_perms (subquery)
            COALESCE(NULLIF((
                SELECT GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', ')
                FROM hospital_emp_perms hep
                JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                WHERE hep.hosp_emp_id = d.hosp_emp_id
            ), ''), 'None') AS emp_perms,
            
            -- from hospital_roles with COALESCE for default (subquery)
            COALESCE((
                SELECT hr.role_name
                FROM hospital_roles hr
                WHERE hr.hosp_emp_id = d.hosp_emp_id
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
                        WHERE hosp_emp_id = d.doctor_id
                    ) AS formatted
                ), 'None') AS availability_schedule

        FROM doctors d
        JOIN employees e ON d.hosp_emp_id = e.emp_id
        JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id
        WHERE d.doctor_id = ?
    `;

        const result = await executeMySqlQuery(query,[doctor_id]);
        
        return result[0];
    }

    // =============================================
    //  No Roles Or Perms are fetched in Specific queries
    // =============================================


    static async getAllDoctorsSpecificData(){
        
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
                    
                    -- from doctors
                    d.hosp_emp_id,
                    d.initial_consultation_price,
                    d.followup_consultation_price,
                    d.years_of_exp,

                    -- availability schedule (subquery)
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
                            WHERE hosp_emp_id = d.doctor_id
                        ) AS formatted
                    ), 'None') AS availability_schedule

                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id

`;

        const result = await executeMySqlQuery(query);

        return result[0];
    }

    static async getDoctorSpecificData(doctor_id){
        
        const query = `
                SELECT 

                    -- from users
                    u.user_id,
                    u.user_email,
                    u.user_password, -- include password for authentication purposes
                    u.user_name,
                    -- from employees

                    e.emp_salary,
                    e.emp_abscence,
                    e.emp_bonus,
                    e.emp_rate,
                    e.emp_title,
                    e.emp_specialty,
                    
                    -- from doctors
                    d.doctor_id,
                    d.hosp_emp_id,
                    d.initial_consultation_price,
                    d.followup_consultation_price,
                    d.years_of_exp,

                    -- availability schedule (subquery)
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
                            WHERE hosp_emp_id = d.doctor_id
                        ) AS formatted
                    ), 'None') AS availability_schedule

                FROM doctors d
                JOIN employees e ON d.hosp_emp_id = e.emp_id
                JOIN users u ON u.user_type = 'employee' AND u.user_id = e.emp_id
                WHERE d.doctor_id = ${doctor_id}

`;

        const result = await executeMySqlQuery(query);

        return result[0];
    }

    


    static async getDoctorAllPatients(staff_id){
        const query = `SELECT 
                        -- from users
                        u.user_email,
                        u.user_name,
                        -- from patients
                        p.patient_id AS user_id,
                        p.patient_phone,
                        p.patient_address,
                        p.isAssignedToRoom,
                        p.floor_number,
                        p.date_of_birth,
                        p.next_check_date,
                        p.patient_gender,
                        p.emergency_contact,
                        p.created_at,
                        sp.assigned_date
                    FROM staff_patient sp
                    JOIN patients p ON sp.patient_id = p.patient_id
                    JOIN users u ON u.user_type = 'patient' AND u.user_id = p.patient_id
                    WHERE sp.staff_id = ? AND relation_type = 'Doctor';
                    `;
            const result = await executeMySqlQuery(query,[staff_id]);
            
            return result;
    }

    static async getDoctorRangedPatients(staff_id,limit, offset,filtering_string=null){
        let query = `SELECT 
                        -- from users
                        u.user_email,
                        u.user_name,

                        -- from patients
                        p.patient_id AS user_id,
                        p.patient_phone,
                        p.patient_address,
                        p.isAssignedToRoom,
                        p.floor_number,
                        p.date_of_birth,
                        p.next_check_date,
                        p.patient_gender,
                        p.emergency_contact,
                        p.created_at,
                        sp.assigned_date
                    FROM staff_patient sp
                    JOIN patients p ON sp.patient_id = p.patient_id
                    JOIN users u ON u.user_type = 'patient' AND u.user_id = p.patient_id
                    WHERE sp.staff_id = ?  AND relation_type = 'Doctor'
                    `;
            if(filtering_string){
                query += " AND " + filtering_string
            }

            if(limit> 0 &&  offset > -1){
                query += " LIMIT ? OFFSET ? "
            }
            const result = await executeMySqlQuery(query,[staff_id,limit, offset]);
            
            return result;
    }

    static async getDoctorAllPatientsCOUNT(staff_id){
        const query = `SELECT 
                        COUNT(p.patient_id) as count
                    FROM staff_patient sp
                    JOIN patients p 
                        ON sp.patient_id = p.patient_id
                    WHERE sp.staff_id = ?  AND relation_type = 'Doctor';
                    `;
            const result = await executeMySqlQuery(query,[staff_id]);
            
            return result[0];
    }



    // ============================
    //              Update
    // ============================

    static async updateDoctorFullCore(doctor_id, updating_string){
        const query = `
        UPDATE doctors d
            JOIN employees e 
                ON d.hosp_emp_id = e.emp_id
            JOIN users u 
                ON u.user_type = 'employee' AND u.user_id = e.emp_id

            SET
                ${updating_string}

            WHERE d.doctor_id = ${doctor_id};
        `

        const version_query = `UPDATE table_version
                            SET current_version = current_version + 1
                            WHERE table_name = 'hospital_employees';
                            `
        
        const result = await sqlTransaction([query,version_query])

        return result;

    }



        static async updateDoctorPatient(doctor_id, patient_id, data ) {
            try{
                // ===1. Filter data to only include fields relevant to doctor_patient table
                const staff_patient_table_fields = Tables.staff_patient;
                const MapOfData = new Map(Object.entries(data));
                let fieldsToUpdate = {};
                for (const field of staff_patient_table_fields) {
                    if( MapOfData.has(field)){
                        fieldsToUpdate[field] = MapOfData.get(field);
                    }
                }
                // ===2.  Construct dynamic fields string for SQL
                const fields = stringifyFields( "joined",Object.entries(fieldsToUpdate))

                    const query = `UPDATE staff_patient SET ${fields}
                                    WHERE staff_id = ${doctor_id} AND patient_id = ${patient_id} AND relation_type = 'Doctor';`;
                    const version_query = `UPDATE table_version
                            SET current_version = current_version + 1
                            WHERE table_name = 'patients';
                            `


                    return await sqlTransaction([query, version_query]);

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


   

}

module.exports = DoctorMethods;