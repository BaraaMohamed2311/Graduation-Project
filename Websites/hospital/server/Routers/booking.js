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
const ConsultationMethods = require("../Utils/methods/ConsultationMethods.js");
const deletePatient = require("../Utils/ControlUsers/deletePatient.js");
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

// =================================
//  Get  Availability Details
// =================================

router.get("/get-availability",async (req,res)=>{

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

router.get("/get-appointment",async (req,res)=>{

    try {
    const {
      hosp_emp_id,
      patient_id,
      consultation_date,
      start_time
    } = req.query;

    // Validate required fields
    if (!consultation_date || !start_time) {
      return res.status(400).json({
        success: false,
        message: "consultation_date and start_time are required."
      });
    }

    // Optional validation: only doctors/surgeons can have appointments
    if (hosp_emp_id) {
      const isValid = await ConsultationMethods.isVaildEmployeeTitleForAppointments(hosp_emp_id);
      if (!isValid) {
        return res.status(403).json({
          success: false,
          message: "This employee cannot have appointments (must be Doctor or Surgeon)."
        });
      }
    }

    // Fetch the appointment
    const appointment = await ConsultationMethods.getConsultationSlot(
      hosp_emp_id,
      patient_id,
      consultation_date,
      start_time
    );
    console.log("Fetched Appointment:", appointment);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "No appointment found matching provided details."
      });
    }

    res.status(200).json({
      success: true,
      body: appointment
    });

  } catch (err) {
    console.error("Error in /get-appointment:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error while fetching appointment."
    });
  }
});

// =================================
//  Get  All Appointment
// =================================
router.get("/get-all-consultations",async (req,res)=>{
    try {
    const { user_id ,  user_email , pagination , size} = req.query;

    // Require at least one identifier
    if (!user_id ) {
      return res.status(400).json({
        success: false,
        message: "Bad Request."
      });
    }
    
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
      consultations = await ConsultationMethods.getEmployeeAppointments(user_id,parseInt(size), parseInt((pagination - 1) * size ));
      consultationsCOUNT = await ConsultationMethods.getEMPConsultationsCOUNT(user_id);
    } else if(userIsPatient){
      consultations = await ConsultationMethods.getPatientAppointments(user_id,parseInt(size), parseInt((pagination - 1) * size ));
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
router.post("/book-consultation",async (req,res)=>{
    try{
       
        const {
            hosp_emp_id,       // Doctor or Surgeon ID (from employees_hospital)
            patient_id,  // The selected availability slot
            consultation_date,
            start_time,
            end_time,
            consultation_type,
            bookedAt
        } = req.body;

        // ===1. Validate Input

        if (!hosp_emp_id || !patient_id  || !consultation_date || !start_time || !consultation_type || !bookedAt) {
            return res.status(400).json({
                success: false,
                message: "Missing required booking details."
            });
        }


        // === Ceck if consultation_date is in the past
        console.log("isDayInPast",isDayInPast(bookedAt, consultation_date))
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

        
        if(ConsultationMethods.patientHasOtherConsultationWithEmp(patient_id,hosp_emp_id)){
          return res.status(400).json({
                success: false,
                message: "You already have a consultation scheduled with this user"
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
        const userExists = await User.checkIfUserExistsById(patient_id);
        const userType = await User.getUserTypeById(patient_id);

        const userIsEmployee = userType === 'employee';

        if(!userExists || userIsEmployee){
            return res.status(404).json({
                      success:false,
                      message : "You have to register as patient before booking an appointment."
                        });
        }



      

        // === Check if patient already booked it
        const isPatientAvailable = await PatientMethods.isPatientAvailable(patient_id,consultation_date,start_time);
        console.log("isPatientAvailable",isPatientAvailable)
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
        console.log("Availability for the day:", availability);

        // ===4. Check consultation_status 

        const consultation_slot = await ConsultationMethods.getEmployeeConsultationSlot(hosp_emp_id,consultation_date,start_time);
        console.log("isSlotAvailable for the day:", consultation_slot);


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
        const isConsultationBooked = await ConsultationMethods.bookConsultationAppointment(hosp_emp_id, patient_id,availability.availability_id,consultation_date,start_time,end_time,consultation_type)
        console.log("Appointment Creation Status:", isConsultationBooked);
        if(!isConsultationBooked){
            return res.status(400).json({
                success: false,
                message: "Failed to book consultation. Please try again."
            });
        }



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
router.put("/update-appointment-status",async (req,res)=>{
        try {
        const { consultation_id, new_status } = req.body;

        // ===1. Validate inputs
        if (!consultation_id || !new_status) {
        return res.status(400).json({
            success: false,
            message: "Bad Request",
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

        // ===3. Update appointment status
        const result = await ConsultationMethods.updateAppointmentStatus(consultation_id, new_status);

        if (result) {
        res.status(200).json({
            success: true,
            message: "Appointment updated successfully.",
        });
        } else {
        res.status(500).json({
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
router.put("/update-consultation-patient",async (req,res)=>{
        try {
        const { consultation_id, patient_id } = req.body;

        // ===1. Validate inputs
        if (!consultation_id || !patient_id) {
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
        const userExists = await User.checkIfUserExistsById(patient_id);
        
        if(!userExists){
            return res.status(404).json({
                      success:false,
                      message : "Create patient before assigning to appointment."
                        });
        }

        // ===4. Update appointment patient id
        const result = await ConsultationMethods.updateConsultationPatient(consultation_id, patient_id);

        if (result) {
        res.status(200).json({
            success: true,
            message: "Appointment Patient updated successfully.",
        });
        } else {
        res.status(500).json({
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
router.put("/reschedule-appointment",async (req,res)=>{
        try {
        const { hosp_emp_id,patient_id,consultation_id, new_consultation_date , new_start_time,new_end_time } = req.body;

        // ===1. Validate inputs
        if (!consultation_id || !new_consultation_date || !new_start_time || !patient_id) {
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
        const isPatientAvailable = await PatientMethods.isPatientAvailable(patient_id,new_consultation_date,new_start_time);

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
        const dayOfWeek  = new Date(consultation_date);
        const dayOfWeekIndex = dayOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
        const availability = await ConsultationMethods.getAvailabilityDay(hosp_emp_id,dayOfWeekIndex); // Not used in this context
        console.log("Availability for the day:", availability);

        // ===4. Check consultation_status 

        const consultation_slot = await ConsultationMethods.getEmployeeConsultationSlot(hosp_emp_id,new_consultation_date,new_start_time);
        console.log("isSlotAvailable for the day:", consultation_slot);


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
        res.status(200).json({
            success: true,
            message: "Appointment rescheduled successfully.",
        });
        } else {
        res.status(500).json({
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
router.delete("/delete-appointment",async (req,res)=>{
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
        if(existingAppointment.hosp_emp_id !== parseInt(user_id) && existingAppointment.patient_id !== parseInt(user_id)){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this appointment.",
            });
        }
        // ===2. delete appointment
        const result = await ConsultationMethods.deleteConsultation(consultation_id);

        if (result) {
        res.status(200).json({
            success: true,
            message: "Appointment deleted successfully.",
        });
        } else {
        res.status(500).json({
            success: false,
            message: "Failed to deleted appointment.",
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


