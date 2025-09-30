
const mongoose = require('mongoose');


const File_Schema = new mongoose.Schema({
  // we store image id of metadata at file collection and binary itself at Employees collection
      file_name:{type:String},
      file_id:{type:String},
      file_type: { type: String, required: true },


},{timestamps:false })


const Patient_File_Schema = new mongoose.Schema({
    
    
        
        patient_email: {type:String, required:true},
        file: File_Schema 
      
    
    
},{timestamps:true , collection:"Patients_Files"})

module.exports = mongoose.model("File",Patient_File_Schema);

