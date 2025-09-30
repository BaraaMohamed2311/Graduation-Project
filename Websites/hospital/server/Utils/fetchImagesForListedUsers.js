const Profile_PIC_Module = require("../Models/Profile_Pic")
async function fetchImagesForListedUsers(users=[]){

    if(users.length < 1) return users;

    const usersWithImages = await Promise.all(
      users.map(async (user) => {
        const imgDoc = await Profile_PIC_Module.findOne({
          user_email: user.user_email,
        });

        return {
          ...user,
          profile_image: imgDoc && imgDoc.user_pic.file_name
            ? `/api/files/prof-img?user_email=${user.user_email}` // <-- route to fetch stream
            : "/avatar.jpg", // default avatar at front-end
        };
      })
    );


    return usersWithImages;

}

module.exports = fetchImagesForListedUsers