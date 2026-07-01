const express = require("express");
const router = express.Router();
const executeQuery = require("../Utils/executeMySqlQuery");
const nodemailer = require("nodemailer");
const { addClient, removeClient, broadcast } = require("../Utils/alertBroadcaster");
const Alert = require("../Models/alert");
const extractUserFromToken = require("../Utils/extractUserFromToken");
const User = require("../Classes/User");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "baraamohamed2311@gmail.com",
    pass: process.env.MAILERPASS,
  },
});




// POST /api/alerts/critical-alert — triggered by devices/staff for critical room events
router.post("/critical-alert", async (req, res) => {
  try {
    const { room_num, floor_num, time_of_alert } = req.body;

    if (!room_num || !floor_num || !time_of_alert) {
      return res.status(400).json({
        success: false,
        message: "room_num, floor_num, and time_of_alert are required",
      });
    }

    
    // Save to MongoDB
    const newAlert = await Alert.create({
      alert_name: `Critical Alert — Room ${room_num}`,
      alert_type: "critical",
      alert_time: new Date(time_of_alert),
      alert_status: "active",
      alert_details: `Room ${room_num}, Floor ${floor_num}`,
      floor_number: Number(floor_num)
    });

    // Push to all connected SSE clients
    broadcast(newAlert.toObject());

    // Email all nurses on that floor
    const nurses = await executeQuery(
      `SELECT u.user_email FROM nurses n JOIN users u ON n.emp_id = u.user_id WHERE n.floor_number = ?`,
      [floor_num]
    );
    if (nurses.length > 0) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: nurses.map((n) => n.user_email).join(", "),
        subject: `🚨 Critical Alert — Room ${room_num}, Floor ${floor_num}`,
        text: `Critical alert raised.\n\nRoom: ${room_num}\nFloor: ${floor_num}\nTime: ${time_of_alert}\n\nRespond immediately.\n\nHospital System`,
      });
    }

    res.status(201).json({ success: true, alert: newAlert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;