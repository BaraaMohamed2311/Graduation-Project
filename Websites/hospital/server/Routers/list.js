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
const HospitalUsersMethods = require("../Classes/HospitalUsers/HospitalUsersMethods.js");
const RemoveFixedFields = require("../Utils/RemoveFixedFields.js");
const {Tables , setOfPerms} = require("../Tables/data.js");
const DoctorMethods = require("../Utils/methods/DoctorMethods.js");
const PatientMethods = require("../Utils/methods/PatientMethods.js");
const fetchImagesForListedUsers = require("../Utils/fetchImagesForListedUsers");
const stringifyFields = require("../Utils/stringifyFields.js");
const JoinFiltering = require("../Utils/JoinFiltering.js")
// FIX: Define myCache properly
const cacheCountNodeCache = require("../Utils/cacheCountNodeCache.js")
const SurgeonMethods = require("../Utils/methods/SurgeonMethods.js");
const buildJoinedFilters = require("../Utils/buildJoinedFilters.js")
const padBoth = require("../Utils/padBoth.js")
const createOrderByClause = require("../Utils/createOrderByClause.js");
const perms = require("../Classes/Perms/perms.js");
const buildJoinedUpdate = require("../Utils/buildJoinedUpdate.js");
const Patient_health_status = require("../Models/Patient_health_status.js");
const AvailabilityMethods = require("../Utils/methods/AvailabilityMethods.js");
const AuditLogs = require("../Utils/methods/AuditLogs.js");
const { excludeFields , EXCLUDE_UPDATE_FIELDS} = require("../Tables/pick_exc_fields.js");
const extractUserFromToken = require("../Utils/extractUserFromToken.js")
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
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);
        
        if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

        // perms have there separate filtiring conditing using "HAVING" not "WHERE"
        // we use custom condition to handle NormalUser role because it's named NormalUser not Employee in roles table and also it can be null because normal users have no role record in roles table
        const role_filtering_string = filter_role_name === "NormalUser" ? "(hr.role_name IS NULL OR hr.role_name = 'NormalUser')" : filter_role_name
                                        ? `hr.role_name = '${filter_role_name}'` : null;

        const rest_filtering_string = Object.keys(restFilters || {}).length > 0 ? padBoth(buildJoinedFilters({ ...restFilters }), 1) : null;

        const filtering_string = [rest_filtering_string, role_filtering_string].filter(Boolean).join(" AND ");

        // get cached count 
        const EmployeesCount = await cacheCountNodeCache("totalNumOfEmployees",HospitalUsersMethods.getAllHospitalEmployeesCOUNT,filtering_string)
        const numOfPages = Math.max(1, Math.ceil( EmployeesCount / size));

        const users = await HospitalUsersMethods.getAllHospitalEmployeesFullData(parseInt(size), parseInt((pagination - 1) * size ),filtering_string,filter_emp_perm);


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
router.get("/doctors",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size,isFiltered , user_id, ...rest } = req.query;

        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});
        // Ceck if list page can be accessible
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);

        

        // Extract orderBy entries
            const orderBy = {};
            for (const [key, value] of Object.entries(rest)) {
            if (key.startsWith("orderBy_")) {
                const field = key.replace("orderBy_", "");
                orderBy[field] = value;
                delete rest[key];
            }
            }

        const restFilters = rest; // other normal filters

        const filtering_string = Object.keys(restFilters).length > 0 ? padBoth(buildJoinedFilters(restFilters),1) : "";
        const orderByClause = createOrderByClause(orderBy);
        const doctors = await PatientMethods.getListedDoctorDataForPaitent(  parseInt(size) , parseInt((pagination - 1) * size ),filtering_string, orderByClause);
        const doctorsRespone = await fetchImagesForListedUsers(doctors);

        // =====================================
        // Cache Count on Server Side - ONLY for non-filtered queries
        // =====================================

        const doctorsCount = await cacheCountNodeCache("totalNumOfDoctors",DoctorMethods.getAllDoctorsCOUNT,filtering_string)
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
router.get("/surgeons",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size , isFiltered , user_id, ...rest } = req.query;

        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});
        // Ceck if list page can be accessible
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);

        


        // Extract orderBy entries
            const orderBy = {};
            for (const [key, value] of Object.entries(rest)) {
            if (key.startsWith("orderBy_")) {
                const field = key.replace("orderBy_", "");
                orderBy[field] = value;
                delete rest[key];
            }
            }

        const restFilters = rest; // other normal filters
        
        
        
        const filtering_string = Object.keys(restFilters).length > 0 ? padBoth(buildJoinedFilters(restFilters),1) : null;
        const orderByClause = createOrderByClause(orderBy);
        const surgeons = await PatientMethods.getListedSurgeonDataForPaitent( parseInt(size) , parseInt((pagination - 1) * size ),filtering_string,orderByClause);
        const whereClause = filtering_string ?  padBoth(`WHERE ${filtering_string}`,1) : "";
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
router.get("/patients",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size,isFiltered , user_id, ...restFilters } = req.query;

        //Bad Request if modifier id or others doesn't exist

        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});
        // Ceck if list page can be accessible
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);

        if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

        // Ceck if list page can be accessible
        const filtering_string = Object.keys(restFilters).length > 0 ? padBoth(buildJoinedFilters(restFilters),1) :null;
        const whereClause = filtering_string ?  padBoth(`WHERE ${filtering_string}`,1) : "";


        // =====================================
        // Cache Count on Server Side - ONLY for non-filtered queries
        // =====================================
        const patientsCount = await cacheCountNodeCache("totalNumOfPatients",PatientMethods.getAllPatientsCOUNT,whereClause,isFiltered)
        const numOfPages = Math.max(1,Math.ceil(patientsCount / size));
        


        const my_rangedpatients = await PatientMethods.getAllPatientsSpecificData(parseInt(size),parseInt((pagination - 1) * size ),filtering_string);
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
router.get("/my-patients",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size,isFiltered , user_id, ...restFilters } = req.query;
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});
        // Ceck if list page can be accessible
        const tokenFields = extractUserFromToken(req);
        const Modifier_role = await User.getUserRole(tokenFields.user_id);

        if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

        // Ceck if list page can be accessible
        const filtering_string = Object.keys(restFilters).length > 0 ? padBoth(buildJoinedFilters(restFilters),1) :null; 
        
        const whereClause = filtering_string ?  padBoth(`WHERE ${filtering_string}`,1) : ""; 

        // =====================================
        // Cache Count on Server Side - ONLY for non-filtered queries
        // =====================================
        
        const patientsCount = await cacheCountNodeCache("totalNumOfMyPatients",DoctorMethods.getDoctorAllPatientsCOUNT,whereClause,isFiltered)
        const numOfPages = Math.max(1,Math.ceil(patientsCount / size));


    
      const my_rangedpatients = await DoctorMethods.getDoctorRangedPatients(user_id,parseInt(size),parseInt((pagination - 1) * size ),filtering_string);

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
    router.put("/other/employee",jwtVerify ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id ,modifier_email,   other_user_email , other_user_new_role ,  other_user_new_perms ,   ...newEmployeeData} = req.body;
                    let {perms_requested} = req.query;
                    const permsRequestedSet= perms_requested ? new Set(perms_requested.split("-")) : null;

                    let failing_messages = [];


        

                // ===3. Check Bad Request
                if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email) 
                    return res.status(400).json({success:false,messages:[{success:false,message:"Bad Request"}]});

                // Ceck if list page can be accessible
                const Modifier_role = await User.getUserRole(modifier_id);

                if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });
                
                // ===4. Check Neither Modifer or Other user are patients

                const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
                const OtherUserType = await User.getUserTypeByEmail(other_user_email);

                if(ModifierUserType === 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"You Are A Patient Not An Employee"}]});
                if(OtherUserType === 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"That User Is A Patient Not An Employee"}]});
                // Get fresh title and id from db
                const other_user_id = await User.getUserIDByEmail(other_user_email)
                const other_user_title = await User.getUserTitleByID(other_user_id);


                // Check that all requested perms are valid
                    const isValidPerms =  [...permsRequestedSet].every(x => setOfPerms.has(x));
                    if(!isValidPerms)
                    return res.status(403).json({success:false,message:"No valid permission requested "});

                    // ===5. Get Required Roles and Permissions for execution

                    // then modifier is different user 
                    const modifierRole = await User.getUserRole(modifier_id);
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);
                    const other_user_Role = await User.getUserRole(other_user_id );

                    // Exclude important fields
                    
                    const safeData = excludeFields(newEmployeeData, EXCLUDE_UPDATE_FIELDS);

                    
                    //===6. Check if modifier have perm to update other users data & action is requested
                    if(permsRequestedSet.has("Modify Employee Data")){
                        if(modifierSetperms.has("Modify Employee Data")){
                            await ModifyOtherUserData(other_user_id, other_user_Role,other_user_title, modifierRole, safeData, other_user_email ,failing_messages)
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
                            const newpermsSet = other_user_new_perms ? new Set(other_user_new_perms.split(", ")) : new Set()
                            
                            await ModifyOtherUserPerms(other_user_id, other_user_Role, modifierRole, newpermsSet,oldUserpermsSet,failing_messages)
                        }
                        else{
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Permissions"})
                        }
                    }

                    //===9. Add Audit Log
                    await AuditLogs.addLog(
                        "hospital",                                // <-- the site ID
                        modifier_id,                            // <-- who made the change
                        failing_messages.length > 0 
                            ? "Failed Update Employee Data" 
                            : "Successful Update Employee Data", // <-- method/action description
                        {                                     // <-- affects_who object
                            email: other_user_email,
                            status: failing_messages.length > 0 ? "failure" : "info"
                        }
                    );



                    //===10. Send any failing messages or success
                    if(failing_messages.length > 0){
                        return res.status(409).json({ success:false, messages : failing_messages})
                    }
                    else{
                        return res.status(200).json({ success:true, messages : [{success:true ,message:"Successful Updating User"}]})
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

    router.put("/other/employee/availability",jwtVerify ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id ,modifier_email,   other_user_email , newAvailabilityString} = req.body;
                    let {perms_requested} = req.query;
                    const permsRequestedSet= perms_requested ? new Set(perms_requested.split("-")) : null;

                    let failing_messages = [];



                // ===3. Check Bad Request
                if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email) 
                    return res.status(400).json({success:false,messages:[{success:false,message:"Bad Request"}]});

                // Ceck if list page can be accessible
                const Modifier_role = await User.getUserRole(modifier_id);

                if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });
                
                // ===4. Check Neither Modifer or Other user are patients

                const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
                const OtherUserType = await User.getUserTypeByEmail(other_user_email);

                if(ModifierUserType === 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"You Are A Patient Not An Employee"}]});
                if(OtherUserType === 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"That User Is A Patient Not An Employee"}]});
                // Get fresh title and id from db
                const other_user_id = await User.getUserIDByEmail(other_user_email)
                const other_user_title = await User.getUserTitleByID(other_user_id);

                
                
                // Check that all requested perms are valid
                    const isValidPerms =  [...permsRequestedSet].every(x => setOfPerms.has(x));
                    if(!isValidPerms)
                    return res.status(403).json({success:false,message:"No valid permission requested "});

                    // ===5. Get Required Roles and Permissions for execution

                    // then modifier is different user 
                    const modifierRole = await User.getUserRole(modifier_id);
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);
                    const other_user_Role = await User.getUserRole(other_user_id );


                    // Check Authorization using perms
                    const isAuthorized = modifierSetperms.has("Modify Availability") 

                    // Check that user can modify patients that do not belong to him
                    if(!isAuthorized) return res.status(403).json({success:false,message:"Permission Is Required For This Action"});
                    
                    //===6. Check if modifier have perm to update other users data & action is requested
                    let isUpdated = false;
                    if(permsRequestedSet.has("Modify Availability")){
                        if(modifierSetperms.has("Modify Availability")){
                            isUpdated = await AvailabilityMethods.updateAvailability(other_user_id, newAvailabilityString);
                        }
                    }
                    
                    //===9. Add Audit Log
                    AuditLogs.addLog(
                        'hospital',
                        modifier_id,
                        `Updated Employee ${other_user_email} Availability`,
                        isUpdated ? "Successful Update Employee Availability" : "Failed Update Employee Availability",
                        isUpdated ? "info" : "failure"
                    )
                
                    //===10. Send any failing messages or success
                    if(isUpdated){
                        return res.status(200).json({ success:true, message : "Successful Updating User"})
                    }
                    else{
                        return res.status(409).json({ success:false, message : "Failed To Update User Availability"})
                    }
        }
        catch (err) {
            consoleLog(`Error In Update Others Availability Api Path  `, "error")
            console.log(err)
            res.status(500).json({
                success:false,
                message: err.message || "Error In Update Others Api Path "
            })
        }
    })

    router.put("/other/patient",jwtVerify ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id , modifier_email,  other_user_email  ,   ...newPatientData} = req.body;
                    let {perms_requested} = req.query;
                    const permsRequestedSet= perms_requested ? new Set(perms_requested.split("-")) : null;

                    
                    // ===2. Check Bad Request
                    if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email ) 
                        return res.status(400).json({success:false,message:"Bad Request"});

                    // Ceck if list page can be accessible
                const Modifier_role = await User.getUserRole(modifier_id);

                if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

                    // Check that all requested perms are valid
                    const isValidPerms =  [...permsRequestedSet].every(x => setOfPerms.has(x));
                    if(!isValidPerms)
                    return res.status(403).json({success:false,message:"No valid permission requested "});


                    const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
                    const OtherUserType = await User.getUserTypeByEmail(other_user_email);

                    if(ModifierUserType === 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"You Are A Patient Not An Employee"}]});
                    if(OtherUserType !== 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"That User Is An Employee Not A Patient"}]});
                    // Get fresh title and id from db
                    const other_user_id = await User.getUserIDByEmail(other_user_email)
                    const other_user_title = await User.getUserTitleByID(other_user_id);
                
                

                    // ===4. Get Required Roles and Permissions for execution
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);

                    // Check Authorization using perms
                    const isAuthorized = modifierSetperms.has("Modify Other Patient") && modifierSetperms.has("Access Other Patients");

                    // Check that user can modify patients that do not belong to him
                    if(!isAuthorized) return res.status(403).json({success:false,messages:[{success:false ,message:"Permission Is Required For This Action"}]});


                    let isUpdated = false;
                    //===5. Check if modifier have perm to update other users data & action is requested
                    if(permsRequestedSet.has("Modify Other Patient")){
                            // build the updating string for query
                            const updatingObj = buildJoinedUpdate(newPatientData);

                            // Since patient is treated as NormalUser we execute perm directly 
                            isUpdated = await perms.executeChangeOtherUserData(other_user_id,other_user_title,updatingObj);
                            

                    }
                    
                    //===8. Add Audit Log
                    await AuditLogs.addLog(
                        "hospital",                              // site_id
                        modifier_id,                              // who made the change
                        isUpdated
                            ? "Successful Update Patient Data"
                            : "Failed Update Patient Data",       // method/action
                        {                                         // affects_who
                            email: other_user_email,
                            status: isUpdated ? "info" : "failure"
                        }
                    );

                    
                    //===9. Send any failing messages or success
                    if(!isUpdated){
                        return res.status(409).json({ success:false, messages : [{success:false ,message:"Failed To Update Patient"}]})
                    }
                    else{
                        return res.status(200).json({ success:true, messages : [{success:true ,message:"Successful Updating User"}]})
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

    router.put("/other/mypatient",jwtVerify ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id , modifier_email,  other_user_email  ,   ...newPatientData} = req.body;
                    let {perms_requested} = req.query;
                    const permsRequestedSet= new Set(perms_requested.split("-"));

                    
                // ===2.Check Bad Request
                if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email ) 
                    return res.status(400).json({success:false,messages:[{success:false,message:"Bad Request"}]});

                // Ceck if list page can be accessible
                const Modifier_role = await User.getUserRole(modifier_id);

                if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });


                //  ===3. Check that all requested perms are valid
                    const isValidPerms =  [...permsRequestedSet].every(x => setOfPerms.has(x));
                    if(!isValidPerms)
                    return res.status(403).json({success:false,message:"No valid permission requested "});

                //  ===4. Check valid user types
                    const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
                    const OtherUserType = await User.getUserTypeByEmail(other_user_email);

                    if(ModifierUserType === 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"You Are A Patient Not An Employee"}]});
                    if(OtherUserType !== 'patient')  return res.status(403).json({success:false,messages:[{success:false,message:"That User Is An Employee Not A Patient"}]});
                    // Get fresh title and id from db
                    const other_user_id = await User.getUserIDByEmail(other_user_email)
                    const other_user_title = await User.getUserTitleByID(other_user_id);
                
                    

                    //  ===5. Check patient belongs to staff
                    const belongsToModifier = await HospitalUsersMethods.patientBelongsToStaff(modifier_id,other_user_id);

                    if(!belongsToModifier) return res.status(403).json({success:false,messages:[{success:false,message:"This Isn't Your Patient"}]});



                    // ===4. Get Required Roles and Permissions for execution
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);

                    // Check Authorization using perms
                    const isAuthorized = modifierSetperms.has("Modify My Patient")

                    // Check that user can modify patients that do not belong to him
                    if(!isAuthorized) return res.status(403).json({success:false,messages:[{success:false ,message:"Permission Is Required For This Action"}]});

                    let isUpdated= false;
                    //===5. Check if modifier have perm to update other users data & action is requested
                    if(permsRequestedSet.has("Modify My Patient")){
                            // build the updating string for query
                            const updatingObj = buildJoinedUpdate(newPatientData);
                            // Since patient is treated as NormalUser we execute perm directly 
                            isUpdated = perms.executeChangeOtherUserData(other_user_id,other_user_title,updatingObj);
                            
                    }
                    
                    await AuditLogs.addLog(
                        "hospital",                                 // site_id
                        modifier_id,                                // who made the change
                        isUpdated
                            ? "Successful Update My Patient Data"
                            : "Failed Update My Patient Data",      // method/action
                        {                                           // affects_who
                            email: other_user_email,
                            status: isUpdated ? "info" : "failure"
                        }
                    );


                    //===8. Send any failing messages or success
                    if(!isUpdated){

                        return res.status(409).json({ success:false, messages : [{success:false ,message:"Failed To Update Your Patient"}]})
                    }
                    else{
                        return res.status(200).json({ success:true, messages : [{success:true ,message:"Successful Updating User"}]})
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

    // =========================================================================
    // Only at if your patient you can modify health status and patient files
    // =========================================================================

    router.put("/other/patient/health-status",jwtVerify ,async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id , modifier_email,  other_user_email  ,   ...newPatientData} = req.body;
                    let {perms_requested , my} = req.query;
                    const permsRequestedSet= new Set(perms_requested.split("-"));

                    
                // ===2.Check Bad Request
                if(!permsRequestedSet || !modifier_id || !other_user_email || !modifier_email ) 
                    return res.status(400).json({success:false,message:"Bad Request"});

                // Ceck if list page can be accessible
                const Modifier_role = await User.getUserRole(modifier_id);

                if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });


                //  ===3. Check that all requested perms are valid

                    const isValidPerms =  [...permsRequestedSet].every(x => setOfPerms.has(x));
                    if(!isValidPerms)
                    return res.status(403).json({success:false,message:"No valid permission requested "});

                //  ===4. Check valid user types
                    const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
                    const OtherUserType = await User.getUserTypeByEmail(other_user_email);

                    if(ModifierUserType === 'patient')  return res.status(403).json({success:false,message:"You Are A Patient Not An Employee"});
                    if(OtherUserType !== 'patient')  return res.status(403).json({success:false,message:"That User Is An Employee Not A Patient"});
                    // Get fresh title and id from db
                    const other_user_id = await User.getUserIDByEmail(other_user_email)


                    //  ===5. Check patient belongs to staff | default is true
                    const belongsToModifier = my ? await HospitalUsersMethods.patientBelongsToStaff(modifier_id,other_user_id) : true;

                    if(!belongsToModifier) return res.status(403).json({success:false,message:"This Isn't Your Patient"});




                    // ===4. Get Required Roles and Permissions for execution
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);

                    // Check Authorization using perms
                    const isAuthorized = modifierSetperms.has('Modify Health Status')

                    // Check that user can modify patients that do not belong to him
                    if(!isAuthorized) return res.status(403).json({success:false,messages:[{success:false ,message:"Permission Is Required For This Action"}]});
                    //===5. Check if modifier have perm to update other users data & action is requested

                    
                    const isUpdated =await Patient_health_status.findOneAndUpdate(
                                        { user_id: other_user_id },  // filter
                                        newPatientData,              // update object
                                        { new: true, upsert: true }  // return updated doc; create if not exists
                                        );
                    
                    //===6. Add Audit Log
                    await AuditLogs.addLog(
                        "hospital",                                 // site_id
                        modifier_id,                                // who made the change
                        isUpdated
                            ? "Successful Update Patient Health Status"
                            : "Failed Update Patient Health Status",      // method/action
                        {                                           // affects_who
                            email: other_user_email,
                            status: isUpdated ? "info" : "failure"
                        }
                    );

                    //===8. Send any failing messages or success
                    if(!isUpdated){
                        return res.status(409).json({ success:false, message : "Failed Updating User"})
                    }
                    else{
                        return res.status(200).json({ success:true, message:"Successful Updating User"})
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


// =================================
//  Delete Patient 
// =================================
router.delete("/other/patient",jwtVerify, async (req, res) => {
    try {
        const { modifier_email, modifier_id, modifier_name, other_user_email , other_user_name } = req.query;
        

        // all these fields required to delete & send email
        if(!modifier_email || !modifier_id || !other_user_email   ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const Modifier_role = await User.getUserRole(modifier_id);

        if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });
        
        
        let ModifierpermsSet = await User.getSetUserperms(modifier_id);
        if (!ModifierpermsSet.has("Delete Patient"))  return  res.json({success:false , message:"Permission is Required for this action"});
        
        let isFulfilled = false;
        // ===1. Check if modifier have perm to delete users


            // ===2. Get Modifier Role & Other User ID
            const ModifierRole = await User.getUserRole(modifier_id);
            const deleting_patient_id = await User.getUserIDByEmail(other_user_email);
            const userType = await User.getUserTypeByEmail(other_user_email);
            
            // ===3. Check that other user is not self & is a patient
            if(userType !== "patient" ) return res.status(404).json({success:false,message:"User is Not A Patient"});
            else if(deleting_patient_id === modifier_id) return res.status(400).json({success:false,message:"You Cannot Delete Yourself"});


            // ===4. Execute Deletion 
            if(deleting_patient_id) {
                isFulfilled =await PatientMethods.cascadeDeletePatientData(deleting_patient_id);
                
            }
            // ===5. Add Audit Log
            await AuditLogs.addLog(
                "hospital",                                 // site_id
                modifier_id,                                // who made the change
                isFulfilled
                    ? `Successful Delete Patient ${other_user_email}`
                    : `Failed Delete Patient ${other_user_email}`,      // method/action
                {                                           // affects_who
                    email: other_user_email,
                    status: isFulfilled ? "info" : "failure"
                }
            );
        
        // ===6. Send Email
        if (isFulfilled) {
            const isSent = await mailer(modifier_email, other_user_email, "You Got Deleted", `
                Dear ${other_user_name || "Patient"},

                Your hospital patient's account was deleted ${new Date()}.
                If you believe this was a mistake or have any questions, please contact us.

                Sincerely,
                ${modifier_name}
            `);

            if (isSent)
                return res.json({ success: true, message: "Patient Deleted & Email Sent" });
            else
                return res.status(200).json({ success: false, message: "Patient Deleted But Email Not Sent" });

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


