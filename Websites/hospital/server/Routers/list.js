const router = require("express").Router();
const NodeCache = require("node-cache");
const jwtVerify = require("../middlewares/jwtVerify.js");
const User = require("../Classes/User.js");
const consoleLog = require("../Utils/consoleLog.js");
const mailer = require("../Utils/mailer.js")
const  ModifyOtherUserData  = require("../Utils/ControlUsers/ModifyOtherUserData.js");
const  ModifyOtherUserRole  = require("../Utils/ControlUsers/ModifyOtherUserRole.js");  
const  ModifyOtherUserPerms = require("../Utils/ControlUsers/ModifyOtherUserPerms.js");
const HospitalUsersMethods = require("../Classes/HospitalUsersMethods.js");
const deletePatient = require("../Utils/ControlUsers/deletePatient.js");
const RemoveFixedFields = require("../Utils/RemoveFixedFields.js");
const Tables = require("../Tables/data.js");
const DoctorMethods = require("../Utils/methods/DoctorMethods.js");
const PatientMethods = require("../Utils/methods/PatientMethods.js");
const fetchImagesForListedUsers = require("../Utils/fetchImagesForListedUsers");
const stringifyFields = require("../Utils/stringifyFields.js");
const JoinFiltering = require("../Utils/JoinFiltering.js")
const myCache = new NodeCache({ stdTTL: 3600 }); // default TTL 1hr

// =================================
//  Get All doctors Data and Images (for Admins or SuperAdmins)
// =================================
router.get("/list-doctors",async (req,res)=>{
    try{
        const { pagination, size , user_id, ...restFilters } = req.query;
        
        const filtering_for_query = JoinFiltering(Object.entries(restFilters),"d")

        const doctors = await PatientMethods.getListedDoctorDataForPaitent(filtering_for_query , parseInt(size) , parseInt((pagination - 1) * size ));
        const doctorsRespone = await fetchImagesForListedUsers(doctors);
        console.log("with images", doctorsRespone)
        if(doctorsRespone && doctorsRespone.length > 0 ){
            res.status(200).json({
                success:true,
                doctors:doctorsRespone,
                 message:"Fetching Doctors List Was Successful"
                })
        }
        else{
            res.status(404).json({
                success:false,
                 message:"Doctors List Wasn't Found"
                })
        }

    }
    catch(err){
        console.error("Error List Doctors Profile Data and Images",err);
        res.status(500).json({
            success:false,
            message:"Error List Doctors Data and Images"
        })
    }
})

// =================================
//  Get All surgeons Data and Images (for Admins or SuperAdmins)
// =================================
router.get("/list-surgeons",async (req,res)=>{
    try{
        const { pagination, size , user_id, ...restFilters } = req.query;
        
        const filtering_for_query = JoinFiltering(Object.entries(restFilters),"s")
        const surgeons = await PatientMethods.getListedSurgeonDataForPaitent(filtering_for_query , parseInt(size) , parseInt((pagination - 1) * size ));
        const surgeonsRespone = await fetchImagesForListedUsers(surgeons)

        if(surgeonsRespone && surgeonsRespone.length > 0 ){
            res.status(200).json({
                success:true,
                surgeons:surgeonsRespone,
                 message:"Fetching Surgeons List Was Successful"
                })
        }
        else{
            res.status(404).json({
                success:false,
                 message:"Surgeons List Wasn't Found"
                })
        }
    }
    catch(err){
        console.error("Error List surgeons Data and Images",err);
        res.status(500).json({
            success:false,
            message:"Error List surgeons Data and Images"
        })
    }
})
// =================================
//  Get All Patients Data (for Admins or SuperAdmins)
// =================================
router.get("/patients",async (req,res)=>{
    try{
        const { pagination, size , ...restFilters } = req.query;
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size  ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const allpatients = await PatientMethods.getAllPatientsCOUNT();




        // Cache total number of all patients
        let totalNumOfPatients = 0;

        if (myCache.has("totalNumOfPatients")) {
            totalNumOfPatients = myCache.get("totalNumOfPatients");
        } else {
            totalNumOfPatients = allpatients.count; 
            myCache.set("totalNumOfPatients", totalNumOfPatients);
        }


        const numOfPages = Math.ceil(totalNumOfPatients / size);



      const my_rangedpatients = await PatientMethods.getAllPatientsRangedData(parseInt(size),parseInt((pagination - 1) * size ));

      if( my_rangedpatients && my_rangedpatients.length > 0){
        res.status(200).json({success : true , body:my_rangedpatients, message:"Successfully Fetched Data",numOfPages: numOfPages})
      }
      else{
        res.status(404).json({success : false , message:"No Users Found !"})
      }
    
        
        
    }
    catch(err){
        console.error("Error List All Patient Data",err);
        res.status(500).json({
            success:false,
            message:"Error List All Patient Data"
        })
    }
})

// =================================
//  Get My Patients Data (for Doctors)
// =================================
router.get("/my-patients",async (req,res)=>{
    try{
        const { pagination, size , user_id, ...restFilters } = req.query;
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const my_allpatients = await DoctorMethods.getDoctorAllPatientsCOUNT(user_id);



        // Cache total number of employees
        let totalNumOfMyPatients = 0;

        if (myCache.has("totalNumOfMyPatients")) {
            totalNumOfMyPatients = myCache.get("totalNumOfMyPatients");
        } else {
            totalNumOfMyPatients = my_allpatients.count; 
            myCache.set("totalNumOfMyPatients", totalNumOfMyPatients);
        }


        const numOfPages = Math.ceil(totalNumOfMyPatients / size);



      const my_rangedpatients = await DoctorMethods.getDoctorRangedPatients(user_id,parseInt(size),parseInt((pagination - 1) * size ));

      if( my_rangedpatients && my_rangedpatients.length > 0){
        res.status(200).json({success : true , body:my_rangedpatients, message:"Successfully Fetched Data",numOfPages: numOfPages})
      }
      else{
        res.status(404).json({success : false , message:"No Users Found !"})
      }
    
        
        
    }
    catch(err){
        console.error("Error List Your Patient Data",err);
        res.status(500).json({
            success:false,
            message:"Error List Your Patient Data"
        })
    }
})

// =============================================================================================================================
//  Update Other Users Specific Data (Data that is not at employees tables like roles, perms, nurse data, doctor data ...etc)
// =============================================================================================================================
    router.put("/update-other/employee" ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id ,modifier_email,   other_user_email , other_user_new_role ,  other_user_new_perms ,   ...newEmployeeData} = req.body;
                    let {perms_requested,targeted_data} = req.query;
                    const permsRequestedSet= new Set(perms_requested.split("-"));
                    targeted_data = targeted_data.split("-");
                    const targetedDataSet = new Set(targeted_data)
                    let failing_messages = [];

                // ===2. Remove employees table fields
                newEmployeeData = RemoveFixedFields(newEmployeeData,Tables.employees);

                // ===3. Check Bad Request
                if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email) 
                    return res.status(400).json({success:false,messages:[{success:false,message:"Bad Request"}]});
                
                // ===4. Check User is an Employee Not Patient
                const modifierTitle = await User.getUserTitle(modifier_email );
                const other_user_idANDtable = await User.getUserIDAndTable(other_user_email);
                const other_user_id = other_user_idANDtable.user_id
                const other_user_title = await User.getUserTitle(other_user_email);
                if(modifierTitle === "Patient")  return res.status(401).json({success:false,messages:[{success:false,message:"You Are A Patient Not An Employee"}]});
                if(other_user_title === "Patient" || other_user_idANDtable.table === "patient")  return res.status(401).json({success:false,messages:[{success:false,message:"That User Is A Patient Not An Employee"}]});


                    // ===5. Get Required Roles and Permissions for execution

                    // then modifier is different user 
                    const modifierRole = await User.getUserRole(modifier_id);
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);
                    const other_user_Role = await User.getUserRole(other_user_id );
                    
                    //===6. Check if modifier have perm to update other users data & action is requested
                    if(permsRequestedSet.has("Modify Employee Data")){
                        if(modifierSetperms.has("Modify Employee Data")){
                            await ModifyOtherUserData(other_user_id, other_user_Role,other_user_title, modifierRole, newEmployeeData, other_user_email ,targeted_data,failing_messages)
                        }
                        else{ 
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Data"})
                        }
                    }
                    
                    //===7. Check if modifier have perm to update other users role & action is requested
                    if(permsRequestedSet.has("Modify Employee Role")){
                        if (modifierSetperms.has("Modify Employee Role")){

                            await ModifyOtherUserRole(modifierRole, other_user_id, other_user_Role, other_user_new_role, other_user_email,failing_messages)
                        }
                        else{
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Role"})
                        }
                    }
                    //===8. Check if modifier have perm to update other users perms & action is requested
                    if(permsRequestedSet.has("Modify Employee Perms")){
                        if (modifierSetperms.has("Modify Employee Perms")){
                            const oldUserpermsSet = await User.getSetUserperms(other_user_id)

                            
                            await ModifyOtherUserPerms(other_user_id, other_user_Role, modifierRole, other_user_new_perms,oldUserpermsSet,failing_messages)
                        }
                        else{
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Permissions"})
                        }
                    }

                    
                    //===9. Get Updated User Data
                    const UpdateUser = await HospitalUsersMethods.MapUserToGETFunction(other_user_id,other_user_title);

                    //===10. Send any failing messages or success
                    if(failing_messages.length > 0){
                        // 401 for unauthorized modifications
                        return res.status(401).json({ success:false,body:UpdateUser[0], messages : failing_messages})
                    }
                    else{
                        return res.status(200).json({ success:true,body:UpdateUser[0], messages : [{success:true ,message:"Successful Updating User"}]})
                    }
        }
        catch (err) {
            consoleLog(`Error In Update Others Api Path  `, "error")
            console.log(err)
            res.status(500).json({
                success:false,
                message:"Error In Update Others Api Path "
            })
        }
    })

    router.put("/update-other/patient" ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id , modifier_email,  other_user_email  ,   ...newPatientData} = req.body;
                    let {perms_requested,targeted_data} = req.query;
                    const permsRequestedSet= new Set(perms_requested.split("-"));
                    targeted_data = targeted_data.split("-");
                    let failing_messages = [];
                    
                    // ===2. Check Bad Request
                    if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email ) 
                        return res.status(400 ).json({success:false,message:"Bad Request"});
                
                
                    // ===3. Check User is Patient
                    const modifierTitle = await User.getUserTitle(modifier_email );
                    const other_user_idANDTABLE = await User.getUserIDAndTable(other_user_email);
                    const other_user_id = other_user_idANDTABLE.user_id
                    const other_user_title = await User.getUserTitle(other_user_email );

                    // Check if modifier is employee | Check if other user is patient
                    if(modifierTitle === "Patient")  return res.status(401).json({success:false,messages:[{success:false,message:"You Are A Patient Not An Employee"}]});
                    if(other_user_title !== "Patient" )  return res.status(401).json({success:false,messages:[{success:false,message:"That User Is Not A Patient"}]});

                    // Make sure to remove these fields so they are not getting updated
                    newPatientData = RemoveFixedFields(newPatientData,[...Tables.rooms,"room_number","floor_number","patient_email","patient_password"])

                    // ===4. Get Required Roles and Permissions for execution
                    const modifierRole = await User.getUserRole(modifier_id);
                    const other_user_Role = await User.getUserRole(other_user_id ); // Default gonna get NormalUser since he is a patient
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);

                    // Check that user can modify patients that do not belong to him
                    if(!modifierSetperms.has("Modify Other Patient")) return res.status(401).json({success:false,messages:[{success:false ,message:"Modify Other Patient Permission Is Required For This Action"}]});
                    // remove all related to room fields, if modifier wants to update it he has to visit room's page

                    
                    //===5. Check if modifier have perm to update other users data & action is requested
                    if(permsRequestedSet.has("Modify Patient Data")){
                        if(modifierSetperms.has("Modify Patient Data")){
                            await ModifyOtherUserData(other_user_id, other_user_Role,other_user_title, modifierRole, newPatientData, other_user_email,targeted_data,failing_messages)
                        }
                        else{ 
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Data"})
                        }
                    }
                    
                    //===6. Check if modifier have perm to update other users files & action is requested
                    if(permsRequestedSet.has("Modify Patient Files")){
                        if(modifierSetperms.has("Modify Patient Files")){

                            await ModifyOtherUserFiles()
                        }
                        else{ 
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Files"})
                        }
                    }

                    //===7. Execute Update
                    const UpdateUser = await HospitalUsersMethods.MapUserToGETFunction(other_user_id,other_user_title);

                    //===8. Send any failing messages or success
                    if(failing_messages.length > 0){
                        // 401 for unauthorized modifications
                        return res.status(401).json({ success:false,body:UpdateUser[0], messages : failing_messages})
                    }
                    else{
                        return res.status(200).json({ success:true,body:UpdateUser[0], messages : [{success:true ,message:"Successful Updating User"}]})
                    }
        }
        catch (err) {
            consoleLog(`Error In Update Others Api Path  `, "error")
            console.log(err)
            res.status(500).json({
                success:false,
                message:"Error In Update Others Api Path "
            })
        }
    })

    router.put("/update-other/mypatient" ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id , modifier_email,  other_user_email  ,   ...newPatientData} = req.body;
                    let {perms_requested,targeted_data} = req.query;
                    const permsRequestedSet= new Set(perms_requested.split("-"));
                    targeted_data = targeted_data.split("-");
                    let failing_messages = [];
                    
                // ===2.Check Bad Request
                if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email ) 
                    return res.status(400).json({success:false,messages:[{success:false,message:"Bad Request"}]});
                
                    // ===3. Check User is Patient
                    const modifierTitle = await User.getUserTitle(modifier_email );
                    const other_user_idANDTABLE = await User.getUserIDAndTable(other_user_email);
                    const other_user_id = other_user_idANDTABLE.user_id
                    const other_user_title = await User.getUserTitle(other_user_email );

                    // Check if modifier has this patient
                    const belongsToModifier = await HospitalUsersMethods.MapUserToIsMyPatientFunction(modifier_id,modifierTitle,other_user_id);
                    console.log("belongsToModifier",belongsToModifier)
                    if(!belongsToModifier) return res.status(401).json({success:false,messages:[{success:false,message:"This Isn't Your Patient"}]});
                    // Check if modifier is employee | Check if other user is patient
                    if(modifierTitle === "Patient")  return res.status(401).json({success:false,messages:[{success:false,message:"You Are A Patient Not An Employee"}]});
                    if(other_user_title !== "Patient" )  return res.status(401).json({success:false,messages:[{success:false,message:"That User Is Not A Patient"}]});

                    // Make sure to remove these fields so they are not getting updated
                    newPatientData = RemoveFixedFields(newPatientData,[...Tables.rooms,"room_number","floor_number","patient_email","patient_password"])

                    // ===4. Get Required Roles and Permissions for execution
                    const modifierRole = await User.getUserRole(modifier_id);
                    const other_user_Role = await User.getUserRole(other_user_id ); // Default gonna get NormalUser since he is a patient
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);

                    
                    //===5. Check if modifier have perm to update other users data & action is requested
                    if(permsRequestedSet.has("Modify Patient Data")){
                        if(modifierSetperms.has("Modify Patient Data")){
                            await ModifyOtherUserData(other_user_id, other_user_Role,other_user_title, modifierRole, newPatientData, other_user_email,targeted_data,failing_messages)
                        }
                        else{ 
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Data"})
                        }
                    }
                    
                    //===6. Check if modifier have perm to update other users files & action is requested
                    if(permsRequestedSet.has("Modify Patient Files")){
                        if(modifierSetperms.has("Modify Patient Files")){

                            await ModifyOtherUserFiles()
                        }
                        else{ 
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Files"})
                        }
                    }

                    //===7. Execute Update
                    const UpdateUser = await HospitalUsersMethods.MapUserToGETFunction(other_user_id,other_user_title);

                    //===8. Send any failing messages or success
                    if(failing_messages.length > 0){
                        // 401 for unauthorized modifications
                        return res.status(401).json({ success:false,body:UpdateUser[0], messages : failing_messages})
                    }
                    else{
                        return res.status(200).json({ success:true,body:UpdateUser[0], messages : [{success:true ,message:"Successful Updating User"}]})
                    }
        }
        catch (err) {
            consoleLog(`Error In Update Others Api Path  `, "error")
            console.log(err)
            res.status(500).json({
                success:false,
                message:"Error In Update Others Api Path "
            })
        }
    })



// =================================
//  Delete Patient (by Admin or SuperAdmin)
// =================================
router.delete("/delete-patient", jwtVerify, async (req, res) => {
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
                isFulfilled =await deletePatient(ModifierRole, otherUserRole,patient_id)
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
            message: "Error Delete Patient Data"
        });
    }
});








module.exports = router;


