
const mongoose = require('mongoose');


const Alert_Schema = new mongoose.Schema({
  // we store alert meta data
      alert_name:{type:String},
      alert_id:{type:String},
      alert_type: { type: String, required: true },
      alert_time: { type: Date, required: true },
      alert_status: { type: String, required: true },
      alert_details: { type: String, required: true },


},{timestamps:true , collection:"Alerts"})




module.exports = mongoose.model("Alerts",Alert_Schema);

