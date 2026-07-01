const express = require("express");
const router = express.Router();
const executeQuery = require("../Utils/executeMySqlQuery");
const nodemailer = require("nodemailer");
const { addClient, removeClient, broadcast } = require("../Utils/alertBroadcaster");

const Alert = require("../Models/alert.js"); // your mongoose model



router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(res, req.query.user_id, req.query.floor_number); // was req.body.user_id — GET has no body
  req.on("close", () => removeClient(res));
});

router.get("/", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;
    const userId = req.query.user_id;
    const floorNumber = req.query.floor_number;

    const visibilityFilter = {
      $or: [
        { alert_type: { $nin: ["consultation", "medication", "critical"] } },
        { alert_type: "consultation", $or: [{ hosp_emp_id: userId }, { user_id: userId }] },
        { alert_type: "medication", floor_number: Number(floorNumber) },
        { alert_type: "critical", floor_number: Number(floorNumber) },
      ],
    };

    const [alerts, total] = await Promise.all([
      Alert.find(visibilityFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Alert.countDocuments(visibilityFilter),
    ]);

    res.json({ success: true, alerts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;