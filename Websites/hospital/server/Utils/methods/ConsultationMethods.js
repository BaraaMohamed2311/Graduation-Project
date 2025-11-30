const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const AvailabilityService = require("./AvailabilityMethods")
class ConsultationMethods {
    // ========================================
    //   COUNT Data
    // ========================================
    static async getEMPConsultationsCOUNT(hosp_emp_id){
        const query = `
        SELECT 
             COUNT(*) AS consultations_count
            FROM consultations
            WHERE hosp_emp_id = ?`

        const result = await executeMySqlQuery(query,[hosp_emp_id]);

        return result[0]?.consultations_count
    }

    static async getPATConsultationsCOUNT(patient_id){
        const query = `
        SELECT 
             COUNT(*) AS consultations_count
            FROM consultations
            WHERE patient_id = ?`

        const result = await executeMySqlQuery(query,[patient_id]);

        return result[0]?.consultations_count
    }

    // ========================================
    //   Based On Title

        static async getEmployeeAppointments(hosp_emp_id,limit=null,offset=null) {

        let query = `
            SELECT 
             *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE hosp_emp_id = ?
        `;
        if(limit && offset) query += ` limit ${limit} offset ${offset}`
        
        const result = await executeMySqlQuery(query, [hosp_emp_id]);
        return result;

        
    }

    static async getPatientAppointments(patient_id,limit=null,offset=null) {
        let query = `
           SELECT 
            *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE patient_id = ?
        `;
        if(limit && offset) query += `limit ${limit} offset ${offset}`

        const result = await executeMySqlQuery(query, [patient_id]);
        return result;
    }

    // ========================================
    //   availability Data

        static async getAllAvailabilityDays(hosp_emp_id) {
            return AvailabilityService.getAllAvailabilityDays(hosp_emp_id);
        }

        
    
    static async getAvailabilityDay(hosp_emp_id,dayIndx) {

            return  AvailabilityService.getAvailabilityDay(hosp_emp_id,dayIndx);

    }

    // ========================================
    //   Appointment (Consultation) Data

    static async getConsultionStatus(hosp_emp_id,consultation_date,start_time) {
        const query = `
           SELECT consultation_status
            FROM consultations
            WHERE hosp_emp_id = ?
            AND consultation_date = ?
            AND start_time = ?
        `;
        
        const result = await executeMySqlQuery(query, [hosp_emp_id,consultation_date,start_time]);
        return result[0]?.consultation_status || "Available";
    }




    static async getConsultationSlot(hosp_emp_id,patient_id,consultation_date,start_time) {
        let query = `
           SELECT 
             *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE consultation_date = ? AND start_time = ?
        `;
        let params = [consultation_date, start_time];

        if(hosp_emp_id){
            query += ` AND hosp_emp_id = ? `;
            params.push(hosp_emp_id);
        }

        if(patient_id){
            query += ` AND patient_id = ? `;
            params.push(patient_id);
        }
        
        const result = await executeMySqlQuery(query, params);
        return result[0];
    }

    static async getConsultationById(consultation_id) {
        let query = `
           SELECT 
            *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE consultation_id = ?
        `;

        const result = await executeMySqlQuery(query, [consultation_id]);
        return result[0];
    }

    static async getEmployeeConsultationSlot(hosp_emp_id,consultation_date,start_time) {
        let query = `
           SELECT 
            *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE consultation_date = ? AND start_time = ?
        `;
        let params = [consultation_date, start_time];

        if(hosp_emp_id){
            query += ` AND hosp_emp_id = ? `;
            params.push(hosp_emp_id);
        }

        const result = await executeMySqlQuery(query, params);
        return result[0];
    }



    // ========================================
    //   Check Appointments Booking
    // ========================================

    static async isVaildEmployeeTitleForAppointments(hosp_emp_id){
        const query = `SELECT emp_title
                    FROM employees_hospital
                    WHERE hosp_emp_id = ? 
                    AND emp_title IN ('Doctor', 'Surgeon')`;

        const result = await executeMySqlQuery(query, [hosp_emp_id]);

        return result.length > 0;

    }
    // slot refers to consultions table not availability
    static async isSlotWithinAvailability(availability,requested_start_Slot ,requested_end_Slot,requested_consultion_date) {
        try {
            
            // Request's start and end slots
            const dateISO = new Date(requested_consultion_date).toISOString();
            const dateOnly = dateISO.split("T")[0];
            console.log("availability",availability,"requested_start_Slot",requested_start_Slot,"requested_end_Slot",requested_end_Slot,"dateOnly",dateOnly)
            const reqStart = new Date(`${dateOnly}T${requested_start_Slot}`);
            const reqEnd = new Date(`${dateOnly}T${requested_end_Slot}`);
            // Shift's availability hours
            const avStart = new Date(`${dateOnly}T${availability.start_time}`);
            const avEnd = new Date(`${dateOnly}T${availability.end_time}`);
            console.log("reqStart",reqStart,"reqEnd",reqEnd,"avStart",avStart,"avEnd",avEnd)
            // Check if the requested times are inside the available window
            if (reqStart >= avStart && reqEnd <= avEnd) {
                return true;
            } else {
                return  false;
            }
        } catch (err) {
            console.error("Error in checkShiftAvailability:", err);
            throw err;
        }
    }


    static async isConsultionAvailable(availability , consultation_slot){
        // ====1. First Check availability of shift and is slot within it

            if (!availability) return false;
            // Consultion could not be inserted to the table yet, and that's why it's undefined
            if (!consultation_slot) return true;

            const isSlotWithinShift = await this.isSlotWithinAvailability(availability,consultation_slot.start_time,consultation_slot.end_time,consultation_slot.consultation_date);
            console.log("isSlotWithinShift",isSlotWithinShift)
            if( !isSlotWithinShift) return false;

        // ====2.Now if Slot Consultion is free
        // if available check if scheduled
            if(consultation_slot && consultation_slot.consultation_status === "Scheduled") return false;
            
            
            
            
    }

    static async patientHasOtherConsultationWithEmp(patient_id,hosp_emp_id){
        const query = `SELECT 
             *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE patient_id = ? AND hosp_emp_id = ? AND consultation_status = 'Scheduled' AND CURDATE() <  consultation_date`

        const result = await executeMySqlQuery(query,[patient_id,hosp_emp_id]);

        return result.length > 0 
    }


    // ========================================
    //   Insert new Booking
    // ========================================

    static async bookConsultationAppointment(hosp_emp_id, patient_id,availability_id,consultation_date,start_time,end_time,consultation_type) {
        try{

            if(start_time === end_time){
                throw new Error("Start time and end time cannot be the same.");
            }

            if(!consultation_type){
                throw new Error("Booking type must be provided");
            }

            // Default end_time to one hour after start_time 
            if (!end_time && start_time) {
            let [hours, minutes, seconds] = start_time.split(":").map(Number);

            hours = (hours + 1) % 24; // handle overflow past midnight
            const pad = (n) => String(n).padStart(2, "0");

            end_time = `${pad(hours)}:${pad(minutes)}:${pad(seconds || 0)}`;
            }


        const query = `
            INSERT INTO consultations  (hosp_emp_id ,patient_id,availability_id,consultation_date,start_time,end_time,consultation_status,consultation_type)
            VALUES (?, ?, ?, ?, ?,?,?,?)
        `;

        const result = await executeMySqlQuery(query, [hosp_emp_id, patient_id,availability_id,consultation_date,start_time,end_time,"Scheduled",consultation_type]);
        return result.affectedRows > 0;;
        }
        catch(err){
            console.error("Error Booking appointment method:", err);
            return false;
            
        }
    }

    // ========================================
    //   Update Appointments Booking
    // ========================================


    static async updateAppointmentStatus(consultation_id, new_status) {
        try{
            const query = `
           UPDATE consultations
            SET 
            consultation_status = ?
            WHERE consultation_id = ? 
        `;

        const result = await executeMySqlQuery(query, [new_status,consultation_id]);
        return result.affectedRows > 0;;
        }
        catch(err){
            console.error("Error updating appointment consultation_status method:", err);
            return false;
            
        }
        
    }


    static async updateConsultationPatient(consultation_id, patient_id) {
        try{
            const query = `
           UPDATE consultations
            SET 
            patient_id = ?
            WHERE consultation_id = ? 
        `;

        const result = await executeMySqlQuery(query, [patient_id,consultation_id]);
        return result.affectedRows > 0;;
        }
        catch(err){
            console.error("Error updating appointment consultation_status method:", err);
            return false;
            
        }
        
    }

    


    static async updateAppointmentSchedule(consultation_id, availability_id,consultation_date,start_time,end_time) {
        try{
            if(start_time === end_time){
                throw new Error("Start time and end time cannot be the same.");
            }
            const query = `
           UPDATE consultations
            SET 
            availability_id = ? ,
            consultation_date = ? ,
            start_time = ? ,
            end_time = ?
            WHERE consultation_id = ? 
        `;

        const result = await executeMySqlQuery(query, [availability_id,consultation_date,start_time,end_time,consultation_id]);
        return result.affectedRows > 0;;
        }
        catch(err){
            console.error("Error updating appointment consultation_status method:", err);
            return false;
            
        }
        
    }

    // ========================================
    //   Delete Appointment
    // ========================================


 // deletes all consultations on specific day
static async deleteEmpConsultation(hosp_emp_id , consultation_date) {

            const query = `DELETE FROM consultations WHERE hosp_emp_id = ? AND consultation_date = ?`;
            const result = await executeMySqlQuery(query, [hosp_emp_id , consultation_date]);
            return result.affectedRows > 0;

    }

    // deletes specific consultation with specific employee on specific date
    static async deleteConsultation(patient_id , hosp_emp_id , consultation_date) {

            const query = `DELETE FROM consultations WHERE patient_id = ? AND hosp_emp_id = ? AND consultation_date = ?`;
            const result = await executeMySqlQuery(query, [patient_id , hosp_emp_id,consultation_date]);
            return result.affectedRows > 0;

    }
    // deletes all consultations on specific day
    static async deletePatAllConsultation(patient_id , consultation_date) {

            const query = `DELETE FROM consultations WHERE patient_id = ? AND consultation_date = ?`;
            const result = await executeMySqlQuery(query, [patient_id,consultation_date]);
            return result.affectedRows > 0;

    }
}

module.exports = ConsultationMethods;