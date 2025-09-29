const executeMySqlQuery = require("../executeMySqlQuery");
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const PatientMethods = require("./PatientMethods");
class RoomsMethods {
    // ============================
    //              GET
    // ============================

    static async getRooms(){
        const query = `SELECT * FROM rooms `;
        const result = await executeMySqlQuery(query);
        return result;
    }

    static async getEmptyRooms(){
        const query = `SELECT * FROM rooms WHERE patient_id IS NULL AND isOccupied = FALSE `;
        const result = await executeMySqlQuery(query);
        return result;
    }

    static async getOccupiedRooms(){
        const query = `SELECT * FROM rooms WHERE patient_id IS NOT NULL AND isOccupied = TRUE `;
        const result = await executeMySqlQuery(query);
        return result;
    }

    static async getRoomsByFloor(floor_id){
        const query = `SELECT * FROM rooms WHERE  floor_id = ?`;
        const result = await executeMySqlQuery(query,[floor_id]);
        return result;
    }

    static async getRoomByPatient(patient_id){
        const query = `SELECT * FROM rooms WHERE patient_id = ?`;
        const result = await executeMySqlQuery(query,[patient_id]);
        return result[0];
    }

    static async getRoomByRoomID(room_id){
        const query = `SELECT * FROM rooms WHERE room_id = ? `;
        const result = await executeMySqlQuery(query,[room_id]);
        if(result.length === 0) return null;
        return result[0];
    }

    static async isRoomOccupied(room_id){
        const query = `SELECT isOccupied FROM rooms WHERE room_id = ? `;
        const result = await executeMySqlQuery(query,[room_id]);
        if(result.length === 0) return null;
        return result[0].isOccupied;
    }

    

    
    static async getPatientInRoom(patient_id){

        return await PatientMethods.getPatientSpecificData(patient_id);
    }
    // ============================
    //              Update
    // ============================
    static async assignPatientToRoom(patient_id,room_id) {
        try{
            const query = `
                UPDATE rooms
                SET 
                    isOccupied = TRUE,
                    patient_id = ?
                WHERE room_id = ?;
            `;
            await executeMySqlQuery(query,[patient_id,room_id]);
            return true;
        }
        catch(err){
            console.error("Error updating nurse data:", err);
            return false;
        }
                
        }

        static async emptyRoom(room_id) {
        try{
            
                const query = `
            UPDATE rooms
            SET isOccupied = FALSE,
                patient_id = NULL
            WHERE room_id = ?;
        `;
            await executeMySqlQuery(query,[room_id]);
            return true;
        }
        catch(err){
            console.error("Error updating nurse data:", err);
            return false;
        }
                
        }



}

module.exports = RoomsMethods;