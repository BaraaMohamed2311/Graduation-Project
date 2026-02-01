const router = require("express").Router();
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Profile_Pic_Module = require("../Models/Profile_Pic");
const mongo_url = process.env.EMS_MongoDB;

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



// ===2. Connect to MongoDB and return uploads bucket
async function initializeConnectionMDB() {
  const db = await conect_mongodb(process.env.EMS_MongoDB);
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




module.exports = router;
