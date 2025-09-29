
const SuperAdmin = require("../../Classes/SuperAdmin");
async function ModifyOtherUserPerms(emp_id, userRole, modifierRole, newperms , oldUserpermsSet,failing_messages) {

        if(modifierRole === "SuperAdmin"){
            const succeeded =await SuperAdmin.ChangeOtherUserperms(emp_id , userRole , newperms , oldUserpermsSet)
            if(!succeeded){
                failing_messages.push({success:false , message: "Failed To Modify User perms"})
            }
        }
        else{
            failing_messages.push({success:false , message: "You are not authorized to modify user perms"})
        }
    

}

module.exports = ModifyOtherUserPerms;