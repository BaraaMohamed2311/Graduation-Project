const executeMySqlQuery = require("../executeMySqlQuery");
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const PatientMethods = require("./PatientMethods");
class RoomsMethods {

    // ============================
    //              COUNT
    // ============================

    static async getAllRoomsCOUNT(){
        const query = `SELECT COUNT(*) as count FROM rooms `;
        const result = await executeMySqlQuery(query);
        return result[0]?.count;
    }

    static async getEmptyRoomsCOUNT(){
        const query = `SELECT COUNT(*) as count FROM rooms WHERE patient_id IS NULL AND isOccupied = FALSE `;
        const result = await executeMySqlQuery(query);
        return result[0]?.count;
    }

    static async getOccupiedRoomsCOUNT(){
        const query = `SELECT COUNT(*) as count FROM rooms WHERE patient_id IS NOT NULL AND isOccupied = TRUE `;
        const result = await executeMySqlQuery(query);
        return result[0]?.count;
    }
    // ============================
    //              GET
    // ============================

    static async getRooms(limit=null,offset=null){
        let query = `SELECT * FROM rooms `;
        const params = [];
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }
        
        const result = await executeMySqlQuery(query,params);
        return result;
    }

    static async getEmptyRooms(limit=null,offset=null){
        let query = `SELECT * FROM rooms WHERE patient_id IS NULL AND isOccupied = FALSE `;
        const params = [];
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }

        const result = await executeMySqlQuery(query,params);


        return result;
    }

    static async getOccupiedRooms(limit=null,offset=null){
        let query = `SELECT * FROM rooms WHERE patient_id IS NOT NULL AND isOccupied = TRUE `;
        const params = [];
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }
        const result = await executeMySqlQuery(query,params);
        return result;
    }

    static async getRoomsByFloor(floor_id,limit=null,offset=null , status){
        let query = `SELECT * FROM rooms `;
        if(status === "occupied"){
            query+= `WHERE  floor_id = ? AND  isOccupied = TRUE `
        }
        else if (status === "empty"){
            query+= `WHERE  floor_id = ? AND  isOccupied = FALSE `
        }
        else{
            query+= `WHERE  floor_id = ?`
        }
        const params = [floor_id];
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }
        const result = await executeMySqlQuery(query,params);
        return result;
    }

    static async getRoomByPatient(patient_id){
        const query = `SELECT * FROM rooms WHERE patient_id = ?`;
        const result = await executeMySqlQuery(query,[patient_id]);
        return result[0];
    }

    static async getRoomsByRoomsNumber(room_number,limit=null,offset=null , status){
        let query = `SELECT * FROM rooms `;
        const params = [room_number];
        if(status === "occupied"){
            query+= `WHERE  room_number = ? AND  isOccupied = TRUE `
        }
        else if (status === "empty"){
            query+= `WHERE  room_number = ? AND  isOccupied = FALSE `
        }
        else{
            query+= `WHERE  room_number = ?`
        }
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }
        const result = await executeMySqlQuery(query,params);
        return result;
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