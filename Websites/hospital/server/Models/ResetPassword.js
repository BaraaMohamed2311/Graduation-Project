
const mongoose = require('mongoose');



const ResetPasswordTokens = new mongoose.Schema({
    
    
        emp_id: {type:Number, required:true},
        emp_email: {type:String, required:true},
        ResetToken: {type:String},
        createdAtToken: {type:Date} 
    
    
},{timestamps:false , collection:"ResetPasswordTokens"})

module.exports = mongoose.model("ResetPasswordTokens",ResetPasswordTokens);

