const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const RoomsMethods = require("../Utils/methods/RoomsMethods.js");
const cacheCountNodeCache = require("../Utils/cacheCountNodeCache.js");
const JoinFiltering = require("../Utils/JoinFiltering.js")

// ============================
//              GET
// ============================

// Get all rooms
router.get("/",jwtVerify, async function (req, res) {
    try {
        const {pagination, size,...restFilters} = req.query

        if (!pagination || !size )  return res.status(400).json({success:false,message:"Bad Request"});

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
        if (!patientId )  return res.status(400).json({success:false,message:"Bad Request"});
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

router.put("/:roomId/empty",jwtVerify, async function (req, res) {
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
router.post("/:floor_number/:room_number",jwtVerify, async function (req, res) {
    try {
        // ===1. Extract request data

        //===2. Get corresponding Patient

        //====3. send state data to client-side

    } catch (error) {
        res.status(500).json({ success:false, message: error.message });
    }
});


module.exports = router;