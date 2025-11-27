/*******************************************************************
    Lists data from MySQL Database using methods from classes
*********************************************************************/
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
// FIX: Define myCache properly
const cacheCountNodeCache = require("../Utils/cacheCountNodeCache.js")
const SurgeonMethods = require("../Utils/methods/SurgeonMethods.js");




// ==================================================================

//              Get Routes

// ==================================================================

// =================================
//  Get All employees Data
// =================================
router.get("/employees",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size , user_id,isFiltered, role_name: filter_role_name, emp_perms: filter_emp_perm, ...restFilters } = req.query;
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const Modifier_role = await User.getUserRole(user_id);
        const Modifier_perms = await User.getSetUserperms(user_id);
        const filtering_for_query = restFilters? JoinFiltering(Object.entries(restFilters),"d") :null;
        const whereClause = filtering_for_query ?  `WHERE ${filtering_for_query}` : "";

        if (Modifier_role === "NormalUser") return res.status(401).json({ success: false, message: "NormalUser Role cannot access The list" });


        // get cached count 
        const EmployeesCount = await cacheCountNodeCache("totalNumOfEmployees",HospitalUsersMethods.getAllHospitalEmployeesCOUNT,whereClause)
        const numOfPages = Math.max(1, Math.ceil( EmployeesCount / size));

        const users = await HospitalUsersMethods.getAllHospitalEmployeesFullData(parseInt(size), parseInt((pagination - 1) * size ),restFilters, filter_role_name, filter_emp_perm);
        console.log("EmployeesCount",EmployeesCount)

      if( users && users.length > 0){
        res.status(200).json({success : true , body:users, message:"Successfully Fetched Data",numOfPages: numOfPages})
      }
      else{
        res.status(404).json({success : false , message:"No Users Found !"})
      }
    
        
        
    }
    catch(err){
        console.error("Error List Employees Profile Data",err);
        res.status(500).json({
            success:false,
            message:"Error List Employees Data"
        })
    }
})

// =================================
//  Get All doctors Data and Images (for Admins or SuperAdmins)
// =================================
router.get("/doctors",async (req,res)=>{
    try{
        const { pagination, size,isFiltered , user_id, ...restFilters } = req.query;
        
        const filtering_for_query = restFilters? JoinFiltering(Object.entries(restFilters),"d") : null;
        const whereClause = filtering_for_query ?  `WHERE ${filtering_for_query}` : "";
        const doctors = await PatientMethods.getListedDoctorDataForPaitent(  parseInt(size) , parseInt((pagination - 1) * size ),filtering_for_query);
        const doctorsRespone = await fetchImagesForListedUsers(doctors);

        // =====================================
        // Cache Count on Server Side - ONLY for non-filtered queries
        // =====================================

        const doctorsCount = await cacheCountNodeCache("totalNumOfDoctors",DoctorMethods.getAllDoctorsCOUNT,whereClause)
        const numOfPages = Math.max(1,Math.ceil(doctorsCount / size));

        // =====================================
        // Send Response
        // =====================================
        if(doctorsRespone && doctorsRespone.length > 0 ){
            res.status(200).json({
                success:true,
                body:doctorsRespone,
                numOfPages:numOfPages ,
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
            message: err.message || "Error List Doctors Data and Images"
        })
    }
})

// =================================
//  Get All surgeons Data and Images (for Admins or SuperAdmins)
// =================================
router.get("/surgeons",async (req,res)=>{
    try{
        const { pagination, size , isFiltered , user_id, ...restFilters } = req.query;
        
        
        const surgeons = await PatientMethods.getListedSurgeonDataForPaitent(filtering_for_query , parseInt(size) , parseInt((pagination - 1) * size ));
        const filtering_for_query = restFilters? JoinFiltering(Object.entries(restFilters),"s") : null;
        const whereClause = filtering_for_query ?  `WHERE ${filtering_for_query}` : "";
        const surgeonsRespone = await fetchImagesForListedUsers(surgeons);

        // =====================================
        // Cache Count on Server Side - ONLY for non-filtered queries
        // =====================================
        const doctorsCount = await cacheCountNodeCache("totalNumOfSurgeons",SurgeonMethods.getAllSurgeonsCOUNT,whereClause,isFiltered)
        const numOfPages = Math.max(1,Math.ceil(doctorsCount / size));
        

        
        

        // =====================================
        // Send Response 
        // =====================================
        if(surgeonsRespone && surgeonsRespone.length > 0 ){
            res.status(200).json({
                success:true,
                body:surgeonsRespone,
                numOfPages,
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
            message: err.message || "Error List surgeons Data and Images"
        })
    }
})
// =================================
//  Get All Patients Data (for Admins or SuperAdmins)
// =================================
router.get("/patients",async (req,res)=>{
    try{
        const { pagination, size,isFiltered , user_id, ...restFilters } = req.query;
        console.log("/patients")
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size  ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const filtering_for_query = restFilters? JoinFiltering(Object.entries(restFilters)) :null;
        const whereClause = filtering_for_query ?  `WHERE ${filtering_for_query}` : "";


        // =====================================
        // Cache Count on Server Side - ONLY for non-filtered queries
        // =====================================
        const patientsCount = await cacheCountNodeCache("totalNumOfPatients",PatientMethods.getAllPatientsCOUNT,whereClause,isFiltered)
        const numOfPages = Math.max(1,Math.ceil(patientsCount / size));
        



        console.log("Patients Reest CONDITIONS",filtering_for_query)
        const my_rangedpatients = await PatientMethods.getAllPatientsSpecificData(parseInt(size),parseInt((pagination - 1) * size ),filtering_for_query);
        // =====================================
        // Send Response
        // =====================================
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
            message: err.message || "Error List All Patient Data"
        })
    }
})

// =================================
//  Get My Patients Data (for Doctors)
// =================================
router.get("/my-patients",async (req,res)=>{
    try{
        const { pagination, size,isFiltered , user_id, ...restFilters } = req.query;
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const filtering_for_query = restFilters? JoinFiltering(Object.entries(restFilters),"p") :null; 
        const whereClause = filtering_for_query ?  `WHERE ${filtering_for_query}` : ""; 

        // =====================================
        // Cache Count on Server Side - ONLY for non-filtered queries
        // =====================================
        
        const patientsCount = await cacheCountNodeCache("totalNumOfMyPatients",DoctorMethods.getDoctorAllPatientsCOUNT,whereClause,isFiltered)
        const numOfPages = Math.max(1,Math.ceil(patientsCount / size));



      const my_rangedpatients = await DoctorMethods.getDoctorRangedPatients(user_id,parseInt(size),parseInt((pagination - 1) * size ));

        // =====================================
        // Send Response
        // =====================================

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
            message: err.message || "Error List Your Patient Data"
        })
    }
})



// ==================================================================

//              Update Routes

// ==================================================================

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
                    const UpdateUser = await HospitalUsersMethods.MapUserToGETSpecificDataFunction(other_user_id,other_user_title);

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
                message: err.message || "Error In Update Others Api Path "
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
                    const UpdateUser = await HospitalUsersMethods.MapUserToGETSpecificDataFunction(other_user_id,other_user_title);

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
                message: err.message || "Error In Update Others Api Path "
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
                    const UpdateUser = await HospitalUsersMethods.MapUserToGETSpecificDataFunction(other_user_id,other_user_title);

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
                message: err.message || "Error In Update Others Api Path "
            })
        }
    })

// ==================================================================

//              Delete Routes

// ==================================================================








module.exports = router;


