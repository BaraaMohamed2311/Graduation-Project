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
const HospitalUsersMethods = require("../Classes/HospitalUsersMethods.js");
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
//  Get One Patient Data MySQL
// =================================
router.get("/patient/:id",jwtVerify,async (req,res)=>{
    try{
        const {  id :user_id  } = req.params;

        //Bad Request if modifier id or others doesn't exist
        if( !user_id  ) return res.status(400).json({success:false,message:"Bad Request"});

        const patientData = await PatientMethods.getPatientSpecificData(user_id);

      if( patientData ){
        res.status(200).json({success : true , body:patientData, message:"Successfully Fetched Data"})
      }
      else{
        res.status(404).json({success : false , message:"No Users Found !"})
      }

        
    }
    catch(err){
        console.error("Error GET Patient Data",err);
        res.status(500).json({
            success:false,
            message: err.message || "Error GET Patient Data"
        })
    }
})


// =================================
//  Get One Patient Data MySQL
// =================================
router.get("/patient",jwtVerify,async (req,res)=>{
    try{
        const {user_email, user_phone} = req.query;

        //Bad Request if both do not exist
        if( !user_email &&  !user_phone  ) return res.status(400).json({success:false,message:"Bad Request"});
        const filter_email = JoinFiltering(Object.entries({user_email}),"u");
        const filter_phone = JoinFiltering(Object.entries({patient_phone: user_phone}),"p");
        // joins them with "AND" if both exists
        const filter_fields = [filter_email, filter_phone].filter(Boolean).join(" AND ");
        const patientData = await PatientMethods.getOnePatientDataByFilters(filter_fields);
        console.log("patient", patientData)
      if( patientData ){
        res.status(200).json({success : true , body:patientData, message:"Successfully Fetched Data"})
      }
      else{
        res.status(404).json({success : false , message:"No Users Found !"})
      }

        
    }
    catch(err){
        console.error("Error GET Patient Data",err);
        res.status(500).json({
            success:false,
            message: err.message || "Error GET Patient Data"
        })
    }
})

// =================================
//  Get Patient Data  MongoDB
// =================================
router.get("/patient/health-status/:patientId",jwtVerify,async (req,res)=>{
    try{
        const {patientId} = req.params

        const record = await PatientHealthStatus.findOne({ user_id: patientId });
        console.log("patientId healthstatus",patientId)
        if (!record) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }
        console.log("record",record)
        res.json({ success: true, body: record });
    
        
        
    }
    catch(err){
        console.error("Error List All Patient Data",err);
        res.status(500).json({
            success:false,
            message: err.message || "Error List All Patient Data"
        })
    }
})

router.get("/patient-files/:patientId",jwtVerify,async (req,res)=>{
     try {
        const { patientId } = req.params;

        const records = await PatientFile.find({ patient_id: patientId });

        if (!records || records.length === 0) {
        return res.status(404).json({ success: false, message: "No files found for this patient" });
        }

        // Extract file names and ids
        const files = records.map(r => ({
            file_name: r.file.file_name,
            file_id: r.file.file_id,
            file_type: r.file.file_type
        }));

        res.json({ success: true, files });
  } catch (err) {
    console.error("Error listing patient files", err);
    res.status(500).json({ success: false, message: err.message || "Error listing patient files" });
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



// =================================
//  Delete Patient 
// =================================
router.delete("/patient",jwtVerify, async (req, res) => {
    try {
        const { user_id, patient_name } = req.body;
        

        // all these fields required to delete & send email
        if(!user_id  ) return res.status(400).json({success:false,message:"Bad Request"});
        
        

            const userType = await User.getUserTypeById(user_id);
            const userIsPatient = userType === "patient";

                // User is not patient
                if (!userIsPatient) {
                    return res.json({ success: false, message: "Cann't delete a non-patient acctount" });
                } 
            
            const isDeleted = await PatientMethods.cascadeDeletePatientData(user_id);
            const user_email = await User.getUserEmailByID(user_id)
            const text = `Dear User,

                Your hospital patient's account was deleted ${new Date()}.
                If you believe this was a mistake or have any questions, please contact us.

                Sincerely,`
            const isSent = await mailer("hospital@support" ,user_email, "Account Was Deleted" , text);

            if(isDeleted){
                res.status(200).json({
                    success:true,
                    message:"Account was Deleted | Email was sent Successfully"
                });
            }
            else{
                res.status(500).json({
                    success:false,
                    message:"Failed to delete account"
                });
            }

        
    } catch (err) {
        consoleLog(`Error Delete Patient Data ${err}`, "error");
        res.json({
            success: false,
            message: err.message || "Error Delete Patient Data"
        });
    }
});


module.exports = router;
