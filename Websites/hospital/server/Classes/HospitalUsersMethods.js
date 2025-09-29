const DoctorMethods = require("../Utils/methods/DoctorMethods");
const NurseMethods = require("../Utils/methods/NurseMethods");
const SurgeonMethods = require("../Utils/methods/SurgeonMethods");
const PatientMethods = require("../Utils/methods/PatientMethods");

class HospitalUsersMethods   {
    static #hospital_users = new Set(["doctor", "nurse", "surgeon","patient"]);

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

    static #titleToGETFunction = {
        "Doctor": DoctorMethods.getDoctorSpecificData,
        "Surgeon": SurgeonMethods.getSurgeonSpecificData,
        "Nurse": NurseMethods.getNurseSpecificData,
        "Patient": PatientMethods.getPatientSpecificData,
    };

    static async MapUserToGETFunction(user_id, user_title) {
        const fn = HospitalUsersMethods.#titleToGETFunction[user_title];
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

    // ========================================
    // Delete Data By Title
    // ========================================

        static #titleDeleteMap = { 
        "Patient": PatientMethods.deletePatientCoreData,
    };


    static async MapUserToDeleteFunction(user_id, title, data , actions) {
        const fn = HospitalUsersMethods.#titleDeleteMap[title];
        if (!fn) throw new Error(`No update function defined for role: ${title}`);
        
        return await fn.call(this, user_id, data, actions);
    }


}


module.exports = HospitalUsersMethods;