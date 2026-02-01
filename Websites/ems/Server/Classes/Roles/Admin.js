const User = require("../User");
const roles = require("./roles");
const perms = require("../Perms/perms");
const consoleLog = require("../../Utils/consoleLog");
/*
Admin should be able to do
*/
class Admin extends User {
    static priority = 50; 

    
    getPriority(){
        return this.priority
    }
    // other user must be admin or less role, cannot be superAdmin
    static  EditOtherUserData(other_user_id ,other_user_Role, other_user_title , updating_string  ){
    console.log("adnin EditOtherUserData",other_user_id, other_user_title, updating_string )
        return new Promise(async (resolve , reject )=>{
            try{
               
            if( this.priority >= roles.getRolePriority(other_user_Role)){

                await perms.executeChangeOtherUserData(other_user_id , other_user_title, updating_string  )
                resolve(true);
            }
            else{
                consoleLog("Admins Cannot Edit Users With Higher Role" , "error");
                resolve(false);
            }
        } catch(err){
            console.error(err)
            reject(err)
        }
        })
       
        
    }
    // other user must be admin or less role, cannot be superAdmin
    async RemoveOtherUser(emp_id , otherUserRole){
        if( this.priority >= roles.getRolePriority(otherUserRole)){

             /*
            This order ensures correct deletion to avoid deleting row with refrenced key error
            ----------------------------------------------------------------------------------
            Step 1 remove user from employee_perms
            Step 2 remove user from roles
            Step 3 remove user from employees
            */

            // this is a quick check of emp_id is number to prevent sql injection
            if(isNaN(Number(emp_id))) return;

            return await perms.executeRemoveOtherUser(emp_id);

        }
        else{
            return false
        }
    }
}


module.exports = Admin;