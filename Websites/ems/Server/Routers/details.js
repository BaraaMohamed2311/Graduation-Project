/*******************************************************************
    Gets detailed data from MySQL and MongoDB Databases 
*********************************************************************/
const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const PatientMethods = require("../Utils/methods/PatientMethods.js");
const JoinFiltering = require("../Utils/JoinFiltering.js");
const PatientFile = require("../Models/Patient_file.js");
const PatientHealthStatus = require("../Models/Patient_health_status.js");
const User = require("../Classes/User.js");
const HospitalUsersMethods = require("../Classes/CompanyUsers/CompanyUsersMethods.js");
const mailer = require("../Utils/mailer");
const buildJoinedUpdate = require("../Utils/buildJoinedUpdate.js");
const { approvalRequiredFields ,roleToEntityMap} = require("../Tables/data.js");

// =================================
//  Get One Patient Data MySQL
// =================================
router.get("/employee/:id",jwtVerify,async (req,res)=>{
    try{
        const {  id : user_id } = req.params;

        //Bad Request if modifier id or others doesn't exist
        if( !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

        const employeeTitle = await User.getUserTitleByID(user_id);

        if(!employeeTitle || !User.isHospitalUser(employeeTitle)){
            return res.status(404).json({success : false , message:"No Users Found !"})
        }

        const employeeData = await HospitalUsersMethods.MapUserToGETFullDataFunction(user_id, employeeTitle);

      if( employeeData ){
        res.status(200).json({success : true , body:employeeData, message:"Successfully Fetched Data"})
      }
      else{
        res.status(404).json({success : false , message:"No Users Found !"})
      }

        
    }
    catch(err){
        console.error("Error Get Full Details Of Employee",err);
        res.status(500).json({
            success:false,
            message: err.message || "Error Get Full Details Of Employee"
        })
    }
})

// =================================
//  Patch Any User  (we will update specific fields not whole user data)
// =================================
router.patch("/user",jwtVerify, async (req, res) => {
    try {
        const { user_id, ...newUserDetails } = req.body;
        

        // all these fields required to delete & send email
        if(!user_id  ) return res.status(400).json({success:false,message:"Bad Request"});

        const userExists = await User.checkIfUserExistsById(user_id);

        if(!userExists){
            return res.status(404).json({ success: false, message: "User Not Found" });
        }
        
        if(newUserDetails.user_email){
            const emailExists = await User.checkIfUserExistsByEmail(newUserDetails.user_email);
            if(emailExists){
                return res.status(409).json({ success: false, message: "Email Already In Use" });
            }
        }
        // get title to know which table to update
        const userTitle = await User.getUserTitleByID(user_id);

        // Remove fields that require approval
        const roleKey = roleToEntityMap[userTitle.toLowerCase()];
        const titleApprovalRequiredFields = approvalRequiredFields[roleKey] || [];

        titleApprovalRequiredFields.forEach(key => {
        delete newUserDetails[key];
        });


        // build the updating string for query
        const updating_string = buildJoinedUpdate(newUserDetails);

            
            const isUpdated =  await HospitalUsersMethods.MapUserToFullUpdateFunction(user_id, userTitle, updating_string);

        if(isUpdated){
            return res.status(200).json({ success: true, message: "User Updated Successfully" });
        }
        else{
            return res.status(500).json({ success: false, message: "Failed to update user data" });
        }
        
    } catch (err) {
        res.json({
            success: false,
            message: err.message || "Error Patching user Data"
        });
    }
});





module.exports = router;
