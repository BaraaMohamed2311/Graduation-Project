const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const AvailabilityMethods = require("./AvailabilityMethods")
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

    static async getPATConsultationsCOUNT(user_id){
        const query = `
        SELECT 
             COUNT(*) AS consultations_count
            FROM consultations
            WHERE user_id = ?`

        const result = await executeMySqlQuery(query,[user_id]);

        return result[0]?.consultations_count
    }

    // ========================================
    //   Based On Title

       static async getEmployeeAppointments(hosp_emp_id, limit = null, offset = null, filtering_string = null, orderByClause = null) {
    
            let query = `
                SELECT 
                    *,
                    DATE_FORMAT(start_time, '%H:%i') AS start_time,
                    DATE_FORMAT(end_time, '%H:%i') AS end_time
                FROM consultations
                WHERE hosp_emp_id = ?
            `;
            
            const params = [hosp_emp_id];
            
            // Add filtering_string with AND if provided
            if (filtering_string && filtering_string.trim()) {
                query += ` AND ${filtering_string}`;
            }
            
            // Add ORDER BY clause if provided
            if (orderByClause && orderByClause.trim()) {
                query += ` ${orderByClause}`;
            }
            
            // Add LIMIT and OFFSET
            if (limit !== null && offset !== null) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(limit, offset);
            } else if (limit !== null) {
                query += ` LIMIT ?`;
                params.push(limit);
            }
            
            const result = await executeMySqlQuery(query, params);
            return result;
        }

    static async getPatientAppointments(user_id, limit = null, offset = null, filtering_string = null, orderByClause = null) {
    
            let query = `
                SELECT 
                    *,
                    DATE_FORMAT(start_time, '%H:%i') AS start_time,
                    DATE_FORMAT(end_time, '%H:%i') AS end_time
                FROM consultations
                WHERE user_id = ?
            `;
            
            const params = [user_id];
            
            // Add filtering_string with AND if provided
            if (filtering_string && filtering_string.trim()) {
                query += ` AND ${filtering_string}`;
            }
            
            // Add ORDER BY clause if provided
            if (orderByClause && orderByClause.trim()) {
                query += ` ${orderByClause}`;
            }
            
            // Add LIMIT and OFFSET if provided
            if (limit !== null && offset !== null) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(limit, offset);
            } else if (limit !== null) {
                query += ` LIMIT ?`;
                params.push(limit);
            }
            
            const result = await executeMySqlQuery(query, params);
            return result;
        }

    static async getEmployeeAppointment(hosp_emp_id) {

        let query = `
            SELECT 
             *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE hosp_emp_id = ?
        `;

        
        const result = await executeMySqlQuery(query, [hosp_emp_id]);
        return result[0];

        
    }

    static async getPatientAppointment(user_id) {
        let query = `
           SELECT 
            *,
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i')   AS end_time
            FROM consultations
            WHERE user_id = ?
        `;


        const result = await executeMySqlQuery(query, [user_id]);
        return result[0];
    }

    // ========================================
    //   availability Data

        static async getAllAvailabilityDays(hosp_emp_id) {
            return AvailabilityMethods.getAllAvailabilityDays(hosp_emp_id);
        }

        
    
    static async getAvailabilityDay(hosp_emp_id,dayIndx) {

            return  AvailabilityMethods.getAvailabilityDay(hosp_emp_id,dayIndx);

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




    static async getConsultationSlot(hosp_emp_id,user_id,consultation_date,start_time) {
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

        if(user_id){
            query += ` AND user_id = ? `;
            params.push(user_id);
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

            const reqStart = new Date(`${dateOnly}T${requested_start_Slot}`);
            const reqEnd = new Date(`${dateOnly}T${requested_end_Slot}`);
            // Shift's availability hours
            const avStart = new Date(`${dateOnly}T${availability.start_time}`);
            const avEnd = new Date(`${dateOnly}T${availability.end_time}`);

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

            if( !isSlotWithinShift) return false;

        // ====2.Now if Slot Consultion is free
        // if available check if scheduled
            if(consultation_slot && consultation_slot.consultation_status === "Scheduled") return false;
            
            
            
            
    }

    static async patientHasOtherConsultationWithEmp(user_id,hosp_emp_id){
        const query = `SELECT 
             *
            from consultations WHERE user_id = ? AND hosp_emp_id = ? AND consultation_status = 'Scheduled'`

        const result = await executeMySqlQuery(query,[user_id,hosp_emp_id]);

        return result.length > 0 
    }


    // ========================================
    //   Insert new Booking
    // ========================================

    static async bookConsultationAppointment(hosp_emp_id, user_id,availability_id,consultation_date,start_time,end_time,consultation_type) {
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
            INSERT INTO consultations  (hosp_emp_id ,user_id,availability_id,consultation_date,start_time,end_time,consultation_status,consultation_type)
            VALUES (?, ?, ?, ?, ?,?,?,?)
        `;

        const result = await executeMySqlQuery(query, [hosp_emp_id, user_id,availability_id,consultation_date,start_time,end_time,"Scheduled",consultation_type]);
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


    static async updateConsultationPatient(consultation_id, user_id) {
        try{
            const query = `
           UPDATE consultations
            SET 
            user_id = ?
            WHERE consultation_id = ? 
        `;

        const result = await executeMySqlQuery(query, [user_id,consultation_id]);
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
    static async deleteConsultation(consultation_id) {

            const query = `DELETE FROM consultations WHERE consultation_id = ?`;
            const result = await executeMySqlQuery(query, [consultation_id]);

            return result.affectedRows > 0;

    }
    // deletes all consultations on specific day
    static async deletePatAllConsultation(user_id , consultation_date) {

            const query = `DELETE FROM consultations WHERE user_id = ? AND consultation_date = ?`;
            const result = await executeMySqlQuery(query, [user_id,consultation_date]);
            return result.affectedRows > 0;

    }
}

module.exports = ConsultationMethods;