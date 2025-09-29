const SuperAdmin = require("../../Classes/SuperAdmin");
const Admin = require("../../Classes/Admin");
const User = require("../../Classes/User");
async function ModifyOtherUserData(other_user_id, other_user_Role,other_user_title, modifierRole, newOtherUserData, oldOtherUserEmail , data_actions,failing_messages) {
    // This function is used to modify data in the database
    // It will be implemented later
        
        if(newOtherUserData.emp_email && oldOtherUserEmail && oldOtherUserEmail !== newOtherUserData.emp_email){
            // if email is changed we check if it exists in db
            const emailExists = await User.emailExists(newOtherUserData.emp_email);
            console.log("emailExists", emailExists)
                if(emailExists){
                    failing_messages.push({success:false , message: "That Email Already Exists"})
                }
        }
        if(modifierRole === "SuperAdmin"){
            const succeeded = await SuperAdmin.EditOtherUserData(other_user_id ,other_user_Role, other_user_title , newOtherUserData , data_actions)
            if(!succeeded){
                failing_messages.push({success:false , message: "You Have To Be Admin Or SuperAdmin"})
            }
        }
        else if (modifierRole === "Admin"){
        const succeeded = await Admin.EditOtherUserData(other_user_id ,other_user_Role,other_user_title , newOtherUserData , data_actions )
            if(!succeeded){
                failing_messages.push({success:false , message: "Failed To Modify User Data"})
            }
        }
        else{
            failing_messages.push({success:false , message: "You are not authorized to modify user Data"})
        }

        
        
    
}

module.exports = ModifyOtherUserData;