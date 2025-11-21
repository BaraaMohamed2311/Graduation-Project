const DoctorMethods = require("../Utils/methods/DoctorMethods");
const NurseMethods = require("../Utils/methods/NurseMethods");
const SurgeonMethods = require("../Utils/methods/SurgeonMethods");
const PatientMethods = require("../Utils/methods/PatientMethods");
const JoinFiltering = require("../Utils/JoinFiltering");

class HospitalUsersMethods   {
    static #hospital_users = new Set(["doctor", "nurse", "surgeon","patient"]);

    // ========================================
    // Count ALL HOSPITAL EMPLOYEES 
    // ========================================
    static async getAllHospitalEmployeesCOUNT(restFilters = null, role_name = null, emp_perms = null) { 
        /** Filter Conditions **/
        const conditions = [];

        // Add rest filters on employee table
        /**  
        restFilters are fields in employees table as it is not logical to filter of specific table like consultion_price etc 
        because authorized users to list employees cannot modify their specific fields 
        **/
        if (restFilters && Object.keys(restFilters).length > 0) {
            conditions.push(JoinFiltering(Object.entries(restFilters), "e"));
        }

        // Add role filters
        if (role_name && role_name !== "NormalUser") {
            conditions.push(JoinFiltering(Object.entries({role_name: role_name}), "hr"));
        }
        console.log("conditions",conditions)
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        console.log("whereClause",whereClause)
        const perms_CONDITION = emp_perms ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` : "";

        /** Get Users Count with Filters **/
        const doctors = await DoctorMethods.getAllDoctorsCOUNT(whereClause, perms_CONDITION);
        const surgeons = await SurgeonMethods.getAllSurgeonsCOUNT(whereClause, perms_CONDITION);
        const nurses = await NurseMethods.getAllNursesCOUNT(whereClause, perms_CONDITION);
        
        return doctors + surgeons + nurses;
    }

    // ========================================
    // GET ALL HOSPITAL EMPLOYEES DATA
    // ========================================
    static async getAllHospitalEmployeesFullData(limit=10, offset=0,restFilters=null, role_name=null, emp_perms=null){ 
        // Calculate limits per type
        const userTypes = ['doctors', 'surgeons', 'nurses'];
        // 10/3 = 3 per type which results in 9 total, which is acceptable so that when limit per page is 10 there will be no missing data
        const limitPerType = Math.floor(limit / userTypes.length); 

        /**  Filter Conditions **/
        const Rest_CONDITION = restFilters ? JoinFiltering(Object.entries(restFilters),"e") : "" ;
        const roles_CONDITION = !role_name || role_name === "NormalUser" ? "" : JoinFiltering(Object.entries({role_name:role_name}),"hr") ;
        const conditions = [];
        if (Rest_CONDITION) conditions.push(Rest_CONDITION);
        if (roles_CONDITION) conditions.push(roles_CONDITION);
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const perms_CONDITION = emp_perms ? `HAVING FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT hp.perm_name)) > 0` : "";

        /**  Get Users **/
        const [doctors, surgeons, nurses] = await Promise.all([
            DoctorMethods.getAllDoctorsFullData(limitPerType, offset, whereClause, perms_CONDITION),
            SurgeonMethods.getAllSurgeonsFullData(limitPerType, offset, whereClause, perms_CONDITION),
            NurseMethods.getAllNursesFullData(limitPerType, offset, whereClause, perms_CONDITION)
        ]);

        return [...doctors, ...surgeons, ...nurses];
    }

    static isHospitalUser(user_title){
        if(!user_title) return false;
        console.log("checking if hospital user" , this.#hospital_users.has(user_title.toLowerCase()),user_title)
        return this.#hospital_users.has(user_title.toLowerCase())
    }

    // ========================================
    // Check Data By Title
    // ========================================
    static #titleToIsMyPatientFunction = {
        "Doctor": DoctorMethods.IsMyPatient,
        "Surgeon": SurgeonMethods.IsMyPatient,
        "Nurse": NurseMethods.IsMyPatient,
    };

    static async MapUserToIsMyPatientFunction(user_id, user_title,patient_id) {
        const fn = HospitalUsersMethods.#titleToIsMyPatientFunction[user_title];
        if (!fn) {
            throw new Error(`No function mapped for user title: ${user_title}`);
        }
        return await fn.call(this, user_id, patient_id); // call it in class context
    }

    // ========================================
    // Get Data By Title
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
            throw new Error(`No function mapped for user title: ${user_title}`);
        }
        return await fn.call(this, user_id); // call it in class context
    }

    static #titleToGETFullDataFunction = {
        "Doctor": DoctorMethods.getDoctorFullData,
        "Surgeon": SurgeonMethods.getSurgeonFullData,
        "Nurse": NurseMethods.getNurseFullData,
        "Patient": PatientMethods.getPatientSpecificData, // Patient has no full data function so we use specific data function (all fields exist in his specific table)
    };

    static async MapUserToGETFullDataFunction(user_id, user_title) {
        const fn = HospitalUsersMethods.#titleToGETFullDataFunction[user_title];
        if (!fn) {
            throw new Error(`No function mapped for user title: ${user_title}`);
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
        if (!fn) throw new Error(`No update function defined for role: ${title}`);
        
        return await fn.call(this, user_id, data, actions);
    }



    
    


}


module.exports = HospitalUsersMethods;