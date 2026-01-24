
const SuperAdmin = require("../../Classes/Roles/SuperAdmin");
//===========================================================
//              Help in Choosing Role Class to Execute Task
//===========================================================
async function ModifyOtherUserPerms(emp_id, userRole, modifierRole, newpermsSet , oldUserpermsSet,failing_messages) {

        if(modifierRole === "SuperAdmin"){
            const succeeded =await SuperAdmin.ChangeOtherUserperms(emp_id , userRole , newpermsSet , oldUserpermsSet)
            if(!succeeded){
                failing_messages.push({success:false , message: "Failed To Modify User perms"})
            }
        }
        else{
            failing_messages.push({success:false , message: "You are not authorized to modify user perms"})
        }
    

}

module.exports = ModifyOtherUserPerms;