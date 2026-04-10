const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwtVerify = require("../middlewares/jwtVerify.js")
const createJWTToken = require("../Utils/createJWTToken.js");
const isExist = require("../Utils/isExist.js");
const executeMySqlQuery = require("../Utils/executeMySqlQuery.js");
const User = require("../Classes/User.js");
const RemoveFixedFields = require("../Utils/RemoveFixedFields.js");
const mailer = require("../Utils/mailer.js");
const ResetPasswordTokensModel = require("../Models/ResetPassword.js");
const crypto = require("crypto");
const consoleLog = require("../Utils/consoleLog.js");
const HospitalUsersMethods = require("../Classes/HospitalUsers/HospitalUsersMethods.js");
const stringifyFields = require("../Utils/stringifyFields.js");
// =================================
//  Login User (Employees or Patients)
// =================================
    router.post("/login", async function(req, res) {
        try {
            // Extract request data
            const { user_email, password } = req.body;

            // --1. Bad Request if missing fields
            if(!user_email || !password) 
                return res.status(400).json({success:false,message:"Bad Request"});
            
            const userExists = await User.checkIfUserExistsByEmail(user_email);
            const userType = await User.getUserTypeByEmail(user_email);

            const userIsEmployee = userType === 'employee';
            const userIsPatient = userType === 'patient';

            if(!userExists){
                return res.status(404).json({
                    success:false,
                     message : "User Not Found"
                });
            }
            
            // If employee, make sure he is hospital employee
            const isHospitalUser = userIsEmployee?  HospitalUsersMethods.isHospitalUser(await User.getUserTitleByEmail(user_email)) : false;
 
                // If he's employee but not as hospital staff then he has to register as patient first
                    if(!isHospitalUser && userIsEmployee){
                        return res.status(404).json({
                            success:false,
                            message : "You Must Register As Patient First"
                        });
                    }
            
            

            // --3. Get user data from the correct table and match password
            let user = null;
            let match = null
            // sets value to Patient as default value for 
            const result =await User.getUserIDAndTable(user_email);
            const user_id = result.user_id;
            const user_title =await User.getUserTitleByEmail(user_email);
            const isHospitalEmployee = HospitalUsersMethods.isHospitalUser(user_title)
            user = await HospitalUsersMethods.MapUserToGETSpecificDataFunction(user_id, user_title);

            // User must register as patient if he is not an employee and not registered as patient
            if(!userIsEmployee && !isHospitalEmployee && userIsPatient){
                return res.status(404).json({
                    success: false,
                    message: 'Please, Register As Patient First'
                });
            }

            // Gets Perms Set and convert it to Array
            // Gets Role
            if(userIsEmployee && isHospitalEmployee){
                user.emp_perms =  Array.from (await User.getSetUserperms(user_id));
                user.role_name = await User.getUserRole(user_id)
            }

            if (!user || !user.user_password) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            match = await bcrypt.compare(password, user.user_password);
            
            // Compare request's password with hashed password
            if (!match) {
                return res.status(401).json({
                    success: false,
                    message: 'Passwords Do Not Match'
                });
            }


            // --4. Create JWT Token and send response without password
            const { user_password, ...userInfo } = user;
            const token = await createJWTToken(userInfo.user_id, userInfo.user_email);
            

            return res.status(200).json({
                success: true,
                body: { ...userInfo, token },
                message: "Successful Login"
            });


            
        } catch (err) {
            consoleLog(`Error in Logining`, "error");
            console.log(err)
            res.status(500).json({
                success: false,
                message: err.message || "Error in Logining"
            });
        }
    });
// =================================
//  Register New User (Patient)
// =================================
    router.post("/register",async function(req , res){
        try {
    
                let {user_name,user_email,user_password, ...restPatientData} = req.body;

                // Bad Request 
                if(!user_name || !user_email || !user_password) return res.status(400 ).json({success:false,message:"Bad Request"});

                const userType = await User.getUserTypeByEmail(user_email);
                const userIsPatient = userType === "patient";

                // User is not patient
                if (userIsPatient) {
                    return res.json({ success: false, message: "This email has been used before" });
                } 

                // assign hashed to user before preparing for inserting into db 
                const hashedPassword = await User.hashPassword(user_password);
                if(!hashedPassword) return res.status().json({success: false, message: "Failed To Hash Password"})
                
                // First Insert to users table
                const queryPatients = `INSERT INTO users (${columns_field},user_type) VALUES (${values_field},'patient')`
                const InsertedToPatients = await executeMySqlQuery( queryPatients );

                if(InsertedToPatients.affectedRows == 0) return res.status().json({success:false,message:"Failed To Register User"})

                

                // make entries array of hashed user
                let request_entries = Object.entries(user);

                const {columns_field , values_field} = stringifyFields("seperate", request_entries)
                
                // Register by inserting to patients table
                const query = `INSERT INTO users (${columns_field}) VALUES (${values_field})`


                const registered = await executeMySqlQuery( query );

                if(registered){
                    res.json({success:true,message:"Successfully Registered as Patient"})
                }
                else{
                    res.json({success:false,message:"Failed To Register Patient"})
                }
        
        }
        catch (err) {
            console.error("Error In Registering New User" ,err)
            res.json({
                success:false,
                message:err.message || "Error In Registering New User"
            })
        }
    })

// =================================
//  Update Self User Data
// =================================
    router.put("/update-user",async function(req , res){
        try {
            // --0. Extract request data and actions from query
            let {user_id , ...newUserData} = req.body;

            let {actions} = req.query;
            actions = actions.split("-")


            // --1. Bad Request if missing fields
            if(!user_id  || actions.length === 0) return res.status(400 ).json({success:false,message:"Bad Request"});



            // --2. See if user exists at one of the tables
            // we get email from db cuz user could change it and we need the old one to search for user
            const user_email =await User.getUserEmail(user_id);
            console.log("user_email",user_email)
            if(!user_email){
                return res.status(404).json({
                    success:false,
                     message : "User Not Found"
                });
            }

            const userType = await User.getUserTypeByEmail(user_email);

            const userIsEmployee = userType === 'employee';
            const userIsPatient = userType === 'patient';
            
            if(!userIsEmployee && !userIsPatient){
                return res.status(404).json({
                    success:false,
                     message : "User Not Found"
                });
            }
            
            
            const user_title =await User.getUserTitleByEmail(user_email);
            // --3. Update User's Data at the correct table
            // make sure to remove fields that cannot be changed by user 
            let isUpdated = null;

            if(userIsEmployee){
                isUpdated =await HospitalUsersMethods.MapUserToUpdateFunction(user_id , user_title , newUserData , actions)
                
            }
            else if(userIsPatient){
                isUpdated = await HospitalUsersMethods.MapUserToUpdateFunction(user_id , user_title , newUserData , actions)
            }

            // --4. Check if update was successful and send response
            if (isUpdated && isUpdated.length > 0) {
            // Check if at least one action succeeded
            const allSucceeded = isUpdated.every(item => item.result === true);

            return res.status(allSucceeded ? 200 : 207).json({
                success: allSucceeded,
                message: allSucceeded 
                    ? "All updates completed successfully"
                    : "Some updates failed",
                details: isUpdated // send the full breakdown
            });
        } 
        else {
            return res.status(500).json({
                success: false,
                message: "No updates performed",
                details: isUpdated || []
            });
        }
            
        }
        catch (err) {
            consoleLog(`Error update-user Data Path ` , "error")
            console.log(err)
            res.status(500).json({
                success:false,
                message:err.message || "Error Updating Your Data Path"
            })
        }
    })

// =================================
//  Requsest Password Reset Link
// =================================

    router.post("/forget-password",async function(req , res){
        try{   
            const { user_email } = req.body;

            // --1. Bad Request if missing fields
            if(!user_email) return res.status(400 ).json({success:false,message:"Bad Request"});



            // --2. See if user exists at one of the tables
            const userType = await User.getUserTypeByEmail(user_email);

            const userIsEmployee = userType === 'employee';
            const userIsPatient = userType === 'patient';

            // USER NOT FOUND At EMPLOYEES TABLE
            if(!userIsEmployee && !userIsPatient){
                return res.status(404).json({
                    success:false,
                     message : "User Not Found"
                });
            }
            // --2. See if user have requested to reset password before if not create a document for him
            let UserAtResetPasswordTokensModel = null;
            if(userIsEmployee){
                 UserAtResetPasswordTokensModel = await ResetPasswordTokensModel.findOne({ user_email: userIsEmployee.data.user_email });
                 if(!UserAtResetPasswordTokensModel) {
                    UserAtResetPasswordTokensModel = new ResetPasswordTokensModel({
                        emp_id:userIsEmployee.data.emp_id,
                        user_email: userIsEmployee.data.user_email,
                        ResetToken: "",
                    })
                }
            }
            else if(userIsPatient){
                 UserAtResetPasswordTokensModel = await ResetPasswordTokensModel.findOne({ user_email: userIsPatient.data.user_email });
                 if(!User) {
                    UserAtResetPasswordTokensModel = new ResetPasswordTokensModel({
                        emp_id:userIsPatient.data.emp_id,
                        user_email: userIsPatient.data.user_email,
                        ResetToken: "",
                    })
                }
            }
            
            // --3. Save reset token to db and send email to user

                // generate Reset Password Token
                const reset_token = crypto.randomBytes(20).toString('hex');
                // set user reset token and it's time of creation
                UserAtResetPasswordTokensModel.ResetToken = reset_token;
                
                UserAtResetPasswordTokensModel.createdAtToken =  new Date();
                // save to data base
                await UserAtResetPasswordTokensModel.save()
                // send link of reset
                //"/reset-password/:userid/:token"
                const reset_message = `Your request to reset your password was recieved,
                 Now you have to visit this link to reset your password to a new one : ${process.env.RESETPASSPATH}/${UserAtResetPasswordTokensModel._id}/${reset_token}`
                //(SendFrom , SendTo , subject , text)
                const isSent = await mailer("baraamohamed2311@gmail.com" ,user_email, "Password Reset" , reset_message);
                
                    if(isSent){
                        res.status(200).json({success:true,message:"Reset Password Link Was Sent"});
                    }
                    else{
                        res.status(501).json({success:false,message:"Reset Password Link Wasn't Sent"});
                    }
        }
        catch(err){
            consoleLog( `Forgot Password Error : ` , "error" );
            console.log(err)
            res.status(500).json({
                success: false ,
                message : err.message || "Error Sending Reset Password Link"
                })
        }
    })

// =================================
//  Reset Password
// =================================
    router.put("/reset-password/:userId/:resetToken",async function(req ,res){
        try{
            const {user_password} = req.body;
            // userId is Id of user document at mongodb and not the emp_id field
            const  {userId , resetToken} = req.params;


            // --1. Bad Request if missing fields
            if(!user_password || !userId || !resetToken) return res.status(400 ).json({success:false,message:"Bad Request"});


            // --2. Check user exists at one of the tables
            const userType = await User.getUserTypeByEmail(user_email);

            const userIsEmployee = userType === 'employee';
            const userIsPatient = userType === 'patient';
            
            if(!userIsEmployee && !userIsPatient){
                return res.status(404).json({
                    success:false,
                     message : "User Not Found - Password Cannot be reset"
                });
            }

            // --3. Chech if user requested to reset password /forget-password
            const resetTokenForUser = await ResetPasswordTokensModel.findOne({ _id:userId });
            // USER NOT FOUND (Means wasn't created at /forget-password route)
            if(!resetTokenForUser) 
                res.status(404).json({
                    success:false,
                     message : "User Not Found - User Must Request To Reset Password First"
                });

            

            // passing created token at to new date class
            let DateInstance = new Date(resetTokenForUser.createdAtToken);
            let created_Token_at = {hour :DateInstance.getHours(),day:DateInstance.getDate()};

            
            

                /*Defining lifeTime in hours and get current time and day object */
                let token_lifetime = 1; // hour
                let current_Time = {hour :new Date().getHours(),day:new Date().getDate()};
                
                
                // check if token from url is same as in db & check resettoken created at db life time
                if(resetToken === resetTokenForUser.ResetToken && 
                   created_Token_at.hour + token_lifetime >= current_Time.hour && 
                   created_Token_at.day === current_Time.day){
                    
                    // then token is still valid and we save new password into db
                    const hashedPassword = await User.hashPassword(user_password);

                    let isReseted = null;
                    if(userIsEmployee){
                        isReseted = await executeMySqlQuery(`UPDATE employees SET user_password = ? WHERE emp_id = ?`,[hashedPassword , resetTokenForUser.emp_id])
                    }
                    else if(userIsPatient){
                        isReseted = await executeMySqlQuery(`UPDATE patients SET user_password = ? WHERE user_id = ?`,[hashedPassword , resetTokenForUser.emp_id])
                    }

                     
                    
                    if(isReseted){
                        res.status(200).json({
                            success:true,
                            message : "Password Was Updated Successfully"
                        });
                     }
                     else{
                        res.status(500).json({
                            success:false,
                            message : "Password Was Not Updated"
                        });
                     }
                }
                else{
                    res.status(501).json({
                        success:false,
                         message : "Password Wasn't Updated (Unvalid token)"
                    });
                }
            
        }
        catch(err){
            console.log("reset password Error : " , err );
            res.status(500).json({
                success: false ,
                message : err.message || "Error Updating Password"
                })
        }
    })

// =================================
//  Delete Self Patient Account
// =================================
    router.delete("/delete-self-patient",async function(req , res){

    })

    

// =================================
//  Check Auth (Private Route Example)
// =================================
    router.post("/private-route",jwtVerify , (req , res)=>{
        try{
            res.status(200).json({success:true , message:"You Are Authorized"})
        }
        catch(err){
            res.status(500).json({success:false , message: err.message || "Error In Private Routes"})
        }
    })

module.exports = router;