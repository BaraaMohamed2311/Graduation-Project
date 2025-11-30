const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const sqlTransaction = require("../sqlTransaction")
class AvailabilityService {
    

    // ========================================
    //   availability Data

        static async getAllAvailabilityDays(hosp_emp_id) {
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

        
    
    static async getAvailabilityDay(hosp_emp_id,dayIndx) {

            // Fetch the doctor's availability for that day
            const query = `
                SELECT 
                 *,
                DATE_FORMAT(start_time, '%H:%i') AS start_time,
                DATE_FORMAT(end_time, '%H:%i')   AS end_time
                FROM availability
                WHERE hosp_emp_id = ? AND day_of_week = ?
                LIMIT 1
            `;
            const availability = await executeMySqlQuery(query, [hosp_emp_id, dayIndx]);

            // If no availability found for that doctor/day
            return availability[0] ;

    }


    // ========================================
    //   Update Availability Day
    // ========================================


static async updateAvailabilityDay(hosp_emp_id,dayIndx , updating_string) {

            // Fetch the doctor's availability for that day
            const query = `
                UPDATE availability
                    ${updating_string}
                    WHERE hosp_emp_id = ? AND day_of_week =?;
            `;
            const availability = await executeMySqlQuery(query , [hosp_emp_id, dayIndx]);

            // If no availability found for that doctor/day
            return availability[0].affectedRows >0 ;

    }


    


    // ========================================
    //   Delete Availability
    // ========================================

    static async deleteAvailability(hosp_emp_id , dayIndx) {

            const query = `DELETE FROM availability WHERE hosp_emp_id = ? AND day_of_week = ?`;
            const result = await executeMySqlQuery(query, [hosp_emp_id , dayIndx]);
            return result.affectedRows > 0;

    }

    static async deleteAllAvailability(hosp_emp_id) {

            const query = `DELETE FROM availability WHERE hosp_emp_id = ? `;
            const result = await executeMySqlQuery(query, [hosp_emp_id]);
            return result.affectedRows > 0;

    }
}

module.exports = AvailabilityService;