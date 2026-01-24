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
const jwtVerify = require("../middlewares/jwtVerify");
const mongoose = require("mongoose")

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
      return {
        bucketName: "uploads",
        filename: `${file.originalname}_${Date.now()}`,
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
      return {
        bucketName: "patient_uploads",
        filename: `${file.originalname}_${Date.now()}`,
      };
    } else {
      return null;
    }
  },
});



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
//                Update User Image
// ==============================================

// ===1. Ensure user exists if not create it -> delete old image -> upload new -> update Mongo record
router.put(
  "/profile",jwtVerify,
  async (req, res, next) => {
    await deleteFromBucket(gfs_bucket, req, res, next);
  },
  uploadProfileImg.single("user_img"),
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
//                Fix
// ==============================================

router.delete("//:file_id/delete",jwtVerify, async (req, res) => {
  const session = await mongoose.startSession();
  // Opened transaction so both deleting meta-data and file itself must succeed
  session.startTransaction();

  try {
    const { file_id } = req.params;

    if (!file_id)
      return res.status(400).json({ success: false, message: "file_id is required" });

    const db = mongoose.connection.db;

    // 1️⃣ GridFS bucket for patient files (same db as session)
    const patientBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "patient_uploads",
    });

    // 2️⃣ Find the file in GridFS
    const files = await patientBucket.find({ _id: new mongoose.Types.ObjectId(file_id) }).toArray();

    if (!files || files.length === 0)
      return res.status(404).json({ success: false, message: "File not found" });

    const file = files[0];

    // 3️⃣ Delete the GridFS file
    await patientBucket.delete(file._id, { session }); // pass session for transaction

    // 4️⃣ Delete metadata from Patients_Files
    const updateResult = await Patient_File_Module.updateOne(
      { "files.file_id": file_id },
      { $pull: { files: { file_id: file_id } } },
      { session }
    );

    // 5️⃣ Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `File "${file.filename}" and its metadata deleted successfully`,
      deletedMetadataCount: updateResult.modifiedCount,
    });

  } catch (err) {
    // Rollback on error
    await session.abortTransaction();
    session.endSession();

    console.error("Error deleting file with transaction", err);
    res.status(500).json({ success: false, message: err.message || "Error deleting file" });
  }
});



module.exports = router;
