const executeMySqlQuery = require("../Utils/executeMySqlQuery");
const sqlTransaction = require("../Utils/sqlTransaction");
const HospitalUsersMethods = require("../Classes/HospitalUsersMethods");
const PatientMethods = require("../Utils/methods/PatientMethods");
class perms {

    static async getAllpermsInTable(){
            const query = "SELECT * FROM hospital_perms";
            // declare as let to use map and edit elements
            const permsObjects =  await executeMySqlQuery(query);
            let perms2DArray = [];
            permsObjects.forEach((perm)=> perms2DArray.push([perm.perm_name , perm.perm_id]));
            return new Map(perms2DArray); // return hashing of all perms with it's id 
    }
    


    // ================ Actual Execution of Perms ================= //

    static async executeChangeOtherUserData(other_user_id, other_user_title, newOtherUserData , data_actions){
        return await HospitalUsersMethods.MapUserToUpdateFunction(other_user_id, other_user_title, newOtherUserData , data_actions)
    }

    static async executeModifyPatientFiles(){
        return await PatientMethods.modifyPatientFiles()
    }



    static async executeChangeOtherPerms(hosp_emp_id , StringOfNewperms , oldUserpermsSet){
        
        const permsHash =  await perms.getAllpermsInTable(); // fetch map hash of perms and their ids
        const newpermsArray = StringOfNewperms.split(", ");
        const newpermsSet = new Set(newpermsArray);

        /******************* Stage 1 = Delete All Old Perms *******************/
        if(!oldUserpermsSet.has("None")){
            let deletepermsIDS = [];
            // only add id of perm to be deleted if it's not in old perms
            Array.from(oldUserpermsSet).forEach((oldPerm , indx)=>{
                if(!newpermsSet.has(oldPerm)){
                    deletepermsIDS.push(` ${permsHash.get(oldPerm)}  `);
                }
            })
            
            // if there is perms to delete execute query
            if(deletepermsIDS.length > 0){
                // First we delete all perms related with user
                const deleteQuery = `DELETE FROM  hospital_emp_perms WHERE hosp_emp_id = ? AND perm_id IN ( ${deletepermsIDS.join(",")} )` 
                await executeMySqlQuery(deleteQuery,[hosp_emp_id]);
            }
            
        }

        /******************* Stage 2 = Check If No New Perms To Be Added Stop Execution *******************/
        if(StringOfNewperms === "None") return; 
        
        /******************* Stage 3 = Add All New Perms *******************/
        let addingpermsQuery = [];
        // if perm wasn't exist in old perms and exists in all hashed perms then insert it 
        StringOfNewperms.split(", ").forEach((perm)=>{
            if(permsHash.has(perm) && !oldUserpermsSet.has(perm))
                addingpermsQuery.push(`(${hosp_emp_id},${permsHash.get(perm)})`); // to get perm id
        })

        if(addingpermsQuery.length > 0)
            await executeMySqlQuery("INSERT INTO hospital_emp_perms (hosp_emp_id , perm_id) VALUES" + addingpermsQuery.join(",") ,"Error Updating User perms");
    }

    // need other_user_Role as parameter 
    static async executeChangeOtherRole(hosp_emp_id , other_user_Role , other_user_new_role , other_user_email){
                    /*
                        (condition 1): If user was NormalUser && new role is differnt, this means user wasn't in hospital_roles table
                        (condition 2): If user was having another role then it was added and we just update
                        (condition 3): If user was having another role and new role is NormalUser then it has to be deleted so (condition 1) stays valid, and free up space
                    */
                        console.log("execue other_user_new_role",other_user_new_role)
                        if(other_user_Role === "NormalUser" && other_user_new_role !== "NormalUser"){
                            const query = `INSERT INTO hospital_roles (hosp_emp_id , emp_email , role_name) VALUES (?,?,?)`
                            await executeMySqlQuery(query ,[hosp_emp_id , other_user_email , other_user_new_role]);
                        }
                        else if(other_user_Role !== "NormalUser" && other_user_new_role !== "NormalUser"){
                            const query = `UPDATE hospital_roles SET role_name = ? WHERE hosp_emp_id = ?`
                            await executeMySqlQuery(query ,[ other_user_new_role , hosp_emp_id]);
                        }
                        else{
                            const query = `DELETE FROM hospital_roles  WHERE hosp_emp_id = ?`
                            await executeMySqlQuery(query ,[hosp_emp_id]);
                        }
    }

    static async executeRemoveOther(other_user_id){
        return await PatientMethods.deletePatientCoreData(other_user_id);
    }


    static async executeAccessRooms(){
        
        
    }

    static async executeDeletePatient(patient_id){
        
        
    }

}


module.exports =  perms // export an instance
