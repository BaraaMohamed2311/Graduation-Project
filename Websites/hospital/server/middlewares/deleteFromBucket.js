
const Profile_Pic_module = require("../Models/Profile_Pic");
const mongoose = require("mongoose")
async function deleteFromBucket(bucket ,req , res , next){
    if(bucket){

        // we search for user to be image updated
        let old_user = await Profile_Pic_module.findOne({user_email:req.query["user_email"]});
        // if user hasn't had an image before go next and do not try to delete

        if(!old_user || !old_user.user_pic.ImgId){
            return  next();
        }
        // if user had image get id & name of it
        /*use if condition before pass it to mongoose to prevent  BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer*/
        const fileID = old_user.user_pic.ImgId ? new  mongoose.Types.ObjectId(old_user.user_pic.ImgId) : null;

        const fileName = old_user.user_pic.file_name

        /* we use cursor to retrieve file docs and check if file exists before deletion
           we use name to find certain file instead if getting all files*/
        const cursor = await bucket.find({filename:fileName});
        const docsArray = await  cursor.toArray();


        if(fileID && docsArray.length > 0){
            await bucket.delete(fileID,(err)=>{ 
                if(err){
                    consoleLog(`Error Deleting From Bucket ${err}`,"error");
                    return res.json({
                        success:false,
                        message:"Error Deleting From Bucket"
                    })
                    
                }
                consoleLog(`File ${fileName} Deleted From Bucket`,"info");
                
            })
    }
        next();
    }
    else{
        res.send({
            success: false,
            message: "Mongo Bucket is undefined",
        });
    }
}


module.exports = deleteFromBucket;