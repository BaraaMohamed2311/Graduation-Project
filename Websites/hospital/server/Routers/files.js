const router = require("express").Router();
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Profile_Pic_Module = require("../Models/Profile_Pic");
const Patient_File_Module = require("../Models/Patient_file");
const mongo_url = process.env.Hospital_MongoDB;
const conect_mongodb = require("../Utils/connect_mongodb");
const connect_bucket = require("../Utils/connect_mongo_bucket");
const deleteFromBucket = require("../middlewares/deleteFromBucket");

const jwtVerify = require("../middlewares/jwtVerify");

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
      return {
        bucketName: "uploads",
        filename: `${Date.now()}_${file.originalname}`,
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
        bucketName: "uploads",
        filename: `${Date.now()}_${file.originalname}`,
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

router.get("/prof-img", async (req, res) => {
  try {
    if (gfs_bucket) {
      // ===5.1 Find user record
      const user = await Profile_Pic_Module.findOne({
        user_email: req.query["user_email"],
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
      message: "Error GET Profile Picture",
    });
  }
});


// ==============================================
//                Get Patient File
// ==============================================
router.get("/patient-file", async (req, res) => {
  try {
    if (!gfs_bucket) {
      return res
        .status(404)
        .json({ success: false, message: "Mongo Bucket is undefined" });
    }

    const patientFile = await Patient_File_Module.findOne({
      patient_email: req.query["patient_email"],
      "file.file_name": req.query["file_name"],
    });

    if (!patientFile || !patientFile.file.file_name) {
      return res
        .status(404)
        .json({ success: false, message: "Patient has no such file" });
    }

    const cursor = await gfs_bucket.find({
      filename: patientFile.file.file_name,
    });
    const docsArray = await cursor.toArray();

    if (docsArray[0] && docsArray[0].filename) {
      res.set(
        "Content-Type",
        docsArray[0].contentType || patientFile.file.file_type
      );
      gfs_bucket.openDownloadStreamByName(docsArray[0].filename).pipe(res);
    } else {
      res.status(404).json({ success: false, message: "File not found" });
    }
  } catch (err) {
    console.error("Error GET Patient File", err);
    res.status(500).json({ success: false, message: "Error GET Patient File" });
  }
});

// ==============================================
//                Get Patient Files
// ==============================================
router.get("/patient-files", async (req, res) => {
  try {
    if (!gfs_bucket) {
      return res
        .status(404)
        .json({ success: false, message: "Mongo Bucket is undefined" });
    }

    const patientFile = await Patient_File_Module.findOne({
      patient_email: req.query["patient_email"],
      "file.file_name": req.query["file_name"],
    });

    if (!patientFile || !patientFile.file.file_name) {
      return res
        .status(404)
        .json({ success: false, message: "Patient has no such file" });
    }

    const cursor = await gfs_bucket.find({
      filename: patientFile.file.file_name,
    });
    const docsArray = await cursor.toArray();

    if (docsArray[0] && docsArray[0].filename) {
      res.set(
        "Content-Type",
        docsArray[0].contentType || patientFile.file.file_type
      );
      gfs_bucket.openDownloadStreamByName(docsArray[0].filename).pipe(res);
    } else {
      res.status(404).json({ success: false, message: "File not found" });
    }
  } catch (err) {
    console.error("Error GET Patient File", err);
    res.status(500).json({ success: false, message: "Error GET Patient File" });
  }
});


// ==============================================
//                Upload Patient File
// ==============================================
router.post(
  "/upload-patient-file",
  uploadPatientFile.single("patient_file"),
  async (req, res) => {
    try {
      if (!gfs_bucket) {
        return res
          .status(404)
          .json({ success: false, message: "Mongo Bucket is undefined" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      // Save/update file record in Patients_Files collection
      await Patient_File_Module.findOneAndUpdate(
        { patient_email: req.query["patient_email"] },
        {
          file: {
            file_name: req.file.filename,
            file_id: req.file.id,
            file_type: req.file.mimetype,
          },
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        success: true,
        message: "Patient file uploaded successfully",
        file: {
          name: req.file.filename,
          type: req.file.mimetype,
        },
      });
    } catch (err) {
      console.error("Error UPDATE Patient File", err);
      res
        .status(500)
        .json({ success: false, message: "Error Update Patient File" });
    }
  }
);


// ==============================================
//                Update User Image
// ==============================================

// ===1. Ensure user exists if not create it -> delete old image -> upload new -> update Mongo record
router.put(
  "/update-prof-img",
  async (req, res, next) => {
    await deleteFromBucket(gfs_bucket, req, res, next);
  },
  uploadProfileImg.single("user_img"),
  async (req, res) => {
    try {
      console.log("query",req.query)
      if (gfs_bucket) {
        const maxSizeInBytes =  10 * 1024 * 1024; // ===2. Limit image size to 10 MB

        if (req.file.size > maxSizeInBytes)
          return res.status(400).json({
            success: false,
            message: "Image Size Must be 50Kbs At Max",
          });

        // ===3. Update user record with new image info
        await Profile_Pic_Module.findOneAndUpdate(
          { user_email: req.query["user_email"] },
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
        message: "Error Update Profile Picture",
      });
    }
  }
);

module.exports = router;
