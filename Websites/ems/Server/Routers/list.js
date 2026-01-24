const router = require("express").Router();
const NodeCache = require("node-cache");
const jwtVerify = require("../middlewares/jwtVerify.js");
const User = require("../Classes/User.js");
const perms = require("../Classes/Perms/perms.js");
const SuperAdmin = require("../Classes/Roles/SuperAdmin.js");
const Admin = require("../Classes/Roles/Admin.js");
const stringifyFields = require("../Utils/stringifyFields.js");
const executeMySqlQuery = require("../Utils/executeMySqlQuery.js");
const JoinFiltering = require("../Utils/JoinFiltering.js");
const consoleLog = require("../Utils/consoleLog.js");
const mailer = require("../Utils/mailer.js")
const  ModifyOtherUserData  = require("../Utils/ControlUsers/ModifyOtherUserData.js");
const  ModifyRole  = require("../Utils/ControlUsers/ModifyRole.js");  
const  ModifyPerms = require("../Utils/ControlUsers/ModifyPerms.js");
const sqlTransaction = require("../Utils/sqlTransaction.js");
const cacheCountNodeCache = require("../Utils/cacheCountNodeCache.js");
const padBoth = require("../Utils/padBoth.js");
const buildJoinedFilters = require("../Utils/buildJoinedFilters.js");
const CompanyUsersMethods = require("../Classes/CompanyUsers/CompanyUsersMethods.js");
const hospitalJobs = require("../Tables/data.js").hospitalJobs;

// GET Employees Data
router.get("/employees",jwtVerify,async (req,res)=>{
    try{
        const { pagination, size , user_id,isFiltered, role_name: filter_role_name, emp_perms: filter_emp_perm, ...restFilters } = req.query; 
        
        //Bad Request if modifier id or others doesn't exist
        if(!pagination || !size || !user_id ) return res.status(400).json({success:false,message:"Bad Request"});

        // Ceck if list page can be accessible
        const Modifier_role = await User.getUserRole(user_id);
        const Modifier_perms = await User.getSetUserperms(user_id);
        // perms have there separate filtiring conditing using "HAVING" not "WHERE"
        const filtering_string = Object.keys(restFilters).length > 0 || filter_role_name ? padBoth(buildJoinedFilters({ role_name: filter_role_name,  ...restFilters}),1) :null;

        
        if (Modifier_role === "NormalUser") return res.status(401).json({ success: false, message: "NormalUser Role cannot access The list" });


        // get cached count 
        const EmployeesCount = await cacheCountNodeCache("totalNumOfEmployees",CompanyUsersMethods.getAllCompanyEmployeesCOUNT,filtering_string)
        const numOfPages = Math.max(1, Math.ceil( EmployeesCount / size));

        const users = await CompanyUsersMethods.getAllCompanyEmployeesFullData(parseInt(size), parseInt((pagination - 1) * size ),filtering_string,filter_emp_perm);
        

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

/************************************************************************************************/

    router.put("/update-others",jwtVerify ,async function(req , res){
        try {   
                // Let & not Const becase they get modified
                    let { modifier_id , user_id , employee_user_email , role_name : newRole,  newperms ,   ...updatedEmployeeData} = req.body;
                // Actions
                    let {actions} = req.query;
                    actions = actions.split("-")
                // Bad Request
                if(!actions || !modifier_id || !user_id ) 
                    return res.status(400 ).json({success:false,message:"Bad Request"});
                

                    let failing_messages = [];
                    console.log("action ", actions )
                    // then modifier is different user 
                    const modifierRole = await User.getUserRole(modifier_id);
                    const userRole = await User.getUserRole(user_id );

                    // if modifier have same role or higher and permession he can update others
                    const  modifierperms = await User.getUserperms(modifier_id);
                    // create set instance of it 
                    let modifierSetperms = new perms(modifierperms);
                    
/************************************************************************Data Update*********************************************/
                    if(actions.includes("Modify Data")){
                        if(modifierSetperms.isPermExist("Modify Data")){
                            // If  no "Modify Salary" perm we remove salary field to ensure not editing it
                            updatedEmployeeData = modifierSetperms.isPermExist("Modify Salary") ? updatedEmployeeData : delete updatedEmployeeData.emp_salary ;
                            await ModifyOtherUserData(user_id, userRole, modifierRole, updatedEmployeeData, employee_user_email,failing_messages)
                        }
                        else{ 
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Data"})
                        }
                    }
                    
                    
/***************************************************************Role Update*********************************************/
                    if(actions.includes("Modify Role")){
                        if (modifierSetperms.isPermExist("Modify Role")){
                            await ModifyRole(modifierRole, user_id, userRole, newRole, employee_user_email,failing_messages)
                        }
                        else{
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Role"})
                        }
                    }
/**************************************************************perms Update*********************************************/
                    if(actions.includes("Modify Perms")){
                        if (modifierSetperms.isPermExist("Modify Perms")){
                            const oldUserperms = await executeMySqlQuery(`SELECT COALESCE((SELECT COALESCE(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', ') , 'None') FROM perms p JOIN employee_perms ep ON p.perm_id = ep.perm_id WHERE ep.user_id =${user_id}), 'None') AS perm_name;`,"Error Getting Old User perms");
                            const oldUserpermsSet=new Set( oldUserperms[0].perm_name.split(", ")) ;
                            await ModifyPerms(user_id, userRole, modifierRole, newperms,oldUserpermsSet,failing_messages)
                        }
                        else{
                            failing_messages.push({success:false , message: "Not Allowed To Modify User Permissions"})
                        }
                    }
                    
/*********************************************************************************************************************/
                    // making sure not sending salary details if user has no perm
                    const access_salary = (modifierSetperms.isPermExist("Modify Salary") || modifierSetperms.isPermExist("Display Salary")) ? " e.emp_salary, e.emp_bonus " : " '' AS emp_salary , '' AS emp_bonus "
                    // left join to include records even if user doesn't exist in roles table
                    const getUpdatedUserQuery = `SELECT 
                                                        e.user_id, 
                                                        e.user_name, 
                                                        COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms, 
                                                        COALESCE(NULLIF(r.role_name, ''), 'Employee') AS role_name, 
                                                        e.emp_abscence, 
                                                        e.emp_rate, 
                                                        e.emp_title, 
                                                        e.emp_specialty, 
                                                        e.user_email ,
                                                        ${access_salary} 
                                                    FROM 
                                                        employees e 
                                                    LEFT JOIN  
                                                        roles r ON e.user_id = r.user_id 
                                                    LEFT JOIN employee_perms ep ON e.user_id = ep.user_id 
                                                    LEFT JOIN perms p ON ep.perm_id = p.perm_id
                                                    WHERE 
                                                        e.user_id = ?
                                                        GROUP BY
                                                        e.user_id, e.user_name, r.role_name, e.emp_abscence, e.emp_rate, e.emp_title, e.emp_specialty , e.user_email, e.emp_salary, e.emp_bonus;`;
                        
            
            
            const UpdateUser = await executeMySqlQuery(getUpdatedUserQuery , [user_id]);

                    /***************************************************/
                    if(failing_messages.length > 0){
                        // 401 for unauthorized modifications
                        res.status(401).json({ success:false,body:UpdateUser[0], messages : failing_messages})
                    }
                    else{
                        res.status(200).json({ success:true,body:UpdateUser[0], messages : [{success:true ,message:"Successful Updating User"}]})
                    }
        }
        catch (err) {
            consoleLog(`Error In Update Others Api Path ${err} `, "error")
            res.status(500).json({
                success:false,
                message:"Error In Update Others Api Path "
            })
        }
    })


/************************************************************************************************************************/

// Delete Employee Data
router.delete("/delete-employee", jwtVerify, async (req, res) => {
    try {
        const { modifier_email, modifier_id, modifier_name, user_id, user_name, user_email } = req.body;
        

        // all these fields required to delete & send email
        if(!modifier_email || !modifier_id || !user_id || !user_email  ) return res.status(400).json({success:false,message:"Bad Request"});
        
        
        let ModifierpermsSet = new perms(await User.getUserperms(modifier_id));
        let isAllFulfilled = false;
        
        if (ModifierpermsSet.isPermExist("Delete User")) {
            const ModifierRole = await User.getUserRole(modifier_id);
            const otherUserRole = await User.getUserRole(user_id);

            if (ModifierRole === "SuperAdmin") {
                isAllFulfilled = await SuperAdmin.RemoveOtherUser(user_id , otherUserRole);
            } else if (ModifierRole === "Admin") {
                isAllFulfilled = await Admin.RemoveOtherUser(user_id , otherUserRole);
            }

            
        }
        else{
            return res.json({success:false , message:"Not Allowed To Delete Users"})
        }
        
        if (isAllFulfilled) {
            const isSent = await mailer(modifier_email, user_email, "You Got Accepted", `
                Dear ${user_name},

                We regret to inform you that, after careful consideration, we have made the decision to terminate your employment with our company, effective ${new Date()}.

                This decision was made in line with company policies and after evaluating recent events and your performance. Please arrange to return any company property in your possession.
                You will receive your final paycheck and any relevant information regarding benefits and severance shortly.
                If you have any questions regarding this process, feel free to contact HR.

                We appreciate your contributions to the company and wish you the best in your future endeavors.

                Sincerely,
                ${modifier_name}
            `);

            if (isSent)
                return res.json({ success: true, message: "User Deleted & Email Sent" });
            else
                return res.status(500).json({ success: false, message: "User Deleted But Email Not Sent" });

        } else {
            return res.status(500).json({ success: false, message: "User Wasn't Deleted" });
        }
    } catch (err) {
        consoleLog(`Error Delete Employee Data ${err}`, "error");
        res.json({
            success: false,
            message: "Error Delete Employee Data"
        });
    }
});






/************************************************************************************************************************/
/********************Registered Page***********************/

router.get("/registered-approve",jwtVerify,async (req,res)=>{
    try{    
            const {modifier_id ,currPage , size , filtered_user_email} = req.query;



        // Bad Request if
        if(!modifier_id || !currPage || !size   ) return res.status(400 ).json({success:false,message:"Bad Request"});


                
            const ModifierpermsSet = await User.getSetUserperms(modifier_id);

            if(!ModifierpermsSet.has("Accept Registered")){
                return res.json({success:false , message:"You Have No Permission"})
            } 
            

            /* Safe from SQL INJECTION */
            let query = `SELECT * FROM unregistered_employees`;
            const params = [];

            if (filtered_user_email) {
                query += ` WHERE user_email = ?`;
                params.unshift(filtered_user_email); // push filtered_user_email at first element
            }

            query += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(size), parseInt((currPage - 1) * size)); // Add size and offset as parameters

            const users = await executeMySqlQuery(query, params);



            if( users && users.length > 0){
                res.json({success : true , body:users, message:"Successfully Fetched Waiting List Data"})
              }
              else{
                res.json({success : false  ,  message:"Waiting List Is Empty"})
              }

    }
    catch(err){

        consoleLog(`Error Register Page Employee Data ${err}` ,"error");
        res.json({
            success:false,
            message:"Error Register Page Employee Data"
        })
    }
})


/************************************************************************************************************************/
router.post("/registered-approve/accept",jwtVerify,async (req,res)=>{
    try{    
        const {modifier_id ,modifier_email ,  modifier_name  ,user_email , user_name , user_password , emp_title ,emp_specialty } = req.query;


        // Reqired to accept user and send email
        if(!modifier_id || !modifier_email || !user_email  || !user_password || !emp_title || !emp_specialty) return res.status(400 ).json({success:false,message:"Bad Request"});

        const ModifierpermsSet = await User.getSetUserperms(modifier_id);

        

        if(!ModifierpermsSet.has("Accept Registered")){
            return res.json({success:false , message:"You Have No Permission"})
        }

        // get last user id to increment it by 1
        // MAX() is more effiecient than ORDER BY DESC LIMIT 1
        const LastIdInTable = await executeMySqlQuery("SELECT MAX(user_id) FROM users");
        const registering_user_id = LastIdInTable[0].user_id + 1;
        console.log("registering_user_id", registering_user_id)
        const userExists = !!(await executeMySqlQuery(
            `SELECT 1 FROM unregistered_employees WHERE user_email = ? LIMIT 1`,
            [user_email]
            ))?.[0];


        // hash password before inserting
        const hashed_password = await User.hashPassword(user_password);
        
        
        const queries = []
        // INSERT TO USERS , EMPLOYEES , EMPLOYEES_HOSPITAL TABLES
        // INSERT TO USERS TABLE
        const intsertToUsers_query = `INSERT INTO users (user_id , user_email, user_name , user_password,user_type) VALUES (${registering_user_id},${user_email},${user_name},${hashed_password},'employee')`
        queries.push(intsertToUsers_query);
        // INSERT TO EMPLOYEES TABLE
        const insertToEmployees_query = `INSERT INTO employees (emp_id ,emp_title,emp_specialty, emp_salary , emp_bonus , emp_abscence , emp_rate) VALUES (${registering_user_id},${emp_title},${emp_specialty},${registering_user_id}, 0 , 0 , 0 , 0)`
        queries.push(insertToEmployees_query);
        
        // INSERT TO EMPLOYEES_HOSPITAL TABLE ONLY IF USER TITLE IS HOSPITAL JOB
        const insertToHospitalEmps_query = `INSERT INTO employees_hospital (hosp_emp_id,emp_id,emp_title) VALUES (${registering_user_id},${registering_user_id},${emp_title});`;
        if(hospitalJobs.has(emp_title)){
            queries.push(insertToHospitalEmps_query);
        }
        // DELETE FROM REGISTERED TABLE
        const deleteOnRegister_query =`DELETE FROM unregistered_employees WHERE user_email = "${user_email}"`
        queries.push(deleteOnRegister_query);


        const addToTables =  await sqlTransaction(queries);
        

        if(addToTables){
            const isSent =await mailer(modifier_email ,user_email, "You Got Accepted" , `
                Dear ${user_name},
    
                We are excited to inform you that you have been officially accepted as a part of the  team! We were impressed with your skills and qualifications, and we are confident you will make valuable contributions.
                Our HR team will reach out to you soon with further details regarding your onboarding process. Should you have any questions in the meantime, feel free to reach out.
                Once again, congratulations, and we look forward to welcoming you aboard!
    
                Best regards,
                ${modifier_name}
            
            `);
            if(isSent)
                return res.json({success:true , message:"User Got Accepted & Email Sent"});
            else
            return res.json({success:false , message:"User Got Accepted But Email Not Sent"});
        }else{
            return res.json({success:false , message:"Failed To Accept User"})
        }

        
             
    }
    catch(err){
        consoleLog(`Error Register Page Accept Employee Data ${err}` ,"error");
        console.log(err)
        res.json({
            success:false,
            message:"Error Register Page Accept Employee Data"
        })
    }
})

/************************************************************************************************************************/
router.delete("/registered-approve/decline",jwtVerify,async (req,res)=>{
    try{    
        const {modifier_id , modifier_email , modifier_name , user_email : declined_user_email , user_name} = req.query;

        
        // Reqired to decline user and send email
        if(!modifier_id || !modifier_email || !declined_user_email   ) return res.status(400).json({success:false,message:"Bad Request"});
        
        
        const ModifierpermsSet = await User.getSetUserperms(modifier_id);

        if(!ModifierpermsSet.has("Accept Registered")){
            return res.json({success:false , message:"You Have No Permission"})
        }

        // delete from registered table after making sure he was added
        const deleteFromRigesterTable = await executeMySqlQuery(`DELETE FROM unregistered_employees WHERE user_email = ?`,[declined_user_email])


        if(deleteFromRigesterTable){
            const isSent =await mailer(modifier_email ,declined_user_email, "You Got Accepted" , `
                Dear ${user_name},
    
                Thank you for taking the time to apply for the position at Our Company. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

                We truly appreciate your interest in joining our team and encourage you to apply for future opportunities that may align with your skills and experience.

                We wish you the best in your future endeavors.
    
                Best regards,
                ${modifier_name}
            
            `);
            if(isSent)
                return res.json({success:true , message:"User Got Rejected & Email Sent"});
            else
            return res.json({success:false , message:"User Got Rejected But Email Not Sent"});
        }else{
            return res.json({success:false , message:"Failed To Delete User"})
        }

        
             
    }
    catch(err){
        console.error(`Error Register Page Delete Employee Data:`, err);
        res.json({
            success:false,
            message:"Error Register Page Delete Employee Data"
        })
    }
})


module.exports = router;


