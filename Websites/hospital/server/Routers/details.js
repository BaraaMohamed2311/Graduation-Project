/*******************************************************************
    Gets detailed data from MySQL and MongoDB Databases 
*********************************************************************/
const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const PatientMethods = require("../Utils/methods/PatientMethods.js");
const deletePatient = require("../Utils/ControlUsers/deletePatient.js");
const JoinFiltering = require("../Utils/JoinFiltering.js");
const PatientFile = require("../Models/Patient_file.js");
const PatientHealthState = require("../Models/Patient_health_state.js");
const User = require("../Classes/User.js");
const HospitalUsersMethods = require("../Classes/HospitalUsersMethods.js");

// =================================
//  Images routes are at files.js
// =================================

// ****************************************

// =================================
//  Get One Patient Data MySQL
// =================================
router.get("/employee/:id",async (req,res)=>{
    try{
        const {  id : user_id } = req.params;

        //Bad Request if modifier id or others doesn't exist
        if( !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

        const employeeTitle = await User.getUserTitle(user_id);

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
router.get("/patient/:id",async (req,res)=>{
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
//  Get Patient Data  MongoDB
// =================================
router.get("/patient-health-state/:patientId",async (req,res)=>{
    try{
        const {patientId} = req.params

        const record = await PatientHealthState.findOne({ patient_id: patientId });

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

router.get("/patient-files/:patientId",async (req,res)=>{
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
//  Delete Patient 
// =================================
router.delete("/delete-patient", async (req, res) => {
    try {
        const { modifier_email, modifier_id, modifier_name, patient_email, patient_name } = req.body;
        

        // all these fields required to delete & send email
        if(!modifier_email || !modifier_id || !patient_email || !emp_email  ) return res.status(400).json({success:false,message:"Bad Request"});
        
        
        let ModifierpermsSet = await User.getSetUserperms(modifier_id);
        let isFulfilled = false;
        // ===1. Check if modifier have perm to delete users
        if (ModifierpermsSet.isPermExist("Delete Patient")) {

            // ===2. Get Modifier Role & Other User ID
            const ModifierRole = await User.getUserRole(modifier_id);
            const otherUserGET_ID = await User.getUserIDAndTable(patient_email);
            
            // ===3. Check that other user is not self & is a patient
            if(otherUserGET_ID.user_id === null || otherUserGET_ID.table !== "patients" ) return res.status(404).json({success:false,message:"Patient Not Found"});
            else if(otherUserGET_ID.user_id === modifier_id) return res.status(400).json({success:false,message:"You Cannot Delete Yourself"});


            // ===4. Execute Deletion 
            if(otherUserGET_ID.user_id && otherUserGET_ID.table === "patients") {
                isFulfilled =await deletePatient(ModifierRole, otherUserRole,patient_id);
                
            }

        }
        else{
            return res.json({success:false , message:"Not Allowed To Delete Patients"})
        }
        
        // ===5. Send Email
        if (isFulfilled) {
            const isSent = await mailer(modifier_email, emp_email, "You Got Deleted", `
                Dear ${patient_name},

                Your hospital patient's account was deleted ${new Date()}.
                If you believe this was a mistake or have any questions, please contact us.

                Sincerely,
                ${modifier_name}
            `);

            if (isSent)
                return res.json({ success: true, message: "Patient Deleted & Email Sent" });
            else
                return res.status(500).json({ success: false, message: "Patient Deleted But Email Not Sent" });

        } else {
            return res.status(500).json({ success: false, message: "Patient Wasn't Deleted" });
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
