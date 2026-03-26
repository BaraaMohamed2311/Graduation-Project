const router = require("express").Router();
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Profile_Pic_Module = require("../Models/Profile_Pic");
const Patient_File_Module = require("../Models/Patient_file");
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

// ===2. Lazy URL getter — throws a clear error instead of crashing at startup
function getMongoUrl() {
  const url = process.env.Hospital_MongoDB;
  if (!url) throw new Error("Hospital_MongoDB environment variable is not set");
  return url;
}

// ===3. Lazy bucket getter — throws if DB not connected
function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB not connected — check Hospital_MongoDB env var");
  return connect_bucket(db, "uploads");
}

// ===4. Lazy storage factories — created per-request, not at module load
function createProfileStorage() {
  return new GridFsStorage({
    url: getMongoUrl(),
    file: (req, file) => {
      if (ProfileImagemimetypes.has(file.mimetype)) {
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const timestamp = Date.now();
        return {
          bucketName: "uploads",
          filename: `${nameWithoutExt}_${timestamp}${ext}`,
        };
      }
      return null;
    },
  });
}

function createPatientStorage() {
  return new GridFsStorage({
    url: getMongoUrl(),
    file: (req, file) => {
      if (patientFileTypes.has(file.mimetype)) {
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const timestamp = Date.now();
        return {
          bucketName: "patient_uploads",
          filename: `${nameWithoutExt}_${timestamp}${ext}`,
        };
      }
      return null;
    },
  });
}

// ===5. Middleware factories — wraps multer with error handling
function uploadProfileImgMiddleware(req, res, next) {
  try {
    const upload = multer({ storage: createProfileStorage() });
    upload.single("user_pic")(req, res, next);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

function uploadPatientFileMiddleware(req, res, next) {
  try {
    const upload = multer({ storage: createPatientStorage() });
    upload.array("patient_file", 10)(req, res, next);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}


// ==============================================
//                Get User Image
// ==============================================

router.get("/profile", async (req, res) => {
  try {
    const bucket = getBucket();
    if (bucket) {
      const user = await Profile_Pic_Module.findOne({
        user_id: req.query["user_id"],
      });

      if (!user || !user.user_pic.file_name) {
        res.header("Content-Type", "application/json");
        return res.status(404).json({
          success: false,
          message: "User Has No Image",
        });
      }

      const cursor = await bucket.find({
        filename: user.user_pic.file_name,
      });
      const docsArray = await cursor.toArray();

      if (docsArray[0] && docsArray[0].filename) {
        bucket.openDownloadStreamByName(docsArray[0].filename).pipe(res);
      } else {
        res.header("Content-Type", "application/json");
        return res.status(404).json({
          success: false,
          message: "Image file not found",
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
router.get("/patient/:user_id", jwtVerify, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { pagination, size } = req.query;

    const limit = parseInt(size);
    const offset = parseInt((pagination - 1) * size);

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    const bucket = getBucket();
    if (!bucket) {
      return res.status(404).json({
        success: false,
        message: "Mongo GridFS bucket is undefined"
      });
    }

    const patientObject = await Patient_File_Module.findOne({ user_id });
    const patientFiles = patientObject && patientObject.files
      ? patientObject.files.slice(offset, offset + limit)
      : [];
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
router.get("/patient/:file_id/download", jwtVerify, async (req, res) => {
  try {
    const { file_id } = req.params;

    if (!file_id) return res.status(400).json({ success: false, message: "file_id is required" });

    const patientBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "patient_uploads",
    });

    if (!patientBucket) return res.status(404).json({ success: false, message: "Mongo patientBucket undefined" });

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
  "/patient/:user_id",
  jwtVerify,
  uploadPatientFileMiddleware,
  async (req, res) => {
    const { user_id } = req.params;

    try {
      const bucket = getBucket();
      if (!bucket) {
        return res.status(404).json({ success: false, message: "Mongo Bucket is undefined" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const uploadedMeta = req.files.map((file) => ({
          file_name: file.filename,
          file_id: file.id,
          file_type: file.mimetype,
        }));

        const updatedRecord = await Patient_File_Module.findOneAndUpdate(
          { user_id },
          { $push: { files: { $each: uploadedMeta } } },
          { upsert: true, new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
          success: true,
          message: "Patient files uploaded successfully",
          uploaded: uploadedMeta,
          record: updatedRecord,
        });

      } catch (err) {
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
router.post(
  "/other/patient",
  jwtVerify,
  uploadPatientFileMiddleware,
  async function (req, res) {
    try {
      let { modifier_id, modifier_email, other_user_email } = req.body;
      let { my } = req.query;

      if (!modifier_id || !other_user_email || !modifier_email)
        return res.status(400).json({ success: false, messages: [{ success: false, message: "Bad Request" }] });

      const Modifier_role = await User.getUserRole(modifier_id);
      if (Modifier_role === "NormalUser")
        return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

      const bucket = getBucket();
      if (!bucket) {
        return res.status(404).json({ success: false, message: "Mongo Bucket is undefined" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
      }

      const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
      const OtherUserType = await User.getUserTypeByEmail(other_user_email);

      if (ModifierUserType === 'patient')
        return res.status(401).json({ success: false, message: "You Are A Patient Not An Employee" });
      if (OtherUserType !== 'patient')
        return res.status(401).json({ success: false, message: "That User Is An Employee Not A Patient" });

      const other_user_id = await User.getUserIDByEmail(other_user_email);
      const modifierSetperms = await User.getSetUserperms(modifier_id);
      const isAuthorized = modifierSetperms.has('Modify Patient Files');

      if (!isAuthorized)
        return res.status(401).json({ success: false, message: "Permission Is Required For This Action" });

      const belongsToModifier = my
        ? await HospitalUsersMethods.patientBelongsToStaff(modifier_id, other_user_id)
        : true;

      if (!belongsToModifier)
        return res.status(401).json({ success: false, message: "This Isn't Your Patient" });

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const uploadedMeta = req.files.map((file) => ({
          file_name: file.filename,
          file_id: file.id,
          file_type: file.mimetype,
        }));

        const updatedRecord = await Patient_File_Module.findOneAndUpdate(
          { user_id: other_user_id },
          { $push: { files: { $each: uploadedMeta } } },
          { upsert: true, new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
          success: true,
          message: "Patient files uploaded successfully",
          uploaded: uploadedMeta,
          record: updatedRecord,
        });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error uploading patient files:", err);
        res.status(500).json({
          success: false,
          message: err.message || "Error uploading patient files",
        });
      }

      await AuditLogs.addLog(
        "hospital",
        modifier_id,
        req.files.length > 0 ? "Successful Upload Patient Files" : "Failed Upload Patient Files",
        {
          email: other_user_email,
          file_count: req.files.length,
          status: req.files.length > 0 ? "info" : "failure"
        }
      );

    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err.message || "Error In Update Others Api Path"
      });
    }
  }
);


// ==============================================
//                Update User Image
// ==============================================
router.put(
  "/profile",
  jwtVerify,
  async (req, res, next) => {
    try {
      await deleteFromBucket(getBucket(), req, res, next);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  uploadProfileImgMiddleware,
  async (req, res) => {
    try {
      const bucket = getBucket();
      if (bucket) {
        const maxSizeInBytes = 20 * 1024 * 1024; // 20MB

        if (req.file.size > maxSizeInBytes)
          return res.status(400).json({
            success: false,
            message: "Image Size Must be 50Kbs At Max",
          });

        await Profile_Pic_Module.findOneAndUpdate(
          { user_id: req.query["user_id"] },
          { user_pic: { file_name: req.file.filename, ImgId: req.file.id } },
          { upsert: true, new: true }
        );

        if (req.file && req.file.filename) {
          bucket.openDownloadStreamByName(req.file.filename).pipe(res);
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
//      Delete Patient File
// ==============================================
router.delete("/patient/:file_id/delete", jwtVerify, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { file_id } = req.params;

    if (!file_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "file_id is required" });
    }

    const db = mongoose.connection.db;
    const patientBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "patient_uploads" });

    const files = await patientBucket
      .find({ _id: new mongoose.Types.ObjectId(file_id) })
      .toArray();

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const file = files[0];

    await patientBucket.delete(file._id, { session });

    const updateResult = await Patient_File_Module.updateOne(
      { "files.file_id": file_id },
      { $pull: { files: { file_id: file_id } } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    try {
      await AuditLogs.addLog(
        "hospital",
        req.userData.user_id,
        "Delete Patient File",
        { file_id, filename: file.filename, status: "info" }
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
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();

    console.error("Error deleting file with transaction", err);
    res.status(500).json({ success: false, message: err.message || "Error deleting file" });
  }
});

// ==============================================
//      Delete Other Patient File
// ==============================================
router.delete("/other/patient/:file_id/delete", jwtVerify, async (req, res) => {
  let { modifier_id, modifier_email, other_user_email } = req.body;
  let { my } = req.query;
  let session = null;

  try {
    if (!modifier_id || !other_user_email || !modifier_email) {
      return res.status(400).json({ success: false, message: "Bad Request" });
    }

    const Modifier_role = await User.getUserRole(modifier_id);
    if (Modifier_role === "NormalUser")
      return res.status(403).json({ success: false, message: "NormalUser Role cannot access The list" });

    const bucket = getBucket();
    if (!bucket) {
      return res.status(404).json({ success: false, message: "Mongo Bucket is undefined" });
    }

    const ModifierUserType = await User.getUserTypeByEmail(modifier_email);
    const OtherUserType = await User.getUserTypeByEmail(other_user_email);

    if (ModifierUserType === 'patient')
      return res.status(401).json({ success: false, message: "You Are A Patient Not An Employee" });
    if (OtherUserType !== 'patient')
      return res.status(401).json({ success: false, message: "That User Is An Employee Not A Patient" });

    const other_user_id = await User.getUserIDByEmail(other_user_email);

    const belongsToModifier = my
      ? await HospitalUsersMethods.patientBelongsToStaff(modifier_id, other_user_id)
      : true;

    if (!belongsToModifier)
      return res.status(401).json({ success: false, message: "This Isn't Your Patient" });

    const modifierSetperms = await User.getSetUserperms(modifier_id);
    const isAuthorized = modifierSetperms.has('Modify Patient Files');

    if (!isAuthorized)
      return res.status(401).json({ success: false, message: "Permission Is Required For This Action" });

    session = await mongoose.startSession();
    session.startTransaction();

    const { file_id } = req.params;

    if (!file_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "file_id is required" });
    }

    const db = mongoose.connection.db;
    const patientBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "patient_uploads" });

    const files = await patientBucket
      .find({ _id: new mongoose.Types.ObjectId(file_id) })
      .toArray();

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const file = files[0];

    await patientBucket.delete(file._id, { session });

    const updateResult = await Patient_File_Module.updateOne(
      { "files.file_id": file_id },
      { $pull: { files: { file_id: file_id } } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    try {
      await AuditLogs.addLog(
        "hospital",
        modifier_id,
        "Delete Other Patient File",
        { email: other_user_email, file_id, filename: file.filename, status: "info" }
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
    if (session && session.inTransaction()) await session.abortTransaction();
    if (session) session.endSession();

    console.error("Error deleting file with transaction", err);
    res.status(500).json({ success: false, message: err.message || "Error deleting file" });
  }
});

module.exports = router;