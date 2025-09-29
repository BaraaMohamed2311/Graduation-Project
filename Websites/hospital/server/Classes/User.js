
const executeMySqlQuery = require("../Utils/executeMySqlQuery");
const bcrypt = require("bcrypt");

class User {


    static async emailExists( emp_email){
        const query = `SELECT emp_email FROM  employees WHERE emp_email = ? LIMIT 1`;
        const result = await executeMySqlQuery(query,[emp_email])

        return result.length > 0 ; // if length is greater than 0 then email exists
    }

    // =============================
    //              Get
    // =============================
    static async getUserIDAndTable(user_email  ){
        if (user_email) {
            const query_employees = `
                SELECT emp_id FROM employees WHERE emp_email = ? LIMIT 1
            `;
            const query_patients = `
                SELECT patient_id FROM patients WHERE patient_email = ? LIMIT 1
            `;
            const result_from_employees = await executeMySqlQuery(query_employees,[user_email]);
            const result_from_patients = await executeMySqlQuery(query_patients,[user_email]);

            if(result_from_employees.length > 0){
                return {user_id:result_from_employees[0]?.emp_id, table:"employees"}; 
            }
            else if(result_from_patients.length > 0){
                return {user_id:result_from_patients[0]?.patient_id, table:"patients"}; 
            }
            } else {
                console.error("User's Id do not exist in db");
            return null;
        }
        }


        static async getUserEmailAndTable(user_id){
        if (user_id) {
            const query_employees = `
                SELECT emp_email FROM employees WHERE emp_id = ? LIMIT 1
            `;
            const query_patients = `
                SELECT patient_email FROM patients WHERE patient_id = ? LIMIT 1
            `;
            const result_from_employees = await executeMySqlQuery(query_employees,[user_id]);
            const result_from_patients = await executeMySqlQuery(query_patients,[user_id]);

            if(result_from_employees.length > 0){
                return {user_email:result_from_employees[0]?.emp_email, table:"employees"}; 
            }
            else if(result_from_patients.length > 0){
                return {user_email:result_from_patients[0]?.patient_emmail, table:"patients"}; 
            }
            } else {
                console.error("User's Id do not exist in db");
            return null;
        }
        }

        static async getUserTitle(user_email  ){
        //Finds Role of user using id or email & by default Role is Employee if not defined or user not exist
        if (user_email) {
            const query = `
                SELECT COALESCE(
                (SELECT emp_title FROM employees WHERE emp_email = ? LIMIT 1),
                'Patient'
            ) AS emp_title`;

            const result = await executeMySqlQuery(query,[user_email]);
            

            if(result.length > 0){
                return result[0]?.emp_title; 
            }
            } else {
                console.error("User's Id do not exist in db");
            return null;
        }
        }

    



    static async getUserRole(hosp_emp_id  ){
        //Finds Role of user using id or email & by default Role is Employee if not defined or user not exist
        if (hosp_emp_id) {
            const query = `
                SELECT COALESCE(
                    (SELECT NULLIF(hr.role_name, '') 
                    FROM hospital_roles hr 
                    WHERE hr.hosp_emp_id = ?
                    LIMIT 1),
                    'NormalUser'
                ) AS role_name;
            `;

            const result = await executeMySqlQuery(query,[hosp_emp_id]);
            console.log("result and query from getUserRole",result[0]?.role_name)
            return result[0]?.role_name; 
        } else {
            console.error("No hosp_emp_id Provided to get Role");
            return null;
        }
        
     
    }


    static async getSetUserperms(hosp_emp_id){
// 
        const query = `SELECT COALESCE((SELECT COALESCE(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', ') , 'None') FROM hospital_perms hp JOIN hospital_emp_perms hep ON hp.perm_id = hep.perm_id WHERE hep.hosp_emp_id =?), 'None') AS perm_name; `
        // [0] as result is in array form but perms field has a single value as string 
        const result = await executeMySqlQuery(query ,[hosp_emp_id]);
        const setOfPerms = result.length > 0 ?  new Set(result[0].perm_name.split(", ")) : new Set(result[0].perm_name.split(["None"]))

            return  setOfPerms;
        
    }

    // =============================
    //              Other Methods
    // =============================
    static async hashPassword(password){
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }





    

}


module.exports = User;