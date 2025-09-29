const SuperAdmin = require("../../Classes/SuperAdmin");
const Admin = require("../../Classes/Admin");
const User = require("../../Classes/User");
async function ModifyOtherUserData() {
 
        if(modifierRole === "SuperAdmin"){
            const succeeded = await SuperAdmin.EditOtherUserFiles()
            if(!succeeded){
                failing_messages.push({success:false , message: "You Have To Be Admin Or SuperAdmin"})
            }
        }
        else if (modifierRole === "Admin"){
        const succeeded = await Admin.EditOtherUserFiles()
            if(!succeeded){
                failing_messages.push({success:false , message: "Failed To Modify User Files"})
            }
        }
        else{
            failing_messages.push({success:false , message: "You are not authorized to modify user Files"})
        }

        
        
    
}

module.exports = ModifyOtherUserData;