const express = require("express");
const router = express.Router();
const executeQuery = require("../Utils/executeMySqlQuery");
const nodemailer = require("nodemailer");
const { addClient, removeClient, broadcast } = require("../Utils/alertBroadcaster");

const Alert = require("../Models/alert.js"); // your mongoose model



// GET /api/alerts/stream  — nurses connect here to listen
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(res);

  req.on("close", () => removeClient(res));
});

// GET /api/alerts?page=1&limit=10 — paginated history from MongoDB
router.get("/", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Alert.countDocuments(),
    ]);

    res.json({ success: true, alerts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;