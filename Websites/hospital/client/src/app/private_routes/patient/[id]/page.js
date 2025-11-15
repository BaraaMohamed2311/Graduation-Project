"use client";
import styles from "./patient.module.css";
import private_routes from "../../page";
import { useCachedEmployeesContext } from "@/contexts/cached_employees";
import { useSearchParams, useParams } from "next/navigation";
import deleteFetch from "@/utils/deleteFetch";
import { useUserDataContext } from "@/contexts/user_data";
import { useRouter } from "next/navigation";
import getUserImage from "@/utils/getUserImg";
import UpdateEmpForm from "@/components/UpdateUserForm/UpdateEmpForm";
import { useState ,useEffect} from "react";
import userNotification from "@/utils/userNotification";
import Image from "next/image";
import PatientFiles from "@/components/FilesList/FilesList";
function EmployeePage() {

  let [isEditing , setIsEditing ] = useState(false);
  let [blobURL , setBlobURL] = useState("/avatar.jpg");
  /** Contexts use **/
  let {  setCached_Employees } = useCachedEmployeesContext();
  let { user_data } = useUserDataContext();

  /** Url extraction **/
  let search_params = useSearchParams();
  const employeeString = new URLSearchParams(search_params);
  let {currPage , ...employee_displayed} = Object.fromEntries(employeeString.entries())
  
  currPage = parseInt(currPage);
  /** other hooks **/
  const router = useRouter();



  useEffect(()=>{
    // we fetch cached in localStorage if nothing then we fetch from db
    const reader = new FileReader();
      
      // create fileReader to read image once recieved from res
      reader.addEventListener('load',()=> UpdateState(reader.result));
      // fetch image
      getUserImage('/profile/prof-img', employee_displayed.emp_email , reader ,setBlobURL ,user_data.token)
    

    return ()=>{
      reader.removeEventListener('load', UpdateState)
    }

} ,[employee_displayed.emp_email, user_data.token]);

function UpdateState(reader_result){
      setBlobURL(reader_result);
}



  // handle deletion function
  async function handleDeletion(url, token, body) {

    // if no permission do not delete other user
    if(!user_data.emp_perms.has("Modify Data")){
      return userNotification("error","You Do Not Have Permession to Delete Others")
    }
    deleteFetch(url, token, body);
    // Delete from cache
    await setCached_Employees(prev => {
      // Get the current page's employee array and update it
        return prev.filter((employee)=>{
                return employee_displayed.emp_id !== employee.emp_id;
        })
      
    })
    router.replace("/private_routes/list");
  }
  

  const handleDownloadFile = (file) => {
    // Download single file
    const link = document.createElement("a");
    link.href = ``;
    link.download = file.name;
    link.click();
  };

  const handleDownloadAll = () => {
    // You can return a .zip file from your backend route
    window.location.href = ``;
  };

  

  return (
    <main className={styles["patient-main"]}>
  {user_data.emp_perms && user_data.emp_perms.has("Modify Data") && isEditing ? (
    <UpdateEmpForm
      currPage={currPage}
      employee_displayed={employee_displayed}
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
          <h1 className={styles["patient-name"]}>{employee_displayed.patient_name}</h1>
          <p><strong>Email:</strong> {employee_displayed.patient_email || "Not Provided"}</p>
          <p><strong>Phone:</strong> {employee_displayed.patient_phone || "Not Provided"}</p>
          <p><strong>Address:</strong> {employee_displayed.patient_address || "Not Specified"}</p>
          <p><strong>Gender:</strong> {employee_displayed.patient_gender || "Not Specified"}</p>
          <p><strong>Date of Birth:</strong> {employee_displayed.date_of_birth || "Not Specified"}</p>
          <p><strong>Emergency Contact:</strong> {employee_displayed.emergency_contact || "Not Provided"}</p>
          <p><strong>Assigned to Room:</strong> {employee_displayed.isAssignedToRoom ? "Yes" : "No"}</p>
          <p><strong>Room Number:</strong> 
            {employee_displayed.room_number !== -1 ? employee_displayed.room_number : "Not Assigned"}
          </p>
          <p><strong>Floor Number:</strong> 
            {employee_displayed.floor_number !== -1 ? employee_displayed.floor_number : "Not Assigned"}
          </p>
          <p><strong>Next Check Date:</strong> {employee_displayed.next_check_date || "Not Scheduled"}</p>
          <p><strong>Registered On:</strong> {employee_displayed.created_at || "Unknown"}</p>
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
                  patient_id: employee_displayed.patient_id,
                  patient_name: employee_displayed.patient_name,
                  patient_email: employee_displayed.patient_email,
                  modifier_email: user_data.emp_email,
                  modifier_id: user_data.emp_id,
                  modifier_name: user_data.emp_name,
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

export default private_routes(EmployeePage);
