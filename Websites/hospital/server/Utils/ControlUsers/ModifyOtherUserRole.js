const SuperAdmin = require("../../Classes/SuperAdmin");
async function ModifyOtherUserRole(modifierRole, other_user_id, other_user_Role, other_user_new_role, other_user_email,failing_messages) {

        // Modidify Role

        if(modifierRole === "SuperAdmin"){
            const succeeded =await SuperAdmin.ChangeOtherUserRole(other_user_id , other_user_Role , other_user_new_role , other_user_email)
            if(!succeeded){
            failing_messages.push({success:false , message: "Failed To Modify User Role"})
            }
        }
        else{
            failing_messages.push({success:false , message: "You are not authorized to modify user roles"})
        }


}

    module.exports = ModifyOtherUserRole;