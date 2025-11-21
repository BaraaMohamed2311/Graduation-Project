const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const RoomsMethods = require("../Utils/methods/RoomsMethods.js");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 }); // 1 hour default TTL
const CACHE_TTL = 600; // 10 minutes in seconds (for specific overrides)
// ============================
//              GET
// ============================

// Get all rooms
router.get("/", async function (req, res) {
    try {
        const {pagination, size,...restFilteers} = req.query

        if (!pagination || !size )  return res.status(400).json({success:false,message:"Bad Request"});

        const rooms = await RoomsMethods.getRooms(parseInt(size) , parseInt((pagination - 1) * size));

        // Get fresh count from database
        const freshTotalRoomsCount = await RoomsMethods.getAllRoomsCOUNT();
        
        let totalRoomsCount = freshTotalRoomsCount; // Default to fresh count
        
        // Only cache and use cache for non-filtered queries (this endpoint is always non-filtered)
        if (myCache.has("totalNumOfRooms")) {
            totalRoomsCount = myCache.get("totalNumOfRooms");
        } else {
            totalRoomsCount = freshTotalRoomsCount; 
            myCache.set("totalNumOfRooms", totalRoomsCount, CACHE_TTL);
        }

        res.json({
            success:true, 
            rooms,
            numOfPages: Math.ceil(totalRoomsCount / size)
        });
    } catch (error) {
        console.log("Error Fetching All Rooms")
        console.log(error)
        res.status(500).json({success:false, message:"Error Fetching All Rooms"});
    }
});

router.get("/room/:roomId", async function (req, res) {
    try {
        const { roomId } = req.params;
        const { patientId } = req.query;
        if (!roomId || !patientId )  return res.status(400).json({success:false,message:"Bad Request"});
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


router.get("/room/room_number/:roomNum", async function (req, res) {
    try {
        const { roomNum } = req.params;
        const {pagination, size,status} = req.query
        if (!roomNum || !pagination || !size || !status)  return res.status(400).json({success:false,message:"Bad Request"});
        const rooms = await RoomsMethods.getRoomsByRoomsNumber(roomNum,parseInt(size) , parseInt((pagination - 1) * size),status);
        res.json({success:true, rooms});
    } catch (error) {
        console.log("Error Fetching All Rooms")
        console.log(error)
        res.status(500).json({success:false, message:"Error Fetching All Rooms"});
    }
});

// Get empty rooms
router.get("/empty", async function (req, res) {
    try {
        const {pagination, size} = req.query

        if ( !pagination || !size )  return res.status(400).json({success:false,message:"Bad Request"});


        const rooms = await RoomsMethods.getEmptyRooms(parseInt(size) , parseInt((pagination - 1) * size));

        // Get fresh count from database
        const freshEmptyRoomsCount = await RoomsMethods.getEmptyRoomsCOUNT();
        
        let emptyRoomsCount = freshEmptyRoomsCount; // Default to fresh count
        
        // Only cache and use cache for non-filtered queries (this endpoint is always non-filtered)
        if (myCache.has("totalNumOfEmptyRooms")) {
            emptyRoomsCount = myCache.get("totalNumOfEmptyRooms");
        } else {
            emptyRoomsCount = freshEmptyRoomsCount; 
            myCache.set("totalNumOfEmptyRooms", emptyRoomsCount, CACHE_TTL);
        }

        res.json({
            success:true, 
            rooms,
            numOfPages: Math.ceil(emptyRoomsCount / size)
        });
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Empty Rooms"});
    }
});

// Get occupied rooms
router.get("/occupied", async function (req, res) {
    try {
        const {pagination, size} = req.query

        if ( !pagination || !size )  return res.status(400).json({success:false,message:"Bad Request"});

        const rooms = await RoomsMethods.getOccupiedRooms(parseInt(size) , parseInt((pagination - 1) * size));
        // Get fresh count from database - always use fresh count for filtered states
        // Get fresh count from database
        const freshOccupiedRoomsCount = await RoomsMethods.getOccupiedRoomsCOUNT();
        
        let occupiedRoomsCount = freshOccupiedRoomsCount; // Default to fresh count
        
        // Only cache and use cache for non-filtered queries (this endpoint is always non-filtered)
        if (myCache.has("totalNumOfOccupiedRooms")) {
            occupiedRoomsCount = myCache.get("totalNumOfOccupiedRooms");
        } else {
            occupiedRoomsCount = freshOccupiedRoomsCount; 
            myCache.set("totalNumOfOccupiedRooms", occupiedRoomsCount, CACHE_TTL);
        }
        
        res.json({
            success:true, 
            rooms,
            numOfPages: Math.ceil(occupiedRoomsCount / size) // Always use fresh count
        });
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Occupied Rooms"});
    }
});

// Get rooms by floor
router.get("/floor/floor_number/:floorNum", async function (req, res) {
    try {
        const { floorNum } = req.params;
        const {pagination, size,status} = req.query
        if (!floorNum || !pagination || !size || !status)  return res.status(400).json({success:false,message:"Bad Request"});
        const rooms = await RoomsMethods.getRoomsByFloor(floorNum,parseInt(size) , parseInt((pagination - 1) * size),status);
        res.json({success:true, rooms});
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Rooms By Floor"});
    }
});

// Get room by patient
router.get("/patient/:patientId", async function (req, res) {
    try {
        const { patientId } = req.params;
        if (!patientId )  return res.status(400).json({success:false,message:"Bad Request"});
        const room = await RoomsMethods.getRoomByPatient(patientId);
        res.json({success:true, room});
    } catch (error) {
        res.status(500).json({success:false, message:"Error Fetching Room By Patient"});
    }
});

// Get patient details in a room
router.get("/patient/:patientId/details", async function (req, res) {
    try {
        const { patientId } = req.params;
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
router.put("/:roomId/assign", async function (req, res) {
    try {
        const { roomId } = req.params;
        const { patient_id, floor_id, room_number } = req.body; // fields to update sent in request body


        
        if (!patient_id || !roomId || !floor_id || !room_number)  return res.status(400).json({success:false,message:"Bad Request"});


        // ==== 1. Check if this patient already exists in another room
            const existingRoom = await RoomsMethods.getRoomByPatient(patient_id);
            console.log("existingRoom" , existingRoom);
        // ==== 2. Check if user is assigned to a room or not, and if it's the same as new one
            const isAssignedToRoom = existingRoom ? true :false;
            const isSameRoom = isAssignedToRoom ? existingRoom.room_number === room_number && existingRoom.floor_id === floor_id : false;

            if (isSameRoom) {
                return res.status(400).json({
                    success:false,
                    message: `Patient is already assigned to that room`
                });
            }

            if (isAssignedToRoom && !isSameRoom) {
                return res.status(400).json({
                    success:false,
                    message: `User is at room ${existingRoom.room_number} on floor ${existingRoom.floor_id}. You have to empty it before reassigning.`
                });
            }



            // ==== 3.Check if the new room is already occupied
            const isTargetRoomOccupied = await RoomsMethods.isRoomOccupied(roomId);

            if (isTargetRoomOccupied) {
                return res.status(400).json({
                    success:false,
                    message: "New room is occupied. Please empty it before adding a new patient."
                });
            }

        console.log("patient_id, roomId",patient_id, roomId)
        // 2. Proceed with update
        const updated = await RoomsMethods.assignPatientToRoom(patient_id, roomId);

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

router.put("/:roomId/empty", async function (req, res) {
    try {
        const { roomId } = req.params;

        // Reset room assignment
        const result = await RoomsMethods.emptyRoom(roomId);
        const room = await RoomsMethods.getRoomByRoomID(roomId);
        if (result && !room.isOccupied && room.patient_id === null) {
            res.json({success:true, message: `Room ${room.room_number} floor ${room.floor_id} has been emptied successfully.` });
        } else {
            res.status(404).json({ success:false,message: "Room not found or already empty." });
        }
    } catch (error) {
        console.error("Error emptying room:", error);
        res.status(500).json({ success:false,message: "Error Emptying Room" });
    }
});

// health state
router.post("/:floor_number/:room_number", async function (req, res) {
    try {
        // ===1. Extract request data

        //===2. Get corresponding Patient

        //====3. send state data to client-side

    } catch (error) {
        res.status(500).json({ success:false, message: error.message });
    }
});


module.exports = router;