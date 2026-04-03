const express = require("express");
const router = express.Router();
const Medicine = require("../models/Medicine");

// GET /meds — paginated list with optional search
router.get("/", async (req, res) => {
  try {
    console.log("GET /meds called with query:", req.query);
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";

    const query = search
      ? { med_name: { $regex: search, $options: "i" } }
      : {};

    const [meds, total] = await Promise.all([
      Medicine.find(query).skip(offset).limit(limit),
      Medicine.countDocuments(query),
    ]);

    res.json({ meds, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /meds — add new medicine
router.post("/", async (req, res) => {
  try {
    const { med_id, med_name } = req.body;

    const existing = await Medicine.findOne({
      $or: [{ med_id }, { med_name }],
    });

    if (existing) {
      return res.status(409).json({ error: "Medicine Already Exists in storage" });
    }

    const med = new Medicine(req.body);
    await med.save();
    res.status(201).json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /meds/:med_id — update quantity and threshold
router.put("/:med_id", async (req, res) => {
  try {
    const { med_quantity, med_threshold } = req.body;

    const med = await Medicine.findOne({ med_id: req.params.med_id });
    if (!med) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    if (med_quantity !== undefined) med.med_quantity = med_quantity;
    if (med_threshold !== undefined) med.med_threshold = med_threshold;

    await med.save();
    res.json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
