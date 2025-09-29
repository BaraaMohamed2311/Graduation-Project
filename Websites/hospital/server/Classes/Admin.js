const User = require("./User");
const roles = require("./roles");
const perms = require("./perms");
const consoleLog = require("../Utils/consoleLog");
/*
Admin should be able to do
*/
class Admin extends User {
    static priority = 50; 

    
    getPriority(){
        return this.priority
    }
    // other user must be admin or less role, cannot be superAdmin
    static  EditOtherUserData(other_user_id ,other_user_Role, other_user_title , newOtherUserData , data_actions){
    
        return new Promise(async (resolve , reject )=>{
            try{
               
            if( this.priority >= roles.getRolePriority(other_user_Role)){

                await perms.executeChangeOtherUserData(other_user_id , other_user_title, newOtherUserData , data_actions)
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

    static async EditOtherUserFiles(){}
    // other user must be admin or less role, cannot be superAdmin
    static async RemovePatientUser(other_user_id , otherUserRole){
            if( this.priority >= roles.getRolePriority(otherUserRole)){
                if(isNaN(Number(other_user_id))) return;
                return await perms.executeRemoveOther(other_user_id);
            }
            else{
                return false
            }
    }

    static async EditOtherUserFiles(){}

}


module.exports = Admin;