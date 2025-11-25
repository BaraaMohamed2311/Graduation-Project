const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");

class ConsultationMethods {
    // ========================================
    //   Get Appointments Data
    // ========================================

    // ========================================
    //   Based On Title

        static async getEmployeeAppointments(hosp_emp_id) {
        const query = `
           SELECT *
            FROM consultations
            WHERE hosp_emp_id = ?
        `;
        
        const result = await executeMySqlQuery(query, [hosp_emp_id]);
        return result;
    }

    static async getPatientAppointments(patient_id) {
        const query = `
           SELECT *
            FROM consultations
            WHERE patient_id = ?
        `;
        
        const result = await executeMySqlQuery(query, [patient_id]);
        return result;
    }

    // ========================================
    //   availability Data

        static async getAllShiftAvailabilityDays(hosp_emp_id) {
            const query = `
                SELECT 
                    COALESCE(
                        NULLIF(
                            GROUP_CONCAT(
                                DISTINCT CONCAT(day_of_week, ': ', DATE_FORMAT(start_time, '%H:%i'), '-', DATE_FORMAT(end_time, '%H:%i'))
                                ORDER BY day_of_week
                                SEPARATOR '; '
                            ), 
                            ''
                        ), 
                        'None'
                    ) AS available_days
                FROM availability
                WHERE hosp_emp_id = ?
            `;
            const availability = await executeMySqlQuery(query, [hosp_emp_id]);
            return availability[0].available_days;
        }

        
    
    static async getShiftAvailability(hosp_emp_id,dayIndx) {

            // Fetch the doctor's availability for that day
            const query = `
                SELECT *
                FROM availability
                WHERE hosp_emp_id = ? AND day_of_week = ?
                LIMIT 1
            `;
            const availability = await executeMySqlQuery(query, [hosp_emp_id, dayIndx]);

            // If no availability found for that doctor/day
            return availability[0] ;

    }

    // ========================================
    //   Appointment (Consultation) Data

    static async getAppointmentAvailability(hosp_emp_id,consultation_date,start_time) {
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




    static async getSpecificAppointment(hosp_emp_id,patient_id,consultation_date,start_time) {
        let query = `
           SELECT *
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
        
        console.log("getAppointmentStatus params:", [hosp_emp_id,patient_id,consultation_date,start_time],query);
        const result = await executeMySqlQuery(query, params);
        return result[0];
    }

    static async getSpecificAppointmentByID(consultation_id) {
        let query = `
           SELECT *
            FROM consultations
            WHERE consultation_id = ?
        `;

        const result = await executeMySqlQuery(query, [consultation_id]);
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

    static async checkShiftAvailability(hosp_emp_id,dayIndx,start_time,end_time) {
        try {
            // Fetch the doctor's availability for that day
            const query = `
                SELECT start_time, end_time 
                FROM availability
                WHERE hosp_emp_id = ? AND day_of_week = ?
                LIMIT 1
            `;
            const [availability] = await executeMySqlQuery(query, [hosp_emp_id, dayIndx]);
            console.log("Fetched Availability for checkShiftAvailability:", availability,[hosp_emp_id, dayIndx]);
            // If no availability found for that doctor/day
            if (!availability) {
                return { valid: false, message: "No shift found  on the selected day." };
            }

            // Convert both DB times and given times to comparable Date objects
            const [availStart, availEnd] = [availability.start_time, availability.end_time];
            const reqStart = new Date(`1970-01-01T${start_time}`);
            const reqEnd = new Date(`1970-01-01T${end_time}`);
            const dbStart = new Date(`1970-01-01T${availStart}`);
            const dbEnd = new Date(`1970-01-01T${availEnd}`);

            // Check if the requested times are inside the available window
            if (reqStart >= dbStart && reqEnd <= dbEnd) {
                return { valid: true, message: "Requested time is within the available shift." };
            } else {
                return { valid: false, message: "Requested time is outside the doctor's shift hours." };
            }
        } catch (err) {
            console.error("Error in checkShiftAvailability:", err);
            throw err;
        }
    }



    // ========================================
    //   Insert new Booking
    // ========================================

    static async bookConsultationAppointment(hosp_emp_id, patient_id,availability_id,consultation_date,start_time,end_time) {
        try{

            if(start_time === end_time){
                throw new Error("Start time and end time cannot be the same.");
            }

            // Default end_time to one hour after start_time 
            if (!end_time && start_time) {
            let [hours, minutes, seconds] = start_time.split(":").map(Number);

            hours = (hours + 1) % 24; // handle overflow past midnight
            const pad = (n) => String(n).padStart(2, "0");

            end_time = `${pad(hours)}:${pad(minutes)}:${pad(seconds || 0)}`;
            }


        const query = `
            INSERT INTO consultations  (hosp_emp_id ,patient_id,availability_id,consultation_date,start_time,end_time,consultation_status)
            VALUES (?, ?, ?, ?, ?,?,?)
        `;

        const result = await executeMySqlQuery(query, [hosp_emp_id, patient_id,availability_id,consultation_date,start_time,end_time,"Scheduled"]);
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


    static async updateAppointmentPatient(consultation_id, patient_id) {
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

    static async deleteConsultation(consultation_id) {
        try {
            const query = `DELETE FROM consultations WHERE consultation_id = ?`;
            const result = await executeMySqlQuery(query, [consultation_id]);
            return result.affectedRows > 0;
        } catch(err) {
            console.error("Error deleting consultation method:", err);
            return false;
        }
}
}

module.exports = ConsultationMethods;