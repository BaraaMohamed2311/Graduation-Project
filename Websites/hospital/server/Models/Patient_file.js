
const mongoose = require('mongoose');


const File_Schema = new mongoose.Schema({
  // we store files meta data
      file_name:{type:String},
      file_id:{type:String},
      file_type: { type: String, required: true },


},{timestamps:true })


const Patient_File_Schema = new mongoose.Schema({
    
    
        
        user_id: {type:String, required:true},
        files: [File_Schema] 
      
    
    
},{timestamps:true , collection:"Patients_Files"})

module.exports = mongoose.model("File",Patient_File_Schema);

