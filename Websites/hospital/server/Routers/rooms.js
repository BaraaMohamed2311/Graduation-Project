const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const RoomsMethods = require("../Utils/methods/RoomsMethods.js");
const cacheCountNodeCache = require("../Utils/cacheCountNodeCache.js");
const JoinFiltering = require("../Utils/JoinFiltering.js");
const AuditLogs = require("../Utils/methods/AuditLogs.js");
const extractUserFromToken = require("../Utils/extractUserFromToken.js");
const User = require("../Classes/User.js");
// ============================
//              GET
// ============================

// Get all rooms
router.get("/",jwtVerify, async function (req, res) {
    try {
        const {pagination, size,...restFilters} = req.query;

        if (!pagination || !size )  return res.status(400).json({success:false,message:"Bad Request"});

        const tokenFields = extractUserFromToken(req);

        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }

        

        // Check if we have any filters
            const isFiltered = Object.keys(restFilters).length > 0;

            // Build the filtering clause if needed
            let whereClause = "";

            if (isFiltered) {
            const filterClauses = [];

            // Iterate through each filter entry
            Object.entries(restFilters).forEach(([key, value]) => {
                if (value === undefined || value === null || value === "") return; // skip empty filters

                // Determine which table alias to use
                const tableAlias = (key === "floor_number") ? "f" : "r";

                // Use your JoinFiltering helper, passing the key/value pair and table alias
                // Assuming JoinFiltering can take something like [['floor_number', 2]] and alias
                filterClauses.push(JoinFiltering([[key, value]], tableAlias));
            });

            if (filterClauses.length > 0) {
                // Combine all individual filters with AND
                whereClause = `WHERE ${filterClauses.join(" AND ")}`;
            }
            }


        const rooms = await RoomsMethods.getRooms(parseInt(size) , parseInt((pagination - 1) * size),whereClause);

        // get cached count 
        const RoomsCount = await cacheCountNodeCache("totalNumOfRooms",RoomsMethods.getAllRoomsCOUNT,whereClause,isFiltered)
        const numOfPages = Math.ceil( Math.ceil( RoomsCount / size));
        

        res.json({
            success:true, 
            rooms,
            numOfPages
        });
    } catch (error) {
        console.log("Error Fetching All Rooms")
        console.log(error)
        res.status(500).json({success:false, message:"Error Fetching All Rooms"});
    }
});

router.get("/room/:roomId",jwtVerify, async function (req, res) {
    try {
        const { roomId } = req.params;
        const { patientId } = req.query;
        if (!roomId || !patientId )  return res.status(400).json({success:false,message:"Bad Request"});

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }

        const room = await RoomsMethods.getRoomByRoomID(roomId);
        const patient = patientId ? await RoomsMethods.getPatientInRoom(patientId) : {};
        console.log("room and patient ",room,patient)
        res.json({success:true, room,patient});
    } catch (error) {
        console.log("Error Fetching All Rooms")
        console.log(error)
        res.status(500).json({success:false, message:"Error Fetching All Rooms"});
    }
});


router.get("/room/room_number/:roomNum",jwtVerify, async function (req, res) {
    try {
        const { roomNum } = req.params;
        const {pagination, size,status} = req.query
        if (!roomNum || !pagination || !size || !status)  return res.status(400).json({success:false,message:"Bad Request"});

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }

        const rooms = await RoomsMethods.getRoomsByRoomsNumber(roomNum,parseInt(size) , parseInt((pagination - 1) * size),status);
        res.json({success:true, rooms});
    } catch (error) {
        console.log("Error Fetching All Rooms")
        console.log(error)
        res.status(500).json({success:false, message:"Error Fetching All Rooms"});
    }
});

// Get empty rooms
router.get("/empty",jwtVerify, async function (req, res) {
    try {
        const {pagination, size} = req.query

        if ( !pagination || !size )  return res.status(400).json({success:false,message:"Bad Request"});

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }


        const rooms = await RoomsMethods.getEmptyRooms(parseInt(size) , parseInt((pagination - 1) * size));
        const isFiltered = true;
        // get cached count 
        const RoomsCount = await cacheCountNodeCache("totalNumOfEmptyRooms",RoomsMethods.getEmptyRoomsCOUNT,isFiltered)
        const numOfPages = Math.ceil( Math.ceil( RoomsCount / size));


        res.json({
            success:true, 
            rooms,
            numOfPages
        });
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Empty Rooms"});
    }
});

// Get occupied rooms
router.get("/occupied",jwtVerify, async function (req, res) {
    try {
        const {pagination, size} = req.query

        if ( !pagination || !size )  return res.status(400).json({success:false,message:"Bad Request"});

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }

        const isFiltered = true;
        const rooms = await RoomsMethods.getOccupiedRooms(parseInt(size) , parseInt((pagination - 1) * size));
        // get cached count 
        const RoomsCount = await cacheCountNodeCache("totalNumOfOccupiedRooms",RoomsMethods.getOccupiedRoomsCOUNT,isFiltered)
        const numOfPages = Math.ceil( Math.ceil( RoomsCount / size));
        
        res.json({
            success:true, 
            rooms,
            numOfPages 
        });
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Occupied Rooms"});
    }
});

// Get rooms by floor
router.get("/floor/floor_number/:floorNum",jwtVerify, async function (req, res) {
    try {
        const { floorNum } = req.params;
        const {pagination, size,status} = req.query
        if (!floorNum || !pagination || !size || !status)  return res.status(400).json({success:false,message:"Bad Request"});

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }

        const rooms = await RoomsMethods.getRoomsByFloor(floorNum,parseInt(size) , parseInt((pagination - 1) * size),status);
        res.json({success:true, rooms});
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Rooms By Floor"});
    }
});

// Get room by patient
router.get("/patient/:patientId",jwtVerify, async function (req, res) {
    try {
        const { patientId } = req.params;
        if([patientId].some(v => v == null || v === "undefined" || v === "null")) return res.status(404).json({success:false,message:"No Patient In The Room"});

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }


        const room = await RoomsMethods.getRoomByPatient(patientId);
        res.json({success:true, room});
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Room By Patient"});
    }
});

// Get patient details in a room
router.get("/patient/:patientId/details",jwtVerify, async function (req, res) {
    try {
        const { patientId } = req.params;
        if(!patientId){
            return res.status(404).json({
                success:false,
                message:"Bad Request"
            })
        }
        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to access this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Access Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to access this page"
            })
        }
        const patient = await RoomsMethods.getPatientInRoom(patientId);
        res.json({success:true,patient});
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Patient By Room"});
    }
});

// ============================
//              Update
// ============================

// assign patient to room
router.put("/:roomId/assign",jwtVerify, async function (req, res) {
    try {
        const { roomId } = req.params;
        const { user_id, floor_id, room_number } = req.body; // fields to update sent in request body


        
        if (!user_id || !roomId || !floor_id || !room_number)  return res.status(400).json({success:false,message:"Bad Request"});

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to modify this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Modify Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to modify this page"
            })
        }


        // ==== 1. Check if this patient already exists in another room
            const existInOtherRoom = await RoomsMethods.getRoomByPatient(user_id);
            console.log("existInOtherRoom" , existInOtherRoom, user_id);
        // ==== 2. Check if user is assigned to a room or not, and if it's the same as new one
            const isAssignedToRoom = existInOtherRoom ? true :false;
            const isSameRoom = isAssignedToRoom ? existInOtherRoom.room_number === room_number && existInOtherRoom.floor_id === floor_id : false;

            if (isSameRoom) {
                return res.status(400).json({
                    success:false,
                    message: `Patient is already assigned to that room`
                });
            }

            if (isAssignedToRoom && !isSameRoom) {
                return res.status(400).json({
                    success:false,
                    message: `User is at room ${existInOtherRoom.room_number} on floor ${existInOtherRoom.floor_id}. You have to empty it before reassigning.`
                });
            }



            // ==== 3.Check if the new room is already occupied
            const isTargetRoomOccupied = await RoomsMethods.isRoomOccupied(roomId);
            console.log("room",roomId , isTargetRoomOccupied)
            if (isTargetRoomOccupied) {
                return res.status(400).json({
                    success:false,
                    message: "New room is occupied. Please empty it before adding a new patient."
                });
            }

        console.log("user_id, roomId",user_id, roomId)
        // 2. Proceed with update
        const updated = await RoomsMethods.assignPatientToRoom(user_id, roomId);
        
        //===3. Add Audit Log
        await AuditLogs.addLog(
            "hospital",
            tokenFields.user_id,
            `Assigned Patient ${user_id} to Room ${room_number} on Floor ${floor_id}`,
            updated ? "Successful Room Assignment" : "Failed Room Assignment",
            updated ? "info" : "failure"
        )

        if (updated) {
            res.json({success:true, message: "Room updated successfully" });
        } else {
            res.status(400).json({ message: "Failed to update room" });
        }
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({ success:false, message: error.message });
    }
});

router.put("/:roomId/empty",jwtVerify, async function (req, res) {
    try {
        const { roomId } = req.params;

        if(!roomId){
            return res.status(404).json({
                success:false,
                message:"Bad Request"
            })
        }

        const tokenFields = extractUserFromToken(req);
        const userRole = await User.getUserRole(tokenFields.user_id);
        if(userRole === "NormalUser" || !userRole){
            return res.status(401).json({
                success:false,
                message:"Required Role to modify this page"
            })
        }
        const userPerms = await User.getSetUserperms(tokenFields.user_id);

        if(!userPerms || !userPerms.has("Modify Rooms")){
            return res.status(401).json({
                success:false,
                message:"Required permission to modify this page"
            })
        }

        // Reset room assignment
        const result = await RoomsMethods.emptyRoom(roomId);
        const room = await RoomsMethods.getRoomByRoomID(roomId);

        //===2. Add Audit Log
        await AuditLogs.addLog(
            "hospital",
            tokenFields.user_id,
            `Emptied Room ${room.room_number} on Floor ${room.floor_id}`,
            result ? "Successful Room Emptying" : "Failed Room Emptying",
            result ? "info" : "failure"
        )

        if (result && !room.isOccupied && room.user_id === null) {
            res.json({success:true, message: `Room ${room.room_number} floor ${room.floor_id} has been emptied successfully.` });
        } else {
            res.status(404).json({ success:false,message: "Room not found or already empty." });
        }
    } catch (error) {
        console.error("Error emptying room:", error);
        res.status(500).json({ success:false,message: "Error Emptying Room" });
    }
});




module.exports = router;