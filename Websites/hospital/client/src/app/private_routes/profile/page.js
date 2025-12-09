"use client"
import styles from "./profile.module.css"
import private_routes from "../page";
import { useUserDataContext } from "@/contexts/user_data";
import { useEffect, useState  , useRef} from "react";
import Image from "next/image";
import updateImg from "@/utils/updateImg";

import getUserImage from "@/utils/getUserImg";
import {profileComponents} from "./Profile_Fields";
function ProfilePage() {
  

  let {user_data} = useUserDataContext();
  let [blobURL , setBlobURL] = useState("/avatar.jpg");
  const ProfileComponent = profileComponents[user_data.emp_title?.toLowerCase()] || profileComponents.patient;


  // fetch on first render if wasn't stored in localStorage 
  useEffect(()=>{
    // we fetch cached in localStorage if nothing then we fetch from db
    const initial = localStorage.getItem("blobURL") ? JSON.parse(localStorage.getItem("blobURL")) : "/avatar.jpg";
    
    
    const reader = new FileReader();

    // if we are rendering default avatar then fetch user's image
    if(initial === "/avatar.jpg"){
      
      // create fileReader to read image once recieved from res
      reader.addEventListener('load',()=> CacheImageLocalStorage(reader.result));
      // fetch image
      getUserImage('/profile/prof-img', user_data.emp_email , reader ,setBlobURL ,user_data.token )
    }

    return ()=>{
      reader.removeEventListener('load', CacheImageLocalStorage)
    }

} ,[user_data.emp_email,user_data.token])


  function handleImginput(e){
    updateImg(e.target.files[0] , user_data.emp_email , setBlobURL , user_data.token)
  }


  function CacheImageLocalStorage(reader_result){
      if(blobURL && blobURL !== "/avatar.jpg")
        localStorage.setItem('blobURL', JSON.stringify(reader_result));
      setBlobURL(reader_result);
  }
  
  // user_data.emp_perms is stored as set not a string that's why we need to convert to array first to loop through
  const permissions = user_data.emp_perms ? Array.from(user_data.emp_perms) : [];

  
  return (
    <main className={styles["profile-main"]} >
      <div className={styles["profile-container"]}>
        <div className={styles["profile-header"]}>
            <div className={styles["profile-img-wrapper"]}>
              <input onChange={handleImginput}  className={styles["profile-input"]} name="emp_img" accept="image/*" type="file" />
              <Image priority={true}  src={blobURL} className={styles["profile-picture"]} width="192" height="192" alt="User Profile Image" />
            </div>

          <ProfileComponent user_data={user_data} permissions={permissions} />
        </div>
      </div>
      </main>
  );
}


export default  private_routes(ProfilePage)