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
const ConsultationMethods = require("../Utils/methods/ConsultationMethods.js");

const RemoveFixedFields = require("../Utils/RemoveFixedFields.js");
const Tables = require("../Tables/data.js");
const DoctorMethods = require("../Utils/methods/DoctorMethods.js");
const PatientMethods = require("../Utils/methods/PatientMethods.js");
const fetchImagesForListedUsers = require("../Utils/fetchImagesForListedUsers");
const stringifyFields = require("../Utils/stringifyFields.js");
const JoinFiltering = require("../Utils/JoinFiltering.js");
const isExist = require("../Utils/isExist.js");
const getDayOfWeekByDate = require("../Utils/getDayOfWeekByDate.js");
const isDayInPast = require("../Utils/isDayInPast.js");
const isTimeSlotInPast= require("../Utils/isTimeSlotInPast.js");
const isSameDay = require("../Utils/isSameDay.js");
const createOrderByClause = require("../Utils/createOrderByClause.js");
const padBoth = require("../Utils/padBoth.js");
const buildJoinedFilters = require("../Utils/buildJoinedFilters.js")
const createConsultationAlert = require("../Utils/createConsultationAlert.js");

// =================================
//  Get  Availability Details
// =================================

router.get("/get-availability",jwtVerify,async (req,res)=>{

    try {
    const { hosp_emp_id } = req.query;

    // Validate required fields
    if (!hosp_emp_id ) {
      return res.status(400).json({
        success: false,
        message: "Bad Request."
      });
    }


    // Fetch the appointment
    const available_days = await ConsultationMethods.getAllAvailabilityDays(hosp_emp_id);

    if (!available_days || available_days.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Availability found matching provided details."
      });
    }

    res.status(200).json({
      success: true,
      body: available_days
    });

  } catch (err) {
    console.error("Error in /get-availability:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error while fetching availability."
    });
  }
});
// =================================
//  Get  Specific Appointment
// =================================

router.get("/get-consultation/:user_id/:consultation_id",jwtVerify,async (req,res)=>{

    try {
    const {user_id, consultation_id } = req.params;


    // Validate required fields
    if (!consultation_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing Parameters."
      });
    }
    // Get consultation details
    const consultationDetails = await ConsultationMethods.getConsultationById(consultation_id);
    // check consultation details
   if(!consultationDetails){
    return res.status(404).json({success:false,message:"No Consultation Details"})
   }
   // Check if user exists
    const userExists = await User.checkIfUserExistsById(user_id);
    if(!userExists){
    return res.status(400).json({
        success: false,
        message: "Missing Parameters."
      });
   }
   // Get user type
   const userType = await User.getUserTypeById(user_id);

   let other_user_id = null;
   // for patient we care about getting consultation details and employee details
   // for employee we care about getting consultation details and patient details
   if(userType === "patient"){
      other_user_id = consultationDetails.hosp_emp_id;
      
      
   }
   else if(userType === "employee"){
      other_user_id = consultationDetails.user_id;
   }
   
   const otherUserTitle = await User.getUserTitleByID(other_user_id)

   const otherUserDetails = await HospitalUsersMethods.MapUserToGETFullDataFunction(other_user_id,otherUserTitle);
   

   

   // check consultation details
   if(!otherUserDetails){
    return res.status(200).json({success:true,body:{consultationDetails},message:"Consultation Is Fetched, But no user Data"})
   }
   // add title for client side rendering
   otherUserDetails.emp_title = otherUserTitle;

    res.status(200).json({success:true,body:{consultationDetails,otherUserDetails} ,message:"Successfully Fetched consultation details"})
   

  } catch (err) {
    console.error("Error in /get-consultation/details:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error while fetching appointment."
    });
  }
});

// =================================
//  Get  All Appointment
// =================================
router.get("/get-all-consultations",jwtVerify,async (req,res)=>{
    try {
    const { user_id ,  user_email , pagination , size , ...rest} = req.query;

    // Require at least one identifier
    if (!user_id ) {
      return res.status(400).json({
        success: false,
        message: "Bad Request."
      });
    }


    
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

            const filtering_string = Object.keys(restFilters).length > 0 ? padBoth(JoinFiltering(Object.entries(restFilters)),1) : "";
            const orderByClause = createOrderByClause(orderBy);
    
    let consultations;
    let consultationsCOUNT;

        // --2. See if user exists at one of the tables
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
    // Get method depending on user type
    if (userIsEmployee) {
      consultations = await ConsultationMethods.getEmployeeAppointments(user_id,parseInt(size), parseInt((pagination - 1) * size ) , filtering_string , orderByClause);
      consultationsCOUNT = await ConsultationMethods.getEMPConsultationsCOUNT(user_id);
    } else if(userIsPatient){
      consultations = await ConsultationMethods.getPatientAppointments(user_id,parseInt(size), parseInt((pagination - 1) * size ) , filtering_string , orderByClause);
      consultationsCOUNT = await ConsultationMethods.getPATConsultationsCOUNT(user_id);
    }

    if (!consultations || consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No consultations found."
      });
    }
    numOfPages = Math.max(1, Math.ceil(consultationsCOUNT / size));

    res.status(200).json({
      success: true,
      numOfPages: numOfPages, // we do not cache it in server  as it is specific for each user
      body: consultations
    });

  } catch (err) {
    console.error("Error in /get-all-consultations:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error while fetching consultations."
    });
  }
});


// =================================
//    Schedule an Appointment
// =================================
router.post("/book-consultation",jwtVerify,async (req,res)=>{
    try{
       
        const {
            hosp_emp_id,       // Doctor or Surgeon ID (from employees_hospital)
            user_id,  // The selected availability slot
            consultation_date,
            start_time,
            end_time,
            consultation_type,
            bookedAt
        } = req.body;

        // ===1. Validate Input

        if (!hosp_emp_id || !user_id  || !consultation_date || !start_time || !consultation_type || !bookedAt) {
            return res.status(400).json({
                success: false,
                message: "Missing required booking details."
            });
        }


        // === Ceck if consultation_date is in the past

        if(isDayInPast(bookedAt,consultation_date)){
            return res.status(400).json({
                success: false,
                message: "Cannot book consultation in the past days"
            });
        }
        // compares bookedAt hour with start_tiem (all in 24-hrs format)
        if(isTimeSlotInPast(bookedAt.split(" ")[1], start_time) && isSameDay(bookedAt,consultation_date)){
          return res.status(400).json({
                success: false,
                message: "Cannot book consultation in the past hours"
            });
        }

        
        


        // ===2. Check employee eligibility
        const isValidEmp = await ConsultationMethods.isVaildEmployeeTitleForAppointments(hosp_emp_id);


        if(!isValidEmp){
            return res.status(400).json({
                success: false,
                message: "Invalid employee for booking consultation."
            });
        }
      
        // ===3. Check if new patient exists 
        const userExists = await User.checkIfUserExistsById(user_id);
        const userType = await User.getUserTypeById(user_id);

        const userIsEmployee = userType === 'employee';

        if(!userExists || userIsEmployee){
            return res.status(404).json({
                      success:false,
                      message : "You have to register as patient before booking an appointment."
                        });
        }

        // check that patient has no booked consultion before
        const patietn_has_incomplete_consultation = await ConsultationMethods.patientHasOtherConsultationWithEmp(user_id,hosp_emp_id)
        if(patietn_has_incomplete_consultation){
          return res.status(400).json({
                success: false,
                message: "You already have a consultation scheduled with this user"
            });
        }
      

        // === Check if patient already booked it
        const isPatientAvailable = await PatientMethods.isPatientAvailable(user_id,consultation_date,start_time);

        if(!isPatientAvailable){
            return res.status(400).json({
                success: false,
                message: "You have a pre-scheduled consultation at this time"
            });
        }


        // ===3. Check shift availability if vaild get availability details
        // === Get day of week from date
        const dayOfWeek  = new Date(consultation_date);
        const dayOfWeekIndex = dayOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
        const availability = await ConsultationMethods.getAvailabilityDay(hosp_emp_id,dayOfWeekIndex); // Not used in this context
        if(!availability) return res.status(404).json({success:false,message:"Not Available on that date"})


        // ===4. Check consultation_status 

        const consultation_slot = await ConsultationMethods.getEmployeeConsultationSlot(hosp_emp_id,consultation_date,start_time);



        const isConsultionAvailable = await ConsultationMethods.isConsultionAvailable(availability,consultation_slot);

        if(!isConsultionAvailable){
            return res.status(400).json({
                success: false,
                message: "Consultation is not available at this time"
            });
        }

        
        // =============================
        // ====6. Create Consultation Entry
        // =============================
        const isConsultationBooked = await ConsultationMethods.bookConsultationAppointment(hosp_emp_id, user_id,availability.availability_id,consultation_date,start_time,end_time,consultation_type)

        if(!isConsultationBooked){
            return res.status(400).json({
                success: false,
                message: "Failed to book consultation. Please try again."
            });
        }

        // === Notify patient + employee that a consultation was booked
        await createConsultationAlert({
            alert_name: "Consultation Booked",
            alert_details: `New ${consultation_type.replace("_consultation_price","")} consultation scheduled for ${consultation_date} at ${start_time}.`,
            alert_status: "Scheduled",
            hosp_emp_id,
            user_id,
        });



        // =============================
        // ✅ Success Response
        // =============================
        res.status(200).json({
            success: true,
            message: `Consultation booked successfully`,

        });
    }
    catch(err){
        console.error("Error Booking Consultation",err);
        res.status(500).json({
            success:false,
            message: err.message || "Error Booking Consultation"
        })
    }
})


// =================================
//  Update status of Appointment
// =================================
router.put("/update-consultation-status",jwtVerify,async (req,res)=>{
        try {
        const { consultation_id, new_status } = req.body;

        // ===1. Validate inputs
        if (!consultation_id || !new_status) {
        return res.status(400).json({
            success: false,
            message: "Bad Request",
        });
        }


        if(new_status === "Scheduled"){
            return res.status(404).json({
            success: false,
            message: "You Cannot Update Status to be Scheduled. Must be Scheduled by a patient",
        });
        }
        // ===2. Validate inputs check if appointment exists before updating

        const existingAppointment = await ConsultationMethods.getConsultationById(consultation_id);
        if (!existingAppointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found.",
        });
        }
        // Check if consultation is updateable

        if(existingAppointment.consultation_status !== "Available" && existingAppointment.consultation_status !== "Scheduled"){
            return res.status(404).json({
            success: false,
            message: "You Cannot Update Status Of A Completed Consultation.",
        });
        }

        

        // ===3. Update appointment status
        const result = await ConsultationMethods.updateAppointmentStatus(consultation_id, new_status);

        if (result) {
        await createConsultationAlert({
            alert_name: "Consultation Status Updated",
            alert_details: `Consultation #${consultation_id} status changed to ${new_status}.`,
            alert_status: new_status,
            consultation_id,
            hosp_emp_id: existingAppointment.hosp_emp_id,
            user_id: existingAppointment.user_id,
        });
        res.status(200).json({
            success: true,
            message: "Appointment updated successfully.",
        });
        } else {
        res.status(409).json({
            success: false,
            message: "Failed to update appointment.",
        });
        }
    } catch (err) {
        console.error("Error in /update-appointment:", err);
        res.status(500).json({
        success: false,
        message: err.message || "Server error while updating appointment.",
        });
    }
})
// =================================
//  Update an patient id of Appointment
// =================================
router.put("/update-consultation-patient",jwtVerify,async (req,res)=>{
        try {
        const { consultation_id, user_id } = req.body;

        // ===1. Validate inputs
        if (!consultation_id || !user_id) {
        return res.status(400).json({
            success: false,
            message: "Bad Request",
        });
        }



        // ===2. check if appointment exists before updating

        const existingAppointment = await ConsultationMethods.getConsultationById(consultation_id);
        if (!existingAppointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found.",
        });
        }


        // ===3. Check if new patient exists 
        const userExists = await User.checkIfUserExistsById(user_id);
        
        if(!userExists){
            return res.status(404).json({
                      success:false,
                      message : "Create patient before assigning to appointment."
                        });
        }

        // ===4. Update appointment patient id
        const result = await ConsultationMethods.updateConsultationPatient(consultation_id, user_id);

        if (result) {
        await createConsultationAlert({
            alert_name: "Consultation Booked",
            alert_details: `You were assigned to consultation #${consultation_id}.`,
            alert_status: "Scheduled",
            consultation_id,
            hosp_emp_id: existingAppointment.hosp_emp_id,
            user_id,
        });
        res.status(200).json({
            success: true,
            message: "Appointment Patient updated successfully.",
        });
        } else {
        res.status(409).json({
            success: false,
            message: "Failed to update Patient in appointment.",
        });
        }
    } catch (err) {
        console.error("Error in /update-appointment:", err);
        res.status(500).json({
        success: false,
        message: err.message || "Server error while updating appointment.",
        });
    }
})
// =================================
//  Reschedule Appointment
// =================================
router.put("/reschedule-appointment",jwtVerify,async (req,res)=>{
        try {
        const { hosp_emp_id,user_id,consultation_id, new_consultation_date , new_start_time,new_end_time } = req.body;

        // ===1. Validate inputs
        if (!consultation_id || !new_consultation_date || !new_start_time || !user_id) {
        return res.status(400).json({
            success: false,
            message: "Bad Request",
        });
        }

        // === Ceck if consultation_date is in the past
        if(isDayInPast(new_consultation_date)){
            return res.status(400).json({
                success: false,
                message: "Cannot book consultation in the past."
            });
        }

        // === Check if patient already booked it
        const isPatientAvailable = await PatientMethods.isPatientAvailable(user_id,new_consultation_date,new_start_time);

        if(!isPatientAvailable){
            return res.status(400).json({
                success: false,
                message: "You have a pre-scheduled cnsultion at this time"
            });
        }


        // ===2. check if appointment exists before updating
        // we get by id to make sure it's in db and we get latest update of other fields
        const existingAppointment = await ConsultationMethods.getConsultationById(consultation_id);
        if (!existingAppointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found.",
        });
        }

        // ===3. Check shift availability if vaild get availability details
        // === Get day of week from date
        const dayOfWeek  = new Date(new_consultation_date);
        const dayOfWeekIndex = dayOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
        const availability = await ConsultationMethods.getAvailabilityDay(hosp_emp_id,dayOfWeekIndex); // Not used in this context


        // ===4. Check consultation_status 

        const consultation_slot = await ConsultationMethods.getEmployeeConsultationSlot(hosp_emp_id,new_consultation_date,new_start_time);



        const isConsultionAvailable = await ConsultationMethods.isConsultionAvailable(availability,consultation_slot);

        if(!isConsultionAvailable){
            return res.status(400).json({
                success: false,
                message: "Consultation is not available at this time"
            });
        }

        // ===5. Reschedule Appointment
        const result = await ConsultationMethods.updateAppointmentSchedule(consultation_id, availability.availability_id,new_consultation_date , new_start_time,new_end_time);

        if (result) {
        await createConsultationAlert({
            alert_name: "Consultation Rescheduled",
            alert_details: `Consultation #${consultation_id} moved to ${new_consultation_date} at ${new_start_time}.`,
            alert_status: "Rescheduled",
            consultation_id,
            hosp_emp_id,
            user_id,
        });
        res.status(200).json({
            success: true,
            message: "Appointment rescheduled successfully.",
        });
        } else {
        res.status(409).json({
            success: false,
            message: "Failed to reschedule appointment.",
        });
        }
    } catch (err) {
        console.error("Error in /reschedule-appointment:", err);
        res.status(500).json({
        success: false,
        message: err.message || "Server error while rescheduling appointment.",
        });
    }
})


// =================================
//  Update Appointment Details
// =================================
router.delete("/delete-appointment",jwtVerify,async (req,res)=>{
        try {
        const { consultation_id ,user_id} = req.query;

        // ===1. Validate inputs
        if (!consultation_id ) {
        return res.status(400).json({
            success: false,
            message: "Bad Request",
        });
        }



        // ===2. check if appointment exists before updating
        const existingAppointment = await ConsultationMethods.getConsultationById(consultation_id);
        if (!existingAppointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found.",
        });
        }

        // ===3. Does user relate to that appointment as a patient or employee
        if(existingAppointment.hosp_emp_id !== parseInt(user_id) && existingAppointment.user_id !== parseInt(user_id)){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this appointment.",
            });
        }
        // ===2. delete appointment

        const isdeleted = await ConsultationMethods.deleteConsultation(consultation_id);

        if (isdeleted) {
        await createConsultationAlert({
            alert_name: "Consultation Cancelled",
            alert_details: `Consultation #${consultation_id} was deleted.`,
            alert_status: "Cancelled",
            consultation_id,
            hosp_emp_id: existingAppointment.hosp_emp_id,
            user_id: existingAppointment.user_id,
        });
        res.status(200).json({
            success: true,
            message: "Appointment deleted successfully.",
        });
        } else {
        res.status(409).json({
            success: false,
            message: "Failed to delete appointment.",
        });
        }
    } catch (err) {
        console.error("Error in /delete-appointment:", err);
        res.status(500).json({
        success: false,
        message: err.message || "Server error while deleting appointment.",
        });
    }
})

module.exports = router;