const router = require("express").Router();
const jwtVerify = require("../middlewares/jwtVerify.js");
const RoomsMethods = require("../Utils/methods/RoomsMethods.js");

// ============================
//              GET
// ============================

// Get all rooms
router.get("/", async function (req, res) {
    try {
        const rooms = await RoomsMethods.getRooms();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get empty rooms
router.get("/empty", async function (req, res) {
    try {
        const rooms = await RoomsMethods.getEmptyRooms();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get occupied rooms
router.get("/occupied", async function (req, res) {
    try {
        const rooms = await RoomsMethods.getOccupiedRooms();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get rooms by floor
router.get("/floor/:floorId", async function (req, res) {
    try {
        const { floorId } = req.params;
        const rooms = await RoomsMethods.getRoomsByFloor(floorId);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get room by patient
router.get("/patient/:patientId", async function (req, res) {
    try {
        const { patientId } = req.params;
        const room = await RoomsMethods.getRoomByPatient(patientId);
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient details in a room
router.get("/patient/:patientId/details", async function (req, res) {
    try {
        const { patientId } = req.params;
        const patient = await RoomsMethods.getPatientInRoom(patientId);
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================
//              Update
// ============================

// assign patient to room
router.put("/:roomId/assign", async function (req, res) {
    try {
        const { roomId } = req.params;
        const data = req.body; // fields to update sent in request body
        const { patient_id, floor_id, room_number } = data;

        // ==== 1. If patient assignment is requested
        if (patient_id) {
           // ==== 2. Check if this patient already exists in another room
            const existingRoom = await RoomsMethods.getRoomByPatient(patient_id);
            console.log("existingRoom" , existingRoom);
            const isNotSameRoom = existingRoom ? existingRoom.room_number !== room_number || existingRoom.floor_id !== floor_id : false;
            console.log("isNotSameRoom" , isNotSameRoom);
            if (isNotSameRoom) {
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
        }

        // 2. Proceed with update
        const updated = await RoomsMethods.assignPatientToRoom(patient_id, roomId);

        if (updated) {
            res.json({ message: "Room updated successfully" });
        } else {
            res.status(400).json({ error: "Failed to update room" });
        }
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/:roomId/empty", async function (req, res) {
    try {
        const { roomId } = req.params;

        // Reset room assignment
        const result = await RoomsMethods.emptyRoom(roomId);
        const room = await RoomsMethods.getRoomByRoomID(roomId);
        if (result && !room.isOccupied && room.patient_id === null) {
            res.json({ message: `Room ${room.room_number} floor ${room.floor_id} has been emptied successfully.` });
        } else {
            res.status(404).json({ error: "Room not found or already empty." });
        }
    } catch (error) {
        console.error("Error emptying room:", error);
        res.status(500).json({ error: error.message });
    }
});

// health state
router.post("/:floor_number/:room_number", async function (req, res) {
    try {
        // ===1. Extract request data

        //===2. Get corresponding Patient

        //====3. send state data to client-side

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;