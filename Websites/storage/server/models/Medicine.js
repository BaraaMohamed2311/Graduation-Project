const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  med_id: { type: String, required: true, unique: true },
  med_name: { type: String, required: true },
  med_company: { type: String },
  med_factory: { type: String },
  med_quantity: { type: Number, default: 0 },
  toCure: { type: String },
  discription: { type: String },
  med_threshold: { type: Number, default: 0 },
});

module.exports = mongoose.model("Medicine", medicineSchema);
