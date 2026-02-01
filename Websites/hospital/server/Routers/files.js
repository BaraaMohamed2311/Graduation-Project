const router = require("express").Router();
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Profile_Pic_Module = require("../Models/Profile_Pic");
const Patient_File_Module = require("../Models/Patient_file");
const mongo_url = process.env.Hospital_MongoDB;
const {Tables , setOfPerms} = require("../Tables/data.js");
const conect_mongodb = require("../Utils/connect_mongodb");
const connect_bucket = require("../Utils/connect_mongo_bucket");
const deleteFromBucket = require("../middlewares/deleteFromBucket");
const User = require("../Classes/User");
const HospitalUsersMethods = require("../Classes/HospitalUsers/HospitalUsersMethods");
const jwtVerify = require("../middlewares/jwtVerify");
const mongoose = require("mongoose");
const AuditLogs = require("../Utils/methods/AuditLogs.js");
const path = require('path');

let gfs_bucket;

// ===1. Define allowed types
const ProfileImagemimetypes = new Set([
  "image/jpeg",
  "image/JPEG",
  "image/png",
  "image/jpg",
  "image/JPG",
  "image/PNG",
]);

const patientFileTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/dicom",
  "text/plain",
]);

// ===2. Connect to MongoDB and return uploads bucket
async function initializeConnectionMDB() {
  const db = await conect_mongodb(process.env.Hospital_MongoDB);
  const bucket = await connect_bucket(db, "uploads");
  return bucket;
}


// ===3. Initialize bucket for GridFS operations
initializeConnectionMDB().then((bucket) => (gfs_bucket = bucket));


// ===4. Configure multer-gridfs-storage for profile images
const profileStorage = new GridFsStorage({
  url: mongo_url,
  file: (req, file) => {
    if (ProfileImagemimetypes.has(file.mimetype)) {
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const timestamp = Date.now();
      return {
        bucketName: "uploads",
        filename: `${nameWithoutExt}_${timestamp}${ext}`,
      };
    } else {
      return null;
    }
  },
});
const uploadProfileImg = multer({ storage: profileStorage });

// ===5. Configure multer-gridfs-storage for patient files
const patientStorage = new GridFsStorage({
  url: mongo_url,
  file: (req, file) => {
    if (patientFileTypes.has(file.mimetype)) {
      const ext = path.extname(file.originalname); // e.g., ".pdf"
      const nameWithoutExt = path.basename(file.originalname, ext); // e.g., "report"
      const timestamp = Date.now();
      return {
        bucketName: "patient_uploads",
        filename: `${nameWithoutExt}_${timestamp}${ext}`,
      };
    } else {
      return null;
    }
  },
});
const uploadPatientFile = multer({ storage: patientStorage });


// ==============================================
//                Get User Image
// ==============================================

router.get("/profile",jwtVerify, async (req, res) => {
  try {
    if (gfs_bucket) {
      // ===5.1 Find user record
      const user = await Profile_Pic_Module.findOne({
        user_id: req.query["user_id"],
      });

      // ===5.2 Handle case if no image found
      if (!user || !user.user_pic.file_name) {
        res.header("Content-Type", "application/json");
        return res.status(404).json({
          success: false,
          message: "User Has No Image",
        });
      }

      // ===5.3 Find file in bucket
      const cursor = await gfs_bucket.find({
        filename: user.user_pic.file_name,
      });
      const docsArray = await cursor.toArray();

      // ===5.4 Pipe image back to response
      if (docsArray[0] && docsArray[0].filename) {
        gfs_bucket.openDownloadStreamByName(docsArray[0].filename).pipe(res);
      } else {
        res.header("Content-Type", "application/json");
        return res.status(404).json({
          success: false,
          message: "Image file not found ",
        });
      }
    } else {
      res.header("Content-Type", "application/json");
      return res.status(404).json({
        success: false,
        message: "Mongo Bucket is undefined",
      });
    }
  } catch (err) {
    res.header("Content-Type", "application/json");

    res.status(500).json({
      success: false,
      message: err.message || "Error GET Profile Picture",
    });
  }
});


// ==============================================
//                Get Patient Files
// ==============================================
router.get("/patient/:user_id",jwtVerify, async (req, res) => {
  try {
    const { user_id } = req.params;
    const {pagination , size} = req.query;

    const limit = parseInt(size);
    const offset = parseInt((pagination - 1) * size );

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    if (!gfs_bucket) {
      return res.status(404).json({
        success: false,
        message: "Mongo GridFS bucket is undefined"
      });
    }

    // 1. Fetch all file metadata for this user
    const patientObject = await Patient_File_Module.findOne({ user_id });
    const patientFiles = patientObject && patientObject.files ? patientObject.files.slice(offset, offset + limit) : [] ; 
    const numOfPages = await Patient_File_Module.countDocuments({ user_id });


    if (!patientFiles || patientFiles.length === 0) {
      return res.status(200).json({
        success: true,
        files: [],
        message: "No files found for this user"
      });
    }


    return res.status(200).json({
      success: true,
      files: patientFiles,
      numOfPages
    });

  } catch (err) {
    console.error("Error GET Patient Files", err);
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving patient files"
    });
  }
});


// ==============================================
//                Download Patient File
// ==============================================
router.get("/patient/:file_id/download",jwtVerify, async (req, res) => {
  try {
    const { file_id } = req.params;

    if (!file_id) return res.status(400).json({ success: false, message: "file_id is required" });

    // Create GridFSBucket for patient files
    const patientBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "patient_uploads",
    });

    if (!patientBucket) return res.status(404).json({ success: false, message: "Mongo patientBucket undefined" });

    // Find the file in GridFS
    const file = await patientBucket.find({ _id: new mongoose.Types.ObjectId(file_id) }).toArray();
    if (!file || file.length === 0) return res.status(404).json({ success: false, message: "File not found" });

    const readStream = patientBucket.openDownloadStream(file[0]._id);

    res.set({
      "Content-Type": file[0].contentType,
      "Content-Disposition": `attachment; filename="${file[0].filename}"`,
    });

    readStream.pipe(res);

  } catch (err) {
    console.error("Error downloading file", err);
    res.status(500).json({ success: false, message: err.message || "Error downloading file" });
  }
});


 


// ==============================================
//                Upload Patient Files
// ==============================================
router.post(
  "/patient/:user_id",jwtVerify,
  uploadPatientFile.array("patient_file", 10),  // multiple files
  async (req, res) => {
    const { user_id } = req.params;
    

    try {
      if (!gfs_bucket) {
        return res
          .status(404)
          .json({ success: false, message: "Mongo Bucket is undefined" });
      }

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // 1️⃣ Map uploaded files to metadata objects
        const uploadedMeta = req.files.map((file) => ({
          file_name: file.filename,
          file_id: file.id,
          file_type: file.mimetype,
        }));

        // 2️⃣ Append to user's files array inside the transaction
        const updatedRecord = await Patient_File_Module.findOneAndUpdate(
          { user_id },
          { $push: { files: { $each: uploadedMeta } } },
          { upsert: true, new: true, session } // important: include session
        );

        // 3️⃣ Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // 4️⃣ Send success response
        res.status(200).json({
          success: true,
          message: "Patient files uploaded successfully",
          uploaded: uploadedMeta,
          record: updatedRecord,
        });

      } catch (err) {
        // 5️⃣ Rollback if anything fails
        await session.abortTransaction();
        session.endSession();

        console.error("Error uploading patient files:", err);
        res.status(500).json({
          success: false,
          message: err.message || "Error uploading patient files",
        });
      }

        await AuditLogs.addLog(
          req.userData.user_id,
          `Uploaded Files for Patient ${user_id}`,
          "Successful Patient File Upload",
          "info"
        );


    } catch (err) {
      console.error("Error uploading patient files", err);
      res.status(500).json({
        success: false,
        message: err.message || "Error uploading patient files",
      });
    }
  }
);

// ==============================================
//                Update other patient's file 
// ==============================================

router.post("/other/patient",jwtVerify, uploadPatientFile.array("patient_file", 10),async function(req , res){
        try {   
                // ===1. Get Data From Body & Query of actions to be made
                    let { modifier_id , modifier_email,  other_user_email} = req.body;
                    let {my} = req.query


                    
                // ===2.Check Bad Request
                if(!modifier_id || !other_user_email || !modifier_email ) 
                    return res.status(400).json({success:false,messages:[{success:false,message:"Bad Request"}]});

                // Ceck if list page can be accessible
                const Modifier_role = await User.getUserRole(modifier_id);
                
                if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });
                
                if (!gfs_bucket) {
                    return res
                        .status(404)
                        .json({ success: false, message: "Mongo Bucket is undefined" });
                }

                if (!req.files || req.files.length === 0) {
                    return res
                        .status(400)
                        .json({ success: false, message: "No files uploaded" });
                          }



                //  ===4. Check valid user types
                    const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
                    const OtherUserType = await User.getUserTypeByEmail(other_user_email);

                    if(ModifierUserType === 'patient')  return res.status(401).json({success:false,message:"You Are A Patient Not An Employee"});
                    if(OtherUserType !== 'patient')  return res.status(401).json({success:false,message:"That User Is An Employee Not A Patient"});
                    // Get fresh title and id from db
                    const other_user_id = await User.getUserIDByEmail(other_user_email)

                

                    // ===4. Get Required  Permissions for execution
                    const  modifierSetperms = await User.getSetUserperms(modifier_id);

                    
                    // Check Authorization using perms
                    const isAuthorized = modifierSetperms.has('Modify Patient Files')
                    
                    // Check that user can modify patients that do not belong to him
                    if(!isAuthorized) return res.status(401).json({success:false,message:"Permission Is Required For This Action"});

                    //  ===5. Check patient belongs to staff
                    const belongsToModifier = my ? await HospitalUsersMethods.patientBelongsToStaff(modifier_id,other_user_id) : true;

                    if(!belongsToModifier) return res.status(401).json({success:false,message:"This Isn't Your Patient"});
                    

                    // ===6. Apply Transaction
                    const session = await mongoose.startSession();
                      session.startTransaction();

                      try {
                        // 1️⃣ Map uploaded files to metadata objects
                        const uploadedMeta = req.files.map((file) => ({
                          file_name: file.filename,
                          file_id: file.id,
                          file_type: file.mimetype,
                        }));

                        // 2️⃣ Append to user's files array inside the transaction
                        const updatedRecord = await Patient_File_Module.findOneAndUpdate(
                          { user_id: other_user_id },
                          { $push: { files: { $each: uploadedMeta } } },
                          { upsert: true, new: true, session } // <-- important: pass session
                        );

                        // 3️⃣ Commit the transaction
                        await session.commitTransaction();
                        session.endSession();

                        res.status(200).json({
                          success: true,
                          message: "Patient files uploaded successfully",
                          uploaded: uploadedMeta,
                          record: updatedRecord,
                        });
                      } catch (err) {
                        // Rollback if anything goes wrong
                        await session.abortTransaction();
                        session.endSession();

                        console.error("Error uploading patient files:", err);
                        res.status(500).json({
                          success: false,
                          message: err.message || "Error uploading patient files",
                        });
                      }

                      // Audit Log
                        await AuditLogs.addLog(
                            "hospital",                        // site_id
                            modifier_id,                        // who made the change
                            req.files.length > 0
                                ? "Successful Upload Patient Files"
                                : "Failed Upload Patient Files", // method/action
                            {                                   // affects_who
                                email: other_user_email,
                                file_count: req.files.length,
                                status: req.files.length > 0 ? "info" : "failure"
                            }
                        );

        }
        catch (err) {
            console.log(err)
            res.status(500).json({
                success:false,
                message: err.message || "Error In Update Others Api Path "
            })
        }
    })


// ==============================================
//                Update User Image
// ==============================================

// ===1. Ensure user exists if not create it -> delete old image -> upload new -> update Mongo record
router.put(
  "/profile",jwtVerify,
  async (req, res, next) => {
    await deleteFromBucket(gfs_bucket, req, res, next);
  },
  uploadProfileImg.single("user_pic"),
  async (req, res) => {
    try {

      if (gfs_bucket) {
        const maxSizeInBytes =  20 * 1024 * 1024; // 20MB

        if (req.file.size > maxSizeInBytes)
          return res.status(400).json({
            success: false,
            message: "Image Size Must be 50Kbs At Max",
          });

        // ===3. Update user record with new image info
        await Profile_Pic_Module.findOneAndUpdate(
          { user_id: req.query["user_id"] },
          { user_pic: { file_name: req.file.filename, ImgId: req.file.id } },
          { upsert: true, new: true }
        );

        // ===4. Pipe new image back to response
        if (req.file && req.file.filename) {
          gfs_bucket.openDownloadStreamByName(req.file.filename).pipe(res);
        } else {
          res.header("Content-Type", "application/json");
          return res.status(400).json({
            success: false,
            message: "Image Not Valid",
          });
        }
      } else {
        res.header("Content-Type", "application/json");
        return res.status(404).json({
          success: false,
          message: "Mongo Bucket is undefined",
        });
      }
    } catch (err) {
      console.log("Error Update Profile Picture", err);
      res.status(500).json({
        success: false,
        message: err.message || "Error Update Profile Picture",
      });
    }
  }
);


// ==============================================
//      Delete Patient File (FIXED)
// ==============================================
router.delete("/patient/:file_id/delete", jwtVerify, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { file_id } = req.params;

    if (!file_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "file_id is required" 
      });
    }

    const db = mongoose.connection.db;

    // 1️⃣ GridFS bucket for patient files
    const patientBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "patient_uploads",
    });

    // 2️⃣ Find the file in GridFS
    const files = await patientBucket
      .find({ _id: new mongoose.Types.ObjectId(file_id) })
      .toArray();

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "File not found" 
      });
    }

    const file = files[0];

    // 3️⃣ Delete the GridFS file
    await patientBucket.delete(file._id, { session });

    // 4️⃣ Delete metadata from Patients_Files
    const updateResult = await Patient_File_Module.updateOne(
      { "files.file_id": file_id },
      { $pull: { files: { file_id: file_id } } },
      { session }
    );

    // 5️⃣ Commit the transaction BEFORE audit log
    await session.commitTransaction();
    session.endSession();

    // 6️⃣ Audit Log AFTER transaction is committed and session ended
    try {
      await AuditLogs.addLog(
        "hospital",
        req.userData.user_id, // Use modifier from JWT
        "Delete Patient File",
        {
          file_id: file_id,
          filename: file.filename,
          status: "info"
        }
      );
    } catch (auditErr) {
      // Log audit error but don't fail the request since deletion succeeded
      console.error("Audit log failed:", auditErr);
    }

    return res.status(200).json({
      success: true,
      message: `File "${file.filename}" and its metadata deleted successfully`,
      deletedMetadataCount: updateResult.modifiedCount,
    });

  } catch (err) {
    // Only abort if transaction is still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Error deleting file with transaction", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Error deleting file" 
    });
  }
});

// ==============================================
//      Delete Other Patient File (FIXED)
// ==============================================
router.delete("/other/patient/:file_id/delete", jwtVerify, async (req, res) => {
  let { modifier_id, modifier_email, other_user_email } = req.body;
  let { my } = req.query;

  // Start session ONLY after validation
  let session = null;

  try {
    // ===2. Check Bad Request
    if (!modifier_id || !other_user_email || !modifier_email) {
      return res.status(400).json({ 
        success: false, 
        message: "Bad Request" 
      });
    }

    // Ceck if list page can be accessible
    const Modifier_role = await User.getUserRole(modifier_id);
    
    if (Modifier_role === "NormalUser") return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

    if (!gfs_bucket) {
      return res.status(404).json({ 
        success: false, 
        message: "Mongo Bucket is undefined" 
      });
    }

    // ===3. Check valid user types
    const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
    const OtherUserType = await User.getUserTypeByEmail(other_user_email);

    if (ModifierUserType === 'patient') {
      return res.status(401).json({ 
        success: false, 
        message: "You Are A Patient Not An Employee" 
      });
    }

    if (OtherUserType !== 'patient') {
      return res.status(401).json({ 
        success: false, 
        message: "That User Is An Employee Not A Patient" 
      });
    }

    const other_user_id = await User.getUserIDByEmail(other_user_email);

    // ===4. Check patient belongs to staff
    const belongsToModifier = my 
      ? await HospitalUsersMethods.patientBelongsToStaff(modifier_id, other_user_id) 
      : true;

    if (!belongsToModifier) {
      return res.status(401).json({ 
        success: false, 
        message: "This Isn't Your Patient" 
      });
    }

    // ===5. Get Required Permissions
    const modifierSetperms = await User.getSetUserperms(modifier_id);

    const isAuthorized = modifierSetperms.has('Modify Patient Files');

    if (!isAuthorized) {
      return res.status(401).json({ 
        success: false, 
        message: "Permission Is Required For This Action" 
      });
    }

    // ===6. NOW start the transaction after all validation
    session = await mongoose.startSession();
    session.startTransaction();

    const { file_id } = req.params;

    if (!file_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "file_id is required" 
      });
    }

    const db = mongoose.connection.db;

    // 1️⃣ GridFS bucket for patient files
    const patientBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "patient_uploads",
    });

    // 2️⃣ Find the file in GridFS
    const files = await patientBucket
      .find({ _id: new mongoose.Types.ObjectId(file_id) })
      .toArray();

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "File not found" 
      });
    }

    const file = files[0];

    // 3️⃣ Delete the GridFS file
    await patientBucket.delete(file._id, { session });

    // 4️⃣ Delete metadata from Patients_Files
    const updateResult = await Patient_File_Module.updateOne(
      { "files.file_id": file_id },
      { $pull: { files: { file_id: file_id } } },
      { session }
    );

    // 5️⃣ Commit the transaction BEFORE audit log
    await session.commitTransaction();
    session.endSession();

    // 6️⃣ Audit Log AFTER transaction is committed
    try {
      await AuditLogs.addLog(
        "hospital",
        modifier_id,
        "Delete Other Patient File",
        {
          email: other_user_email,
          file_id: file_id,
          filename: file.filename,
          status: "info"
        }
      );
    } catch (auditErr) {
      console.error("Audit log failed:", auditErr);
    }

    return res.status(200).json({
      success: true,
      message: `File "${file.filename}" and its metadata deleted successfully`,
      deletedMetadataCount: updateResult.modifiedCount,
    });

  } catch (err) {
    // Only abort if session exists and transaction is active
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    if (session) {
      session.endSession();
    }

    console.error("Error deleting file with transaction", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Error deleting file" 
    });
  }
});

module.exports = router;
