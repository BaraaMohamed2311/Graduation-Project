/*******************************************************************
    Gets detailed data from MySQL and MongoDB Databases 
*********************************************************************/
const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const PatientMethods = require("../Utils/methods/PatientMethods.js");
const JoinFiltering = require("../Utils/JoinFiltering.js");
const PatientFile = require("../Models/Patient_file.js");
const User = require("../Classes/User.js");
const HospitalUsersMethods = require("../Classes/HospitalUsers/HospitalUsersMethods.js");
const mailer = require("../Utils/mailer");
const buildJoinedUpdate = require("../Utils/buildJoinedUpdate.js");
const { approvalRequiredFields ,roleToEntityMap  } = require("../Tables/data.js");
const { pickAllowedFields , SELF_UPDATE_FIELDS} = require("../Tables/pick_exc_fields.js");
const AuditLogs = require("../Utils/methods/AuditLogs.js");
const PatientHealthStatus = require("../Models/Patient_health_status.js")
const extractUserFromToken = require("../Utils/extractUserFromToken.js")
// =================================
//  Get One Patient Data MySQL
// =================================

// =================================
//  Get Employee by Email (for Nurse → Assign-to-Staff flow)
//  Only returns the employee if their title is Doctor or Surgeon
// =================================
router.get("/employees", jwtVerify, async (req, res) => {
    try {
        const { user_email } = req.query;

        // Bad Request if email is missing
        if (!user_email) return res.status(400).json({ success: false, message: "Bad Request: user_email is required" });

        // Check that the requester is a Nurse
        const tokenFields = extractUserFromToken(req);
        const requesterTitle = await User.getUserTitleByID(tokenFields.user_id);

        if (requesterTitle?.toLowerCase() !== "nurse") {
            return res.status(403).json({ success: false, message: "Only Nurses can use this lookup" });
        }

        // Resolve user_id from email
        const emp_title = await User.getUserTitleByEmail(user_email);
        const staff_id = await User.getUserIDByEmail(user_email)
        
        console.log("emp_title",emp_title)
        // Enforce title restriction — must be Doctor or Surgeon
        const targetTitle = emp_title?.toLowerCase();
        const isAssignable = targetTitle === "doctor" || targetTitle === "surgeon";

        if (!isAssignable) {
            return res.status(422).json({
                success: false,
                message: `Employee is a "${emp_title}" — only Doctors and Surgeons can be assigned patients`
            });
        }

        // Fetch full employee data
        const employeeData = await HospitalUsersMethods.MapUserToGETFullDataFunction(staff_id, emp_title);
console.log("employeeData",employeeData)
        if (!employeeData) {
            return res.status(404).json({ success: false, message: "No Users Found!" });
        }

        return res.status(200).json({ success: true, body: employeeData, message: "Successfully Fetched Data" });

    } catch (err) {
        console.error("Error GET Employee by Email", err);
        res.status(500).json({
            success: false,
            message: err.message || "Error GET Employee by Email"
        });
    }
});


router.get("/employee/:id",jwtVerify,async (req,res)=>{
    try{
        const {  id : user_id } = req.params;

        //Bad Request if modifier id or others doesn't exist
        if( !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);
        
        if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

        const employeeTitle = await User.getUserTitleByID(user_id);

        if(!employeeTitle || !HospitalUsersMethods.isHospitalUser(employeeTitle)){
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

        // Ceck if list page can be accessible
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);
        
        if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

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
        const {user_email, user_phone,modifier_id} = req.query;

        //Bad Request if both do not exist
        if( !user_email &&  !user_phone  ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);
        
        if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });


        const filter_email = JoinFiltering(Object.entries({user_email}),"u");
        const filter_phone = JoinFiltering(Object.entries({patient_phone: user_phone}),"p");
        // joins them with "AND" if both exists
        const filter_fields = [filter_email, filter_phone].filter(Boolean).join(" AND ");
        const patientData = await PatientMethods.getOnePatientDataByFilters(filter_fields);

      if( patientData ){
        res.status(200).json({success : true , body:patientData, message:"Successfully Fetched Data"})
      }
      else{
        res.status(404).json({success : false , message:"No Patient Found, please register!"})
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

        if (!record) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

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

        const records = await PatientFile.find({ user_id: patientId });

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
router.patch("/self",jwtVerify, async (req, res) => {
    try {
        const { user_id, ...newUserDetails } = req.body;
        

        // all these fields required to delete & send email
        if(!user_id  ) return res.status(400).json({success:false,message:"Bad Request"});

        const userExists = await User.checkIfUserExistsById(user_id);

        if(!userExists){
            return res.status(404).json({ success: false, message: "User Not Found" });
        }


        // prevent updating other fields like salary etc.
        const safeUserDetails = pickAllowedFields(newUserDetails, SELF_UPDATE_FIELDS);

        
        if(safeUserDetails.user_email){
            const emailExists = await User.checkIfUserExistsByEmail(safeUserDetails.user_email);
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
        delete safeUserDetails[key];
        });


        // build the updating string for query
        const updatingObj = buildJoinedUpdate(safeUserDetails);

            
            const isUpdated =  await HospitalUsersMethods.MapUserToFullUpdateFunction(user_id, userTitle, updatingObj);
                //===7. Add Audit Log
            await AuditLogs.addLog(
                user_id,
                `Updated Self User Data`,
                isUpdated ? "Successful Update My User Data" : "Failed Update My User Data",
                isUpdated ? "info" : "failure"
            )

        if(isUpdated){
            return res.status(200).json({ success: true, message: "User Updated Successfully" });
        }
        else{
            return res.status(409).json({ success: false, message: "Failed to update user data" });
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
