const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const sqlTransaction = require("../sqlTransaction")
class AvailabilityMethods {
    

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


static async updateAvailability(hosp_emp_id, availabilityString) {
        console.log("Updating availability for hosp_emp_id:", hosp_emp_id);
        console.log("New availability string:", availabilityString);
        const availabilityEntries = availabilityString
            .split(';')
            .map(entry => entry.trim())
            .filter(Boolean);

        if (availabilityEntries.length === 0) {
            throw new Error('No availability data provided');
        }

        const transactionQueries = [];
        const allDayIndices = [];

        // Parse entries
        const parsedEntries = [];
        availabilityEntries.forEach(entry => {
            const colonIndex = entry.indexOf(':');
            if (colonIndex === -1) return;

            const dayIndx = parseInt(entry.slice(0, colonIndex).trim());
            const timeRange = entry.slice(colonIndex + 1).trim();

            if (isNaN(dayIndx) || !timeRange) return;

            const [start_time, end_time] = timeRange.split('-').map(t => t.trim());

            if (!start_time || !end_time) return;

            allDayIndices.push(dayIndx);
            parsedEntries.push({ dayIndx, start_time, end_time });
        });

        // Delete existing availability
        transactionQueries.push(
            `DELETE FROM availability WHERE hosp_emp_id = ${hosp_emp_id}`
        );

        // Insert new availability
        parsedEntries.forEach(({ dayIndx, start_time, end_time }) => {
            transactionQueries.push(`
                INSERT INTO availability (hosp_emp_id, day_of_week, start_time, end_time)
                VALUES (${hosp_emp_id}, ${dayIndx}, '${start_time}', '${end_time}')
            `);
        });

        const result = await sqlTransaction(transactionQueries);

        return result
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

module.exports = AvailabilityMethods;