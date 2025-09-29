const User = require("./User");
const roles = require("./roles");
const perms = require("./perms");

class SuperAdmin extends User {
    static priority = 100;

    getPriority(){
        return this.priority
    }
    
    // this updates role_name field in roles table 
    static async ChangeOtherUserRole( hosp_emp_id , other_user_Role , other_user_new_role , other_user_email){
        return new Promise(async (resolve , reject )=>{
            try{
                
            // compares user modifier priority with other user's 
                if( this.priority >= roles.getRolePriority(other_user_Role)){
                    await perms.executeChangeOtherRole( hosp_emp_id , other_user_Role , other_user_new_role , other_user_email)
                    resolve(true);
                }
                else{
                    resolve(false);
                }
        } catch(err){
            console.error(err)
            reject(err)
        }
        })
    }

    
    // this updates emp_perms field in perms table
    static async ChangeOtherUserperms(hosp_emp_id , other_user_Role , StringOfNewperms , oldUserpermsSet){
        
        return new Promise(async (resolve , reject )=>{
            try{
                
                if( this.priority >= roles.getRolePriority(other_user_Role)){
                    
                    await perms.executeChangeOtherPerms(hosp_emp_id , StringOfNewperms , oldUserpermsSet)
                
                resolve(true);
            }
            else{

                resolve(false);
            }
        } catch(err){
            console.error(err)
            reject(err)
        }
        })
    }


    // this updates any data field in employees table

    static async EditOtherUserData(other_user_id ,other_user_Role, other_user_title , newOtherUserData , data_actions){
        
        return new Promise(async (resolve , reject )=>{
            try{
                
            if( this.priority >= roles.getRolePriority(other_user_Role)){
                
                await perms.executeChangeOtherUserData(other_user_id, other_user_title, newOtherUserData , data_actions)
                
                resolve(true);
            }
            else{
                resolve(false);
            }
        } catch(err){
            console.error(err)
            reject(err)
        }
        })
    }

    static async EditOtherUserFiles(){}

    static async RemovePatientUser(other_user_id , other_user_Role){

            if( this.priority >= roles.getRolePriority(other_user_Role)){

            if(isNaN(Number(other_user_id))) return;

            return await perms.executeRemoveOther(other_user_id);
            
            }
            else{
                return false
            }
   
        
    }

    // other user must be admin or less role, cannot be superAdmin
    static async RemovePatientUser(other_user_id , other_user_Role){
            if( this.priority >= roles.getRolePriority(other_user_Role)){
                if(isNaN(Number(other_user_id))) return;
                return await perms.executeRemoveOther(other_user_id);
            }
            else{
                return false
            }
    }
}

module.exports = SuperAdmin;