const DoctorMethods = require("../Utils/methods/DoctorMethods");
const NurseMethods = require("../Utils/methods/NurseMethods");
const SurgeonMethods = require("../Utils/methods/SurgeonMethods");
const PatientMethods = require("../Utils/methods/PatientMethods");
const JoinFiltering = require("../Utils/JoinFiltering");
const executeMySqlQuery = require("../Utils/executeMySqlQuery");

class HospitalUsersMethods   {
    static #hospital_users = new Set(["doctor", "nurse", "surgeon","patient"]);

    // ========================================
    // Patient Belongs to Staff
    // ========================================
    static async patientBelongsToStaff(staff_id,patient_id) { 
         const query = `
                SELECT EXISTS (
                    SELECT 1
                    FROM staff_patient sp
                    JOIN patients p 
                        ON sp.patient_id = p.patient_id
                    WHERE sp.staff_id = ? 
                    AND sp.patient_id = ? AND relation_type = 'Doctor'
                ) AS patient_exists;
            `;

            const result = await executeMySqlQuery(query, [staff_id, patient_id]);

            // Returns true if the patient is linked to the doctor
            return !!result[0].patient_exists;
    }

    // ========================================
    // Count ALL HOSPITAL EMPLOYEES 
    // ========================================
    static async getAllHospitalEmployeesCOUNT(filtering_string = null, emp_perms = null) { 
        /** Filter Conditions **/

        const perms_CONDITION = emp_perms ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` : "";


        const query = `
        SELECT COUNT(*) as total_count
            FROM (
                SELECT u.user_id
                FROM users u
                INNER JOIN employees e ON u.user_id = e.emp_id
                INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id

                -- Left joins for medical specialty tables
                LEFT JOIN doctors d ON eh.hosp_emp_id = d.doctor_id AND eh.emp_title = 'Doctor'
                LEFT JOIN surgeons s ON eh.hosp_emp_id = s.surgeon_id AND eh.emp_title = 'Surgeon'
                LEFT JOIN nurses n ON eh.hosp_emp_id = n.nurse_id AND eh.emp_title = 'Nurse'

                -- Left joins for permissions and roles
                LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id

                WHERE u.user_type = 'employee' AND eh.emp_title != 'Employee' ${filtering_string ? " AND " + filtering_string:""}

                GROUP BY u.user_id
                ${perms_CONDITION}
            ) as subquery;
 `

        /** Get Users Count with Filters **/
        const COUNT = await executeMySqlQuery(query) ;
        
        return COUNT[0]?.total_count;
    }

    // ========================================
    // GET ALL HOSPITAL EMPLOYEES DATA
    // ========================================
    static async getAllHospitalEmployeesFullData(limit=10, offset=0,filtering_string=null,  emp_perms=null){ 


        // by default there is a condition u.user_type = 'employee' AND eh.emp_title != 'Employee'  -- Exclude non-hospital staff
        const perms_CONDITION = emp_perms ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` : "";

        const query = `
        
            SELECT 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                e.emp_specialty,
                eh.emp_title,
                
                -- Get data from specific medical tables based on emp_title
                CASE 
                    WHEN eh.emp_title = 'Doctor' THEN d.initial_consultation_price
                    WHEN eh.emp_title = 'Surgeon' THEN s.initial_consultation_price
                    ELSE NULL 
                END AS initial_consultation_price,
                
                CASE 
                    WHEN eh.emp_title = 'Doctor' THEN d.followup_consultation_price
                    WHEN eh.emp_title = 'Surgeon' THEN s.followup_consultation_price
                    ELSE NULL 
                END AS followup_consultation_price,
                
                CASE 
                    WHEN eh.emp_title = 'Surgeon' THEN s.surgery_price
                    ELSE NULL 
                END AS surgery_price,
                
                CASE 
                    WHEN eh.emp_title = 'Doctor' THEN d.years_of_exp
                    WHEN eh.emp_title = 'Surgeon' THEN s.years_of_exp
                    ELSE NULL 
                END AS years_of_exp,
                
                CASE 
                    WHEN eh.emp_title = 'Nurse' THEN n.floor_number
                    ELSE NULL 
                END AS floor_number,
                
                -- Permissions
                COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                
                -- Role
                COALESCE(hr.role_name, 'NormalUser') AS role_name,
                
                -- Availability schedule
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
                        WHERE hosp_emp_id = eh.hosp_emp_id
                    ) AS formatted
                ), 'None') AS availability_schedule

            FROM users u
            INNER JOIN employees e ON u.user_id = e.emp_id
            INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id

            -- Left joins for medical specialty tables
            LEFT JOIN doctors d ON eh.hosp_emp_id = d.doctor_id AND eh.emp_title = 'Doctor'
            LEFT JOIN surgeons s ON eh.hosp_emp_id = s.surgeon_id AND eh.emp_title = 'Surgeon'
            LEFT JOIN nurses n ON eh.hosp_emp_id = n.nurse_id AND eh.emp_title = 'Nurse'

            -- Left joins for permissions and roles
            LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
            LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id

            WHERE u.user_type = 'employee' AND eh.emp_title != 'Employee' ${filtering_string ? " AND " + filtering_string:""}

            GROUP BY 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                eh.emp_title,
                e.emp_specialty,
                d.initial_consultation_price,
                d.followup_consultation_price,
                s.initial_consultation_price,
                s.followup_consultation_price,
                s.surgery_price,
                d.years_of_exp,
                s.years_of_exp,
                n.floor_number,
                hr.role_name
            ${perms_CONDITION}
            limit ${limit} offset ${offset}
        `
            
        
        
        const result = await executeMySqlQuery(query)

        return result;
    }

    static isHospitalUser(user_title){
        if(!user_title) return false;
        return this.#hospital_users.has(user_title.toLowerCase())
    }



    // ========================================
    // Get Specific Data By Title
    // ========================================

    static #titleToGETSpecificDataFunction = {
        "Doctor": DoctorMethods.getDoctorSpecificData,
        "Surgeon": SurgeonMethods.getSurgeonSpecificData,
        "Nurse": NurseMethods.getNurseSpecificData,
        "Patient": PatientMethods.getPatientSpecificData,
    };

    static async MapUserToGETSpecificDataFunction(user_id, user_title) {
        const fn = HospitalUsersMethods.#titleToGETSpecificDataFunction[user_title];
        if (!fn) {
            return null;
        }
        return await fn.call(this, user_id); // call it in class context
    }
    // ========================================
    // Get Full Data By Title
    // ========================================
    static #titleToGETFullDataFunction = {
        "Doctor": DoctorMethods.getDoctorFullData,
        "Surgeon": SurgeonMethods.getSurgeonFullData,
        "Nurse": NurseMethods.getNurseFullData,
        "Patient": PatientMethods.getPatientSpecificData, // Patient has no full data function so we use specific data function (all fields exist in his specific table)
    };

    static async MapUserToGETFullDataFunction(user_id, user_title) {
        const fn = HospitalUsersMethods.#titleToGETFullDataFunction[user_title];
        if (!fn) {
            return null;
        }
        return await fn.call(this, user_id); // call it in class context
    }

    // ========================================
    // Update Data By Title
    // ========================================

        static #titleUpdateMap = { 
        "Doctor": DoctorMethods.MapToUpdateDoctorData,
        "Surgeon": SurgeonMethods.MapToUpdateSurgeonData,
        "Nurse": NurseMethods.MapToUpdateNurseData,
        "Patient": PatientMethods.MapToUpdatePatientData,
    };


    static async MapUserToUpdateFunction(user_id, title, data , actions) {
        console.log(user_id, title, data , actions)
        const fn = HospitalUsersMethods.#titleUpdateMap[title];
        if (!fn) {
            return null;
        }
        
        return await fn.call(this, user_id, data, actions);
    }


    // ========================================
    // Update Data By Title
    // ========================================

        static #titleFullUpdateMap = { 
        "Doctor": DoctorMethods.updateDoctorFullCore,
        "Surgeon": SurgeonMethods.updateSurgeonFullCore,
        "Nurse": NurseMethods.updateNurseFullCore,
        "Patient": PatientMethods.updatePatientFullCore,
    };


    static async MapUserToFullUpdateFunction(user_id, title, updating_string ) {
        console.log(user_id, title)
        const fn = HospitalUsersMethods.#titleFullUpdateMap[title];
        if (!fn) {
            return null;
        }
        
        return await fn.call(this, user_id, updating_string);
    }



    
    


}


module.exports = HospitalUsersMethods;