const router = require("express").Router();
const NodeCache = require("node-cache");
const jwtVerify = require("../middlewares/jwtVerify.js");
const User = require("../Classes/User.js");
const executeMySqlQuery = require("../Utils/executeMySqlQuery.js");
const JoinFiltering = require("../Utils/JoinFiltering.js");
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
const myCache = new NodeCache({ stdTTL: 3600 }); // default TTL 1hr

// =================================
//  Get All Employees Data (for Admins or SuperAdmins)
// =================================
router.get("/employees",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size , emp_id, role_name, emp_perms, ...restFilters } = req.query;
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !emp_id ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const Modifier_role = await User.getUserRole(emp_id);
        const Modifier_perms = await User.getSetUserperms(emp_id);

        if (Modifier_role === "Employee") return res.status(401).json({ success: false, message: "Employee Role cannot access The list" });
        // Cache total number of employees
        let totalNumOfEmployees = [{ count: 0 }];
        if (myCache.has("totalNumOfEmployees")) {
            totalNumOfEmployees = [{ count: myCache.get("totalNumOfEmployees") }];
        }
        else{
            totalNumOfEmployees = await executeMySqlQuery(`SELECT COUNT(*) as count FROM employees`);
            myCache.set("totalNumOfEmployees", totalNumOfEmployees[0].count); 
        }

        const numOfPages = Math.ceil(totalNumOfEmployees[0].count / size);


    /** Define Joining TYPE  **/
    // if we left joining no need to add on conditions as not all users are going to exist in employee and other tables
    const roles_JOIN = !role_name || role_name === "Employee"  ? " LEFT JOIN roles r ON e.emp_id = r.emp_id " : " JOIN roles r ON e.emp_id = r.emp_id " ;
    const perms_JOIN = emp_perms ? " JOIN employee_perms ep ON e.emp_id = ep.emp_id \n JOIN perms p  ON ep.perm_id = p.perm_id " : "  LEFT JOIN employee_perms ep ON e.emp_id = ep.emp_id \n LEFT JOIN perms p ON ep.perm_id = p.perm_id  ";

    /**  Filter Conditions **/
    const Rest_CONDITION = restFilters ? JoinFiltering(Object.entries(restFilters),"e") : "" ;
    const roles_CONDITION = !role_name || role_name === "Employee" ? "" : JoinFiltering(Object.entries({role_name:role_name}),"r") ;
    // filtering gouped values on perms will be done using HAVING keyword & FIND_IN_SET which searches for string in string seperated by ", "
    const perms_CONDITION = emp_perms ? `
            HAVING 
            FIND_IN_SET('${emp_perms}', GROUP_CONCAT(DISTINCT p.perm_name)) > 0 ` : "";

    /**  Is Accessible Conditions **/
    // default value of those columns would be '' if user doen't have their perms
    // logically if user have permission to modify salary then he could see it but other props like roles, perms he can see it anyway even with no role to modify
    const access_salary = (Modifier_perms.isPermExist("Modify Salary") || Modifier_perms.isPermExist("Display Salary")) ? " e.emp_salary, e.emp_bonus " : " '' AS emp_salary , '' AS emp_bonus "

    // Build the final query
    /* roles filtering exists any way no need to check*/
    /* we group rows instead of repeating for each new perm */
    const query = `
      SELECT 
        e.emp_id, 
        e.emp_name, 
        COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms, 
        COALESCE(NULLIF(r.role_name, ''), 'Employee') AS role_name, 
        e.emp_abscence, 
        e.emp_rate, 
        e.emp_title, 
        e.emp_specialty, 
        e.emp_email,
        ${access_salary} 
        FROM employees e 
        ${roles_JOIN}
        ${perms_JOIN}
        ${roles_CONDITION || Rest_CONDITION ? " WHERE " : ""} 
        ${Rest_CONDITION}
        ${roles_CONDITION && Rest_CONDITION ? " AND " : ""}
        ${roles_CONDITION}
        GROUP BY 
            e.emp_id, e.emp_name, r.role_name, e.emp_abscence, e.emp_rate, e.emp_title, e.emp_specialty , e.emp_email, e.emp_salary, e.emp_bonus
        ${perms_CONDITION}
        LIMIT ? OFFSET ?`;
        // last to parameters are linilt & offset
      const users = await executeMySqlQuery(query , [ parseInt(size) , parseInt((pagination - 1) * size )]);

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
//  Get All Patients Data (for Admins or SuperAdmins)
// =================================
router.get("/patients",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size , user_id, ...restFilters } = req.query;
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

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


