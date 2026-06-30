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
        const query = `SELECT COUNT(*) as count FROM rooms WHERE user_id IS NULL AND isOccupied = FALSE `;
        const result = await executeMySqlQuery(query);
        return result[0]?.count;
    }

    static async getOccupiedRoomsCOUNT(){
        const query = `SELECT COUNT(*) as count FROM rooms WHERE user_id IS NOT NULL AND isOccupied = TRUE `;
        const result = await executeMySqlQuery(query);
        return result[0]?.count;
    }
    // ============================
    //              GET
    // ============================

    static async getRooms(limit=null,offset=null, whereClause=""){
        let query = `
        SELECT 
            r.*,       -- all columns from rooms
            f.floor_number
        FROM rooms r
        JOIN floors f ON r.floor_id = f.floor_id  ${whereClause} `;
        const params = [];
        if(limit > 0 && offset != null ) {
            query += ` limit ? offset ?`
            params.push(limit, offset);
        }

        
        const result = await executeMySqlQuery(query,params);
        return result;
    }

    static async getEmptyRooms(limit=null,offset=null){
        let query = `SELECT * FROM rooms WHERE user_id IS NULL AND isOccupied = FALSE `;
        const params = [];
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }

        const result = await executeMySqlQuery(query,params);


        return result;
    }

    static async getOccupiedRooms(limit=null,offset=null){
        let query = `SELECT * FROM rooms WHERE user_id IS NOT NULL AND isOccupied = TRUE `;
        const params = [];
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }
        const result = await executeMySqlQuery(query,params);
        return result;
    }

    static async getRoomsByFloor(floor_number,limit=null,offset=null , status){
        let query = `SELECT * FROM rooms `;
        if(status === "occupied"){
            query+= `WHERE  floor_number = ? AND  isOccupied = TRUE `
        }
        else if (status === "empty"){
            query+= `WHERE  floor_number = ? AND  isOccupied = FALSE `
        }
        else{
            query+= `WHERE  floor_number = ?`
        }
        const params = [floor_number];
        if(limit > 0 && offset != null ) {
            query += `limit ? offset ?`
            params.push(limit, offset);
        }

        const result = await executeMySqlQuery(query,params);
        return result;
    }

    static async getRoomByPatient(user_id){
        const query = `SELECT * FROM rooms WHERE user_id = ?`;
        const result = await executeMySqlQuery(query,[user_id]);
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

    

    
    static async getPatientInRoom(user_id){

        return await PatientMethods.getPatientSpecificData(user_id);
    }
    // ============================
    //              Update
    // ============================
    static async assignPatientToRoom(user_id,room_id) {
        try{
            const query = `
                UPDATE rooms
                SET 
                    isOccupied = TRUE,
                    user_id = ?
                WHERE room_id = ?;
            `;
            const result = await executeMySqlQuery(query, [user_id, room_id]);

            return result.affectedRows > 0;
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
                user_id = NULL
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