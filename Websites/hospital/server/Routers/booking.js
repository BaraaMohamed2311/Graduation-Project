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
const ConsultionMethods = require("../Utils/methods/ConsultionMethods.js");
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
const myCache = new NodeCache({ stdTTL: 3600 }); // default TTL 1hr

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
      const isValid = await HospitalUsersMethods.isVaildEmployeeTitleForAppointments(hosp_emp_id);
      if (!isValid) {
        return res.status(403).json({
          success: false,
          message: "This employee cannot have appointments (must be Doctor or Surgeon)."
        });
      }
    }

    // Fetch the appointment
    const appointment = await ConsultionMethods.getSpecificAppointment(
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
      data: appointment
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
router.get("/get-all-appointments",async (req,res)=>{
    try {
    const { user_id ,  user_email} = req.query;

    // Require at least one identifier
    if (!user_id ) {
      return res.status(400).json({
        success: false,
        message: "Bad Request."
      });
    }

    let appointments;

        // --2. See if user exists at one of the tables
        const query_emp = `SELECT EXISTS(SELECT * FROM employees WHERE emp_email =?) AS data_exists`
        const userIsEmployee = await isExist(query_emp,[user_email]);
        // search for user inside patients table
        const query_pat = `SELECT EXISTS(SELECT * FROM patients WHERE patient_email =?) AS data_exists`
        const userIsPatient = await isExist(query_pat,[user_email]);


    if (userIsEmployee) {

      appointments = await ConsultionMethods.getEmployeeAppointments(user_id);
    } else if(userIsPatient){
      appointments = await ConsultionMethods.getPatientAppointments(user_id);
    }

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found."
      });
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (err) {
    console.error("Error in /get-all-appointments:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error while fetching appointments."
    });
  }
});


// =================================
//    Schedule an Appointment
// =================================
router.post("/book-appointment",async (req,res)=>{
    try{
       
        const {
            hosp_emp_id,       // Doctor or Surgeon ID (from employees_hospital)
            patient_id,  // The selected availability slot
            consultation_date,
            start_time,
            end_time
        } = req.body;

        // ===1. Validate Input

        if (!hosp_emp_id || !patient_id  || !consultation_date || !start_time) {
            return res.status(400).json({
                success: false,
                message: "Missing required booking details."
            });
        }


        // ===2. Check employee eligibility
        const isValidEmp = await ConsultionMethods.isVaildEmployeeTitleForAppointments(hosp_emp_id);


        if(!isValidEmp){
            return res.status(400).json({
                success: false,
                message: "Invalid employee for booking consultation."
            });
        }

        // ===3. Check if new patient exists 
        const query_pat = `SELECT EXISTS(SELECT * FROM patients WHERE patient_id =?) AS data_exists`
        const userIsPatient = await isExist(query_pat,[patient_id]);
        
        if(!userIsPatient.exists){
          return res.status(404).json({
              success:false,
              message : "Patient Not Found"
              });
        }

        // === Get day of week from date
        const dayOfWeek  = getDayOfWeekByDate(consultation_date);
        console.log("Day of Week:", dayOfWeek);

        // ===3. Check shift availability if vaild get availability details
        const isShiftAvailable = await ConsultionMethods.checkShiftAvailability(hosp_emp_id,dayOfWeek,start_time,end_time);

        if(!isShiftAvailable.valid){
            return res.status(400).json({
                success: false,
                message: isShiftAvailable.message
            });
        }
        

        const availability = await ConsultionMethods.getShiftAvailability(hosp_emp_id,dayOfWeek); // Not used in this context
        console.log("Availability for the day:", availability);

        // ===4. Check consultion state

        const isSlotAvailable = await ConsultionMethods.getAppointmentAvailability(hosp_emp_id,consultation_date,start_time);
        console.log("isSlotAvailable for the day:", isSlotAvailable);
        if(!isSlotAvailable || (isSlotAvailable !== "Available" && isSlotAvailable !== "Completed" && isSlotAvailable !== "Cancelled")){
            return res.status(400).json({
                success: false,
                message: "Selected slot is busy."
            });
        }




        
        // =============================
        // ====6. Create Consultation Entry
        // =============================
        const isAppointmentCreated = await ConsultionMethods.bookConsultionAppointment(hosp_emp_id, patient_id,availability.availability_id,consultation_date,start_time,end_time)
        console.log("Appointment Creation Status:", isAppointmentCreated);
        if(!isAppointmentCreated){
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
        console.error("Error Booking Consultion",err);
        res.status(500).json({
            success:false,
            message: err.message || "Error Booking Consultion"
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

        const existingAppointment = await ConsultionMethods.getSpecificAppointmentByID(consultation_id);
        if (!existingAppointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found.",
        });
        }

        // ===3. Update appointment status
        const result = await ConsultionMethods.updateAppointmentStatus(consultation_id, new_status);

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
router.put("/update-appointment-patient",async (req,res)=>{
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

        const existingAppointment = await ConsultionMethods.getSpecificAppointmentByID(consultation_id);
        if (!existingAppointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found.",
        });
        }

        // ===3. Check if new patient exists 
        const query_pat = `SELECT EXISTS(SELECT * FROM patients WHERE patient_id =?) AS data_exists`
        const userIsPatient = await isExist(query_pat,[patient_id]);
        
        if(!userIsPatient.exists){
          return res.status(404).json({
              success:false,
              message : "Create patient before assigning to appointment."
              });
        }

        // ===4. Update appointment patient id
        const result = await ConsultionMethods.updateAppointmentPatient(consultation_id, patient_id);

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
        const { hosp_emp_id,consultation_id, new_consultation_date , new_start_time,new_end_time } = req.body;

        // ===1. Validate inputs
        if (!consultation_id || !new_consultation_date || !new_start_time) {
        return res.status(400).json({
            success: false,
            message: "Bad Request",
        });
        }



        // ===2. check if appointment exists before updating

        const existingAppointment = await ConsultionMethods.getSpecificAppointmentByID(consultation_id);
        if (!existingAppointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found.",
        });
        }

        // ===3.  Chech new Schedule Availability
        // === Get day of week from date
        const dayOfWeek  = getDayOfWeekByDate(new_consultation_date);
        console.log("Day of Week:", dayOfWeek);

        // ===3. Check shift availability if vaild get availability details
        const isShiftAvailable = await ConsultionMethods.checkShiftAvailability(hosp_emp_id,dayOfWeek,new_start_time,new_end_time);

        if(!isShiftAvailable.valid){
            return res.status(400).json({
                success: false,
                message: isShiftAvailable.message
            });
        }
        

        const availability = await ConsultionMethods.getShiftAvailability(hosp_emp_id,dayOfWeek); // Not used in this context
        console.log("Availability for the day:", availability);

        // ===4. Check consultion state

        const isSlotAvailable = await ConsultionMethods.getAppointmentAvailability(hosp_emp_id,new_consultation_date,new_start_time);
        console.log("isSlotAvailable for the day:", isSlotAvailable);
        if(!isSlotAvailable || (isSlotAvailable !== "Available" && isSlotAvailable !== "Completed" && isSlotAvailable !== "Cancelled")){
            return res.status(400).json({
                success: false,
                message: "Selected slot is busy."
            });
        }

        // ===5. Reschedule Appointment
        const result = await ConsultionMethods.updateAppointmentSchedule(consultation_id, availability.availability_id,new_consultation_date , new_start_time,new_end_time);

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
        const existingAppointment = await ConsultionMethods.getSpecificAppointmentByID(consultation_id);
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
        const result = await ConsultionMethods.deleteConsultation(consultation_id);

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


