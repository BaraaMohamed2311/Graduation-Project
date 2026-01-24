const SuperAdmin = require("../../Classes/Roles/SuperAdmin");
const Admin = require("../../Classes/Roles/Admin");
const User = require("../../Classes/User");
async function ModifyOtherUserData(emp_id, userRole, modifierRole, updatedEmployeeData, employee_user_email,failing_messages) {
    // This function is used to modify data in the database
    // It will be implemented later
        
        if(updatedEmployeeData.user_email && employee_user_email && employee_user_email !== updatedEmployeeData.user_email){
            // if email is changed we check if it exists in db
            const emailExists = await User.emailExists(updatedEmployeeData.user_email);
            console.log("emailExists", emailExists)
                if(emailExists){
                    failing_messages.push({success:false , message: "That Email Already Exists"})
                }
        }
        if(modifierRole === "SuperAdmin"){
            const succeeded = await SuperAdmin.EditOtherUser(emp_id ,userRole , Object.entries(updatedEmployeeData))
            if(!succeeded){
                failing_messages.push({success:false , message: "You Have To Be Admin Or SuperAdmin"})
            }
        }
        else if (modifierRole === "Admin"){
        const succeeded = await Admin.EditOtherUser(emp_id ,userRole , Object.entries(updatedEmployeeData)  )
            if(!succeeded){
                failing_messages.push({success:false , message: "Failed To Modify User Data"})
            }
        }
        else{
            failing_messages.push({success:false , message: "You are not authorized to modify user Data"})
        }

        
        
    
}

module.exports = ModifyOtherUserData;