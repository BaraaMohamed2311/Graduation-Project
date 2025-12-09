
const mongoose = require('mongoose');




const Patient_Health_Status_Schema = new mongoose.Schema({
        user_id: {type:Number, required:true},

        // Allergies as a list of strings
        patient_allergic: { type: [String], default: [] },

        // Chronic illnesses as a list of strings
        patient_chronic_illnes: { type: [String], default: [] },
        patient_health_devices: {
                type: [
                        {
                                device: String,   // e.g. "heartbeat_monitor"
                                value: Number,    // e.g. 72
                                unit: String,     // e.g. "bpm"
                                recordedAt: { type: Date, default: Date.now }
                        }
                        ],
                        default: []
                }


},{timestamps:true , collection:"Patients_Health_Status"})

module.exports = mongoose.model("Patient Health Status",Patient_Health_Status_Schema);

