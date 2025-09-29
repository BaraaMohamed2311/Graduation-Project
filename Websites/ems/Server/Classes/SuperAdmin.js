const User = require("./User");
const roles = require("./roles");
const perms = require("./perms");

class SuperAdmin extends User {
    static priority = 100;

    getPriority(){
        return this.priority
    }
    
    // this updates role_name field in roles table
    static async ChangeOtherUserRole( emp_id , otherUserRole , newRole , otherUserEmail){
        return new Promise(async (resolve , reject )=>{
            try{
                
            // compares user modifier priority with other user's 
                if( this.priority >= roles.getRolePriority(otherUserRole)){
                    await perms.executeChangeOtherRole( emp_id , otherUserRole , newRole , otherUserEmail)
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
    static async ChangeOtherUserperms(emp_id , otherUserRole , StringOfNewperms , oldUserpermsSet){
        
        return new Promise(async (resolve , reject )=>{
            try{
                
                if( this.priority >= roles.getRolePriority(otherUserRole)){
                    
                    await perms.executeChangeOtherPerms(emp_id , StringOfNewperms , oldUserpermsSet)
                
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
    static async EditOtherUser(emp_id , otherUserRole , entries){
        
        return new Promise(async (resolve , reject )=>{
            try{
                
            if( this.priority >= roles.getRolePriority(otherUserRole)){
                
                await perms.executeEditOthers(emp_id  , entries)
                
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

    static async RemoveOtherUser(emp_id , otherUserRole){
        /**************************************/
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

module.exports = SuperAdmin;