const User = require("../User");
const roles = require("./roles");
const perms = require("../Perms/perms");

class SuperAdmin extends User {
    static priority = 100;

    getPriority(){
        return this.priority
    }
    
    // this updates role_name field in roles table
    static async ChangeOtherUserRole(
    emp_id,
    other_user_Role,
    other_user_new_role
    ) {
        if (this.priority < roles.getRolePriority(other_user_Role)) {
            return {
            success: false,
            message: "User cannot modify higher roles"
            };
        }

        await perms.executeChangeOtherRole(
            emp_id,
            other_user_Role,
            other_user_new_role
        );

        return { success: true };
    }


    
    // this updates emp_perms field in perms table
    static async ChangeOtherUserperms(emp_id,other_user_Role,StringOfNewperms,oldUserpermsSet) {
        if (this.priority < roles.getRolePriority(other_user_Role)) {
            return {
            success: false,
            message: "User cannot modify higher roles"
            };
        }

        await perms.executeChangeOtherPerms(
            emp_id,
            StringOfNewperms,
            oldUserpermsSet
        );

        return { success: true };
    }


    // this updates any data field in employees table

    static async EditOtherUserData(other_user_id, other_user_Role, other_user_title, updatingObj) {
        if (this.priority >= roles.getRolePriority(other_user_Role)) {
            await perms.executeChangeOtherUserData(
            other_user_id,
            other_user_title,
            updatingObj
            );
            return { success: true };
        }

        return {
            success: false,
            message: "User cannot modify higher roles"
        };
        }



}

module.exports = SuperAdmin;