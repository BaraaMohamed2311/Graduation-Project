"use client";
import styles from "./patient.module.css";
import private_routes from "../../page";
import { useMyPatientsCache } from "@/hooks/useMyPatientsCache";
import {  useParams } from "next/navigation";
import deleteFetch from "@/utils/deleteFetch";
import { useUserDataContext } from "@/contexts/user_data";
import { useRouter } from "next/navigation";
import getUserImage from "@/utils/getUserImg";
import UpdateUserForm from "@/components/UpdateUserForm/UpdateUserForm";
import { useState ,useEffect , useRef} from "react";
import userNotification from "@/utils/userNotification";
import updateUserFetch from "@/utils/updateUserFetch";
import Image from "next/image";
import PatientFiles from "@/components/FilesList/FilesList";
import { inputs_info , select_options } from "./data";
import HealthStatus from "@/components/HealthStatus/HealthStatus";
import uploadPatientFile from "@/utils/uploadPatientFile";
function PatientDetailsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [files_meta , setFilesMeta] = useState([]);
  const [blobURL, setBlobURL] = useState("/avatar.jpg");
  const { id: user_id, currPage } = useParams();
  const { cached_my_patients, isIndexedDBLoaded, setCached_My_Patients } = useMyPatientsCache(); 
  const { user_data } = useUserDataContext();
  const router = useRouter();
  // Define references at page level
    const inputsBoxsRef = useRef({});
    const selectBoxsRef = useRef({});

  // Efficiently find the patient from cache
  const mypatient = cached_my_patients?.find(mp => mp.user_id === parseInt(user_id));



    // Load User Image
  useEffect(() => {
    if (!mypatient || !user_data?.token) return; // Add null checks
    
    // we fetch cached in localStorage if nothing then we fetch from db
    const reader = new FileReader();
    
    // create fileReader to read image once received from res
    reader.addEventListener('load', () => UpdateState(reader.result));
    // fetch image
    getUserImage('/profile/prof-img', mypatient.user_email, reader, setBlobURL, user_data.token);

    return () => {
      reader.removeEventListener('load', UpdateState);
    };
  }, [mypatient?.user_email, user_data?.token]); // Use optional chaining

  function UpdateState(reader_result) {
    setBlobURL(reader_result);
  }

  // handle deletion function
  async function handleDeletion(url, token, body) {
    if (!user_data?.emp_perms?.has("Modify Data")) {
      return userNotification("error", "You Do Not Have Permission to Delete Others");
    }
    
    deleteFetch(url, token, body);
    
    setCached_My_Patients(prev => {
      return prev.filter((p) => p.user_id !== mypatient.user_id);
    });
    
    router.replace("/private_routes/list");
  }


   /***************************************update_handler***************************************/
       function update_handler(e, url, token) {
          e.preventDefault();
          // get updated user data and actions that were made
          let {updatedPatientData , actionString} = checkActionsMade();
          console.log("updatedPatientData , actionString",updatedPatientData , actionString)
  
          const reqBody = {
                        modifier_id: user_data.user_id,
                        modifier_email:user_data.user_email,
                        other_user_email:mypatient.user_email,
                        ...updatedPatientData
                      }
  
            updateUserFetch( url, token, reqBody ,actionString , setCached_My_Patients , currPage );
          
  
          
        }
  /***************************************checkActionsMade***************************************/
        function checkActionsMade(){
  
          let actions = [];
          let updatedPatientData = {};

  
      // ====================================================== Modify Data ======================================================
  
         // === 1. Check for changes in general input fields
  
          inputs_info.forEach((input_info) => {
            //  Check If any inputBox is empty 
            if ( (inputsBoxsRef.current[input_info.name] && !inputsBoxsRef.current[input_info.name].value) ){
              userNotification("error", "Input fields cannot be empty");
              return
            }
            
            // we check at first that input element is rendered using current of reference
            else if (inputsBoxsRef.current[input_info.name] && (inputsBoxsRef.current[input_info.name].value !== mypatient[input_info.name])) {
                updatedPatientData[input_info.name] = inputsBoxsRef.current[input_info.name].value;
              if (!actions.includes("Modify My Patient")) actions.push("Modify My Patient"); // Add "MD" if not already added
            }
            
          });

          // Check changes of gender which is related to "Modify Other Patient" permission

        if ( (selectBoxsRef.current[select_options.gender_select.name] && !selectBoxsRef.current[select_options.gender_select.name].value) ){
            userNotification("error", "Input fields cannot be empty");
            return
          }
          
          // we check at first that input element is rendered using current of reference
          else if (selectBoxsRef.current[select_options.gender_select.name] && (selectBoxsRef.current[select_options.gender_select.name].value !== mypatient[select_options.gender_select.name])) {
              updatedPatientData[select_options.gender_select.name] = selectBoxsRef.current[select_options.gender_select.name].value;
            if (!actions.includes("Modify Other Patient")) actions.push("Modify Other Patient"); // Add "MD" if not already added
          }
  
        
          // Join actions array to form the action string
          let actionString = actions.join("-");
          console.log("actionString",actionString)
          return {
            updatedPatientData,
            actionString,
            
          };
  
      }

  // ================================================================
  //      File Handlers
  // ================================================================

  // ================================
  //      Upload
  function onUploadFile(file) {
    const other_req_data = {
      other_user_email: mypatient.user_email,
      modifier_email: user_data.user_email,
      modifier_id: user_data.user_id,
    };

    uploadPatientFile(`files/other/patient?my=true`, file, other_req_data, user_data.token);
  }
  // ================================
  //      Delete
  async function onDeleteFile(e, entry) {
    e.stopPropagation(); // prevent triggering download if button inside file item

    if (!entry || !entry.file_id) {
      return userNotification("error", "Invalid file selected");
    }

    // 1️⃣ Ask for confirmation
    const confirmDelete = window.confirm(`Are you sure you want to delete "${entry.file_name}"?`);
    if (!confirmDelete) return;

    // 2️⃣ Optimistic UI update
    const prevFiles = [...files_meta];
    setFilesMeta((files) => files.filter((f) => f.file_id !== entry.file_id));

    try {
      // 3️⃣ Call the DELETE endpoint
      const res = await fetch(
        `${process.env.APIKEY}/files/patient/${entry.file_id}/delete`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user_data.token}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        // rollback if deletion failed
        setFilesMeta(prevFiles);
        return userNotification("error", data.message || "Failed to delete file");
      }

      // 4️⃣ Success notification
      userNotification("success", `Deleted "${entry.file_name}" successfully`);
    } catch (err) {
      // rollback if error
      setFilesMeta(prevFiles);
      console.error(err);
      userNotification("error", "Error deleting file");
    }
}

  

  // Move conditional returns AFTER all hooks
  if (!isIndexedDBLoaded) {
    return <div>Loading...</div>;
  }

  if (!mypatient) {
    return <div>Your Patient not found in cache</div>;
  }
  const is_authorized_to_modify_my_patents_data = user_data?.emp_perms?.has('Modify My Patient');
  return (
    <main className={styles["patient-main"]}>
      
      {isEditing && is_authorized_to_modify_my_patents_data && 
        <UpdateUserForm
            url={`list/update-other/mypatient`}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            user_displayed={mypatient}
            currPage={currPage}
            userData={user_data}
            modifier_data={user_data}
            // Pass the references and functions as props
            references={{inputsBoxsRef,selectBoxsRef}}
            inputs_info={inputs_info}
            select_options={select_options}
            update_handler={update_handler}
          />
      }
        <div className={styles["patient-container"]}>
          {/* --- Header Section --- */}
          <div className={styles["patient-header"]}>
            <div className={styles["patient-img-wrapper"]}>
              <Image
                priority={false}
                src={blobURL}
                className={styles["patient-picture"]}
                width="192"
                height="192"
                alt="Patient Profile Image"
              />
            </div>

            <div className={styles["patient-info"]}>
              <h1 className={styles["patient-name"]}>{mypatient.patient_name}</h1>
              <p><strong>Email:</strong> {mypatient.user_email || "Not Provided"}</p>
              <p><strong>Phone:</strong> {mypatient.patient_phone || "Not Provided"}</p>
              <p><strong>Address:</strong> {mypatient.patient_address || "Not Specified"}</p>
              <p><strong>Gender:</strong> {mypatient.patient_gender || "Not Specified"}</p>
              <p><strong>Date of Birth:</strong> {mypatient.date_of_birth? mypatient.date_of_birth.split("T")[0] : "Not Specified"}</p>
              <p><strong>Emergency Contact:</strong> {mypatient.emergency_contact || "Not Provided"}</p>
              <p><strong>Assigned to Room:</strong> {mypatient.isAssignedToRoom ? "Yes" : "No"}</p>
              <p><strong>Room Number:</strong> 
                {mypatient.room_number !== -1 ? mypatient.room_number : "Not Assigned"}
              </p>
              <p><strong>Floor Number:</strong> 
                {mypatient.floor_number !== -1 ? mypatient.floor_number : "Not Assigned"}
              </p>
              <p><strong>Next Check Date:</strong> {mypatient.next_check_date || "Not Scheduled"}</p>
              <p><strong>Registered On:</strong> {mypatient.created_at || "Unknown"}</p>
            </div>
          </div>
          
          <PatientFiles
            urls={{initial_url:`files/patient/${mypatient.user_id}`,download_one_url:`files/patient`}}
            files={[]}
            onDeleteFile={onDeleteFile}
            onUploadFile={onUploadFile}
            patient={mypatient}
            files_meta ={files_meta}
            setFilesMeta ={setFilesMeta}
          />

          <HealthStatus  
          user_id={mypatient.user_id}/>

          {/* --- Actions --- */}
          <div className={styles["patient-details"]}>
            <ul className={styles["activity-list"]}>
              <li className={styles["buttons-wrapper"]}>
                <button
                  onClick={(e) => setIsEditing(prev => !prev)}
                  className="grey-button"
                >
                  Edit Data
                </button>


                <button
                  onClick={(e) =>
                    handleDeletion("list/delete-patient", user_data.token, {
                      user_id: mypatient.user_id,
                      patient_name: mypatient.patient_name,
                      user_email: mypatient.user_email,
                      modifier_email: user_data.user_email,
                      modifier_id: user_data.user_id,
                      modifier_name: user_data.user_name,
                    })
                  }
                  className="red-button"
                >
                  Delete Patient
                </button>
              </li>
            </ul>
          </div>
        </div>
      
    </main>
  );
}

export default private_routes(PatientDetailsPage);