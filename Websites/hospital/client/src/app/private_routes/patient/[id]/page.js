"use client";
import styles from "./patient.module.css";
import private_routes from "../../page";
import { usePatientsCache } from "@/hooks/usePatientsCache";
import { useSearchParams, useParams } from "next/navigation";
import deleteFetch from "@/utils/deleteFetch";
import { useUserDataContext } from "@/contexts/user_data";
import { useRouter } from "next/navigation";
import getUserImage from "@/utils/getUserImg";
import UpdateUserForm from "@/components/UpdateUserForm/UpdateUserForm";
import { useState ,useEffect, useRef} from "react";
import userNotification from "@/utils/userNotification";
import Image from "next/image";
import PatientFiles from "@/components/FilesList/FilesList";
import { inputs_info ,select_def} from "./data";
import updateUserFetch from "@/utils/updateUserFetch";
import HealthStatus from "@/components/HealthStatus/HealthStatus";
import statusNotification from "@/utils/statusNotification";
import uploadPatientFile from "@/utils/uploadPatientFile";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import EditableSection from "@/components/EditableSection/EditableSection";
import Patientmedstable from "@/components/Patientmedstable/Patientmedstable"
function PatientDetailsPage() {
  const [files_meta , setFilesMeta] = useState([]);
  const [blobURL, setBlobURL] = useState("/avatar.jpg");
  const { id: user_id, currPage } = useParams();
  const { cached_patients, isIndexedDBLoaded, setCached_Patients, deletePatientFromStore } = usePatientsCache(); // Added setCached_Patients
  const { user_data } = useUserDataContext();
  const router = useRouter();
  const inputsBoxsRef = useRef({})
  const selectBoxsRef = useRef({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Efficiently find the patient from cache
  
  const patient = cached_patients?.find(
          p => p.user_id === parseInt(user_id) || p.user_id === user_id || String(p.user_id) === user_id
        );

  const modifierObj = patient ? {
          other_user_email: patient.user_email,
          modifier_email: user_data.user_email,
          modifier_id: user_data.user_id,
        } : {};



  // Fetch employee data if not found in cache
  useEffect(() => {
  if (!isIndexedDBLoaded || patient) return;

      fetch(`${process.env.APIKEY}/details/employee/${user_id}`, {
        mode: "cors",
        method: "GET",
        headers: {
          authorization: `BEARER ${user_data.token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          statusNotification(res.status);
          return res.json();
        })
        .then((data) => {
          if (data && data.success && data.body) {
            setCached_Employees((prev) => {
      const updated = [...prev, data.body];

      return updated;
    });
            userNotification("success", "Employee loaded successfully");
          } else {
            userNotification("error", "Employee not found");
          }
        })
        .catch((err) => {
          console.error("Error Fetching Employee", err);
          userNotification("error", "Error Fetching Employee");
        });
}, [isIndexedDBLoaded, patient, user_id, user_data.token]);


  // Load User Image
  useEffect(() => {
    if (!patient || !user_data?.token) return; // Add null checks
    
    // we fetch cached in localStorage if nothing then we fetch from db
    const reader = new FileReader();
    
    // create fileReader to read image once received from res
    reader.addEventListener('load', () => UpdateState(reader.result));
    // fetch image
    getUserImage('/profile/prof-img', patient.user_email, reader, setBlobURL, user_data.token);

    return () => {
      reader.removeEventListener('load', UpdateState);
    };
  }, [patient?.user_email, user_data?.token]); // Use optional chaining

  function UpdateState(reader_result) {
    setBlobURL(reader_result);
  }





  /***************************************update_handler***************************************/
     function update_handler(e, url, token) {
        e.preventDefault();
        // get updated user data and actions that were made
        let {updatedPatientData , actionString} = checkActionsMade();


        const reqBody = {
                      modifier_id: user_data.user_id,
                      modifier_email:user_data.user_email,
                      other_user_email:patient.user_email,
                      ...updatedPatientData
                    }

          updateUserFetch( url, token, reqBody ,actionString  );
        

        
      }
/***************************************checkActionsMade***************************************/
      function checkActionsMade(){

        let actions = [];
        let updatedPatientData = {};


    // ====================================================== Modify Employee Data ======================================================

       // === 1. Check for changes in general input fields

        inputs_info.forEach((input_info) => {
          //  Check If any inputBox is empty 
          if ( (inputsBoxsRef.current[input_info.name] && !inputsBoxsRef.current[input_info.name].value) ){
            userNotification("error", "Input fields cannot be empty");
            return
          }
          
          // we check at first that input element is rendered using current of reference
          else if (inputsBoxsRef.current[input_info.name] && (inputsBoxsRef.current[input_info.name].value !== patient[input_info.name])) {
              updatedPatientData[input_info.name] = inputsBoxsRef.current[input_info.name].value;
            if (!actions.includes("Modify Other Patient")) actions.push("Modify Other Patient"); // Add "MD" if not already added
          }
          
        });

        // Check changes of gender which is related to "Modify Other Patient" permission

        if ( (selectBoxsRef.current[select_def.gender_select.name] && !selectBoxsRef.current[select_def.gender_select.name].value) ){
            userNotification("error", "Input fields cannot be empty");
            return
          }
          
          // we check at first that input element is rendered using current of reference
          else if (selectBoxsRef.current[select_def.gender_select.name] && (selectBoxsRef.current[select_def.gender_select.name].value !== patient[select_def.gender_select.name])) {
              updatedPatientData[select_def.gender_select.name] = selectBoxsRef.current[select_def.gender_select.name].value;
            if (!actions.includes("Modify Other Patient")) actions.push("Modify Other Patient"); // Add "MD" if not already added
          }

          // isAssignedToRoom
          if (selectBoxsRef.current[select_def.isAssignedToRoom_select.name] && (selectBoxsRef.current[select_def.isAssignedToRoom_select.name].value !== patient[select_def.isAssignedToRoom_select.name])) {
              updatedPatientData[select_def.isAssignedToRoom_select.name] = selectBoxsRef.current[select_def.isAssignedToRoom_select.name].value;
              if (!actions.includes("Modify Other Patient")) actions.push("Modify Other Patient");
          }

          // determine current isAssigned (new value if changed, otherwise old)
          const isAssigned =
              selectBoxsRef.current[select_def.isAssignedToRoom_select.name]
                  ? selectBoxsRef.current[select_def.isAssignedToRoom_select.name].value == 1
                  : patient[select_def.isAssignedToRoom_select.name] == 1;


          // floor number (ONLY if assigned)
          if (isAssigned) {
              if ( (selectBoxsRef.current[select_def.floorNum_select.name] && !selectBoxsRef.current[select_def.floorNum_select.name].value) ){
                  userNotification("error", "Input fields cannot be empty");
                  return
              }
              else if (selectBoxsRef.current[select_def.floorNum_select.name] && (selectBoxsRef.current[select_def.floorNum_select.name].value !== patient[select_def.floorNum_select.name])) {
                  updatedPatientData[select_def.floorNum_select.name] = selectBoxsRef.current[select_def.floorNum_select.name].value;
                  if (!actions.includes("Modify Other Patient")) actions.push("Modify Other Patient");
              }

              // room number (ONLY if assigned)
              if ( (selectBoxsRef.current[select_def.RoomNum_select.name] && !selectBoxsRef.current[select_def.RoomNum_select.name].value) ){
                  userNotification("error", "Input fields cannot be empty");
                  return
              }
              else if (selectBoxsRef.current[select_def.RoomNum_select.name] && (selectBoxsRef.current[select_def.RoomNum_select.name].value !== patient[select_def.RoomNum_select.name])) {
                  updatedPatientData[select_def.RoomNum_select.name] = selectBoxsRef.current[select_def.RoomNum_select.name].value;
                  if (!actions.includes("Modify Other Patient")) actions.push("Modify Other Patient");
              }
          }

      
        // Join actions array to form the action string
        let actionString = actions.join("-");

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
      async function onUploadFile(files, setProgress, setIsUploading) {
      
        try {
          setIsUploading(true);

          const res = await uploadPatientFile(
            `files/other/patient?my=false`,
            files,
            modifierObj,
            user_data.token,
            setProgress
          );


          // ✅ UPDATE STATE IMMEDIATELY
          if (res?.success && res?.record?.files) {
            setFilesMeta(prev => {
              const map = new Map();
              [...(prev || []), ...res.record.files].forEach(f =>
                map.set(f.file_id, f)
              );
              return Array.from(map.values());
            });

          }

        } catch (err) {
          console.error("Upload error:", err);
        } finally {
          setIsUploading(false);
          setProgress(0);
        }
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



    
async function confirmDeleteAccount() {
    setIsDeletingAccount(true);

    try {
      const query = new URLSearchParams({
        modifier_email: user_data.user_email,
        modifier_id: user_data.user_id,
        modifier_name: user_data.user_name,
        other_user_email: patient.user_email
      }).toString();

      const res = await fetch(
        `${process.env.APIKEY}/list/other/patient?${query}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user_data.token}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        setIsDeletingAccount(false);
        deletePatientFromStore(patient.user_id);
        return userNotification("error", data.message);
      }

      userNotification("success", "Account deleted successfully");
      router.replace("/");
    } catch (err) {
      console.error(err);
      userNotification("error", "Error deleting account");
      setIsDeletingAccount(false);
    }
  }
    

  // Move conditional returns AFTER all hooks
  if (!isIndexedDBLoaded) {
    return <div>Loading...</div>;
  }

  if (!patient) {
    return <div>Patient not found in cache</div>;
  }

  const can_modify_unrelated_patient = user_data?.emp_perms?.has('Modify Other Patient');
  




  return (
    <main className={styles["page-main"]}>
      
          
        <div className={"page-container"}>
          {/* --- Header Section --- */}
          <div className={"main-content"}>
            <div className={"avatar-wrapper"}>
              <Image
                priority={false}
                src={blobURL || "/avatar.jpg"}
                className={"avatar"}
                width="192"
                height="192"
                alt="Patient Profile Image"
              />
            </div>

            <div className={"user-info"}>
              <h1 className={"user-name"} id="user_name">{patient.user_name}</h1>
              <p><strong>Email:</strong> {patient.user_email || "Not Provided"}</p>
              <p><strong>Phone:</strong> {patient.patient_phone || "Not Provided"}</p>
              <p><strong>Address:</strong> {patient.patient_address || "Not Specified"}</p>
              <p><strong>Gender:</strong> {patient.patient_gender || "Not Specified"}</p>
              <p><strong>Date of Birth:</strong> {patient.date_of_birth? patient.date_of_birth.split("T")[0]: "Not Specified"}</p>
              <p><strong>Emergency Contact:</strong> {patient.emergency_contact || "Not Provided"}</p>
              <p><strong>Assigned to Room:</strong> {patient.isAssignedToRoom ? "Yes" : "No"}</p>
              <p><strong>Room Number:</strong> 
                {patient.room_number !== -1 ? patient.room_number : "Not Assigned"}
              </p>
              <p><strong>Floor Number:</strong> 
                {patient.floor_number !== -1 ? patient.floor_number : "Not Assigned"}
              </p>
              <p><strong>Next Check Date:</strong> {patient.next_check_date || "Not Scheduled"}</p>
              <p><strong>Registered On:</strong> {patient.created_at || "Unknown"}</p>
            </div>
          </div>
          
          <PatientFiles
          urls={{initial_url:`files/patient/${patient.user_id}`,download_one_url:`files/patient`}}
            files={[]}
            onUploadFile={onUploadFile}
            onDeleteFile={onDeleteFile}
            patient={patient}
            files_meta ={files_meta}
            setFilesMeta ={setFilesMeta}
          />
          <HealthStatus 
          user_id={patient.user_id}
          modifierObj={modifierObj}
          />
          <Patientmedstable token={user_data.token} user_id={patient.user_id}/>
          {/* --- Actions --- */}
          <div className={"user-details"}>
            <ul className={styles["activity-list"]}>
              <li className={styles["buttons-wrapper"]}>
                {can_modify_unrelated_patient && <EditableSection buttonText="Edit Patient" buttonClassName="grey-button">
                  <UpdateUserForm
                    url={`list/other/patient`}
                    user_displayed={patient}
                    currPage={currPage}
                    userData={user_data}
                    modifier_data={user_data}
                    // Pass the references and functions as props
                    references={{inputsBoxsRef,selectBoxsRef}}
                    update_handler={update_handler}
                    fieldDefinitions={{select_def,inputs_info}}
                    token={user_data.token}
                  />
                </EditableSection>}

                
                <button
                  className="red-button"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account
                </button>

                <ConfirmModal
                  open={showDeleteModal}
                  title="Delete Account"
                  message="This action will permanently delete your account and all associated data. This cannot be undone."
                  confirmText="Yes, delete"
                  cancelText="Cancel"
                  danger
                  isLoading={isDeletingAccount}
                  onConfirm={confirmDeleteAccount}
                  onCancel={() => setShowDeleteModal(false)}
                />

              </li>
            </ul>
          </div>
        </div>
  
    </main>
  );
}

export default private_routes(PatientDetailsPage);