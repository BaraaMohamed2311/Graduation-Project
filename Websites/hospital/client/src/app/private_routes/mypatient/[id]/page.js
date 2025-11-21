"use client";
import styles from "./patient.module.css";
import private_routes from "../../page";
import { useMyPatientsCache } from "@/hooks/useMyPatientsCache";
import {  useParams } from "next/navigation";
import deleteFetch from "@/utils/deleteFetch";
import { useUserDataContext } from "@/contexts/user_data";
import { useRouter } from "next/navigation";
import getUserImage from "@/utils/getUserImg";
import UpdateEmpForm from "@/components/UpdateUserForm/UpdateEmpForm";
import { useState ,useEffect} from "react";
import userNotification from "@/utils/userNotification";
import Image from "next/image";
import PatientFiles from "@/components/FilesList/FilesList";

function PatientDetailsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [blobURL, setBlobURL] = useState("/avatar.jpg");
  const { id: user_id, currPage } = useParams();
  const { cached_my_patients, isIndexedDBLoaded, setCached_My_Patients } = useMyPatientsCache(); 
  const { user_data } = useUserDataContext();
  const router = useRouter();

  // Efficiently find the patient from cache
  const mypatient = cached_my_patients?.find(mp => mp.user_id === parseInt(user_id));

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

  const handleDownloadFile = (file) => {
    const link = document.createElement("a");
    link.href = ``;
    link.download = file.name;
    link.click();
  };

  const handleDownloadAll = () => {
    window.location.href = ``;
  };

  // Move conditional returns AFTER all hooks
  if (!isIndexedDBLoaded) {
    return <div>Loading...</div>;
  }

  if (!mypatient) {
    return <div>Your Patient not found in cache</div>;
  }

  return (
    <main className={styles["patient-main"]}>
      {user_data?.emp_perms?.has("Modify Data") && isEditing ? (
        <UpdateEmpForm
          currPage={currPage}
          user={mypatient}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      ) : (
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
              <p><strong>Email:</strong> {mypatient.patient_email || "Not Provided"}</p>
              <p><strong>Phone:</strong> {mypatient.patient_phone || "Not Provided"}</p>
              <p><strong>Address:</strong> {mypatient.patient_address || "Not Specified"}</p>
              <p><strong>Gender:</strong> {mypatient.patient_gender || "Not Specified"}</p>
              <p><strong>Date of Birth:</strong> {mypatient.date_of_birth? new Date(mypatient.date_of_birth).toLocaleDateString() : "Not Specified"}</p>
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
            files={[]}
            onDownloadFile={handleDownloadFile}
            onDownloadAll={handleDownloadAll}
          />

          {/* --- Actions --- */}
          <div className={styles["patient-details"]}>
            <ul className={styles["activity-list"]}>
              <li className={styles["buttons-wrapper"]}>
                <button
                  onClick={() => setIsEditing(prev => !prev)}
                  className="grey-button"
                >
                  Edit Patient
                </button>
                <button
                  onClick={() =>
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
      )}
    </main>
  );
}

export default private_routes(PatientDetailsPage);