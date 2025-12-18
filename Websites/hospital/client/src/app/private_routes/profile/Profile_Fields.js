import pickRoleIcon  from "@/utils/pickRoleIcon";
import Link from "next/link";
import MoneyShortner from "@/utils/MoneyShortner"
import styles from "./profile.module.css"
import Image from "next/image";
import PatientFiles from "@/components/FilesList/FilesList"
import HealthStatus from "@/components/HealthStatus/HealthStatus"
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { useRef, useState } from "react";
import ProfileEditManager from "@/components/ProfileEditManager/ProfileEditManager";
import { selfEditableFields , approvalRequiredFields } from "./data";
// ===================================================
//            Rendering helpers
// ===================================================

const AvailabilityList = ({availability_schedule})=>{
  console.log("Availability Schedule:", availability_schedule);
  return (<>
  {/* Availability Schedule */}

                <strong className={styles.availability_header}>Availability</strong>
                <div className={styles.availability_wrapper}>
                  {availability_schedule ? (
                    availability_schedule.split("; ").map((schedule) => {
                      const [dayIndex, timeRange] = schedule.split(": ");
                      const [startTime, endTime] = timeRange.split("-");
                      const days = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"};
                      
                      return (
                        <div key={dayIndex} className={styles.schedule_item}>
                          <span className={styles.day}>{days[dayIndex] || `Day ${dayIndex}`}</span>
                          <span className={styles.time}>{startTime} - {endTime}</span>
                        </div>
                      );
                    })
                  ) : "No schedule available"}
                </div>

  </>)
}

const PermsList = ({permissions})=>{
  return (<>
    {/* Perms List */}
    <strong className={styles.perms_header}>Permissions</strong>
          <div className={styles.perms_wrapper}>
            {permissions && permissions[0] !== "None" ? permissions.map((perm) => (
              <span key={perm} className="perm">{perm}</span>
            )) : "None"}
          </div>
  </>)
}

// ===================================================
//            Specific Fields Components
// ===================================================
// ===================================================
//            Doctor
const DoctorProfile = ({ user_data, permissions }) => {
  const inputsBoxsRef = useRef({})
  return (
    <>
      <div className={styles["profile-info"]}>
        <h1 className={styles["profile-name"]}>{user_data.emp_name}</h1>
        <p className={styles["profile-position"]}>
          {`${user_data.emp_title} | ${user_data.emp_specialty}`}
        </p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Consultation Price:</strong> {MoneyShortner(user_data.initial_consultation_price)}</p>
        <p><strong>Follow-up Price:</strong> {MoneyShortner(user_data.followup_consultation_price)}</p>
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

      <div className={styles["profile-details"]}>
        <ul className={styles["activity-list"]}>
          <li><strong>Salary:</strong> {MoneyShortner(user_data.emp_salary)}</li>
          <li><strong>This Month Bonus:</strong> {MoneyShortner(user_data.emp_bonus)}</li>
          <li><strong>This Month Absence:</strong> {user_data.emp_abscence}</li>

          <li className={styles.role_box}>
            <strong>Role:</strong> {user_data.role_name}
            <Image src={pickRoleIcon(user_data.role_name)} width={30} height={30} alt="doctor role" />
          </li>

          <li className={styles.availability_box}>
            <AvailabilityList availability_schedule={user_data.availability_schedule} />
          </li>

          <li className={styles.perms_box}>
            <PermsList permissions={permissions} />
          </li>
        </ul>
      </div>

      <ProfileEditManager
        role="doctor"
        userData={user_data}
        userDisplayed={user_data}
        update_handler={()=>{}}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
        
      />
    </>
  );
};

// ===================================================
//            Surgeon
const SurgeonProfile = ({ user_data, permissions }) => {
  const inputsBoxsRef = useRef({})
  return (
    <>
      <div className={styles["profile-info"]}>
        <h1 className={styles["profile-name"]}>{user_data.emp_name}</h1>
        <p className={styles["profile-position"]}>
          {`${user_data.emp_title} | ${user_data.emp_specialty}`}
        </p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Surgery Price:</strong> {MoneyShortner(user_data.surgery_price)}</p>
        <p><strong>Follow-up Price:</strong> {MoneyShortner(user_data.followup_consultation_price)}</p>
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

      <div className={styles["profile-details"]}>
        <ul className={styles["activity-list"]}>
          <li><strong>Salary:</strong> {MoneyShortner(user_data.emp_salary)}</li>
          <li><strong>This Month Bonus:</strong> {MoneyShortner(user_data.emp_bonus)}</li>
          <li><strong>This Month Absence:</strong> {user_data.emp_abscence}</li>

          <li className={styles.role_box}>
            <strong>Role:</strong> {user_data.role_name}
            <Image src={pickRoleIcon(user_data.role_name)} width={30} height={30} alt="surgeon role" />
          </li>

          <li className={styles.availability_box}>
            <AvailabilityList availability_schedule={user_data.availability_schedule} />
          </li>

          <li className={styles.perms_box}>
            <PermsList permissions={permissions} />
          </li>
        </ul>
      </div>

      <ProfileEditManager
        role="surgeon"
        userData={user_data}
        userDisplayed={user_data}
        update_handler={()=>{}}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
      />
    </>
  );
};

// ===================================================
//            Nurse
const NurseProfile = ({ user_data, permissions }) => {
  const inputsBoxsRef = useRef({})
  return (
    <>
      <div className={styles["profile-info"]}>
        <h1 className={styles["profile-name"]}>{user_data.emp_name}</h1>
        <p className={styles["profile-position"]}>
          {`${user_data.emp_title} | ${user_data.emp_specialty}`}
        </p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Shift:</strong> {user_data.shift_type}</p>
        <p><strong>Department:</strong> {user_data.department}</p>
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

      <div className={styles["profile-details"]}>
        <ul className={styles["activity-list"]}>
          <li><strong>Salary:</strong> {MoneyShortner(user_data.emp_salary)}</li>
          <li><strong>This Month Bonus:</strong> {MoneyShortner(user_data.emp_bonus)}</li>
          <li><strong>This Month Absence:</strong> {user_data.emp_abscence}</li>

          <li className={styles.role_box}>
            <strong>Role:</strong> {user_data.role_name}
            <Image src={pickRoleIcon(user_data.role_name)} width={30} height={30} alt="nurse role" />
          </li>

          <li className={styles.availability_box}>
            <AvailabilityList availability_schedule={user_data.availability_schedule} />
          </li>

          <li className={styles.perms_box}>
            <PermsList permissions={permissions} />
          </li>
        </ul>
      </div>

      <ProfileEditManager
        role="nurse"
        userData={user_data}
        userDisplayed={user_data}
        update_handler={()=>{}}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
      />
    </>
  );
};

// ===================================================
//            Patient
const PatientProfile = ({ user_data }) => {
  const [files_meta, setFilesMeta] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const inputsBoxsRef = useRef({})

  // ================================================================
  //      File Handlers
  // ================================================================

  // ================================
  //      Upload
  function onUploadFile(files, setProgress, setIsUploading) {
    setIsUploading(true);
    uploadPatientFile(
      `files/other/patient`,
      files,
      modifierObj,
      user_data.token,
      setProgress
    );
  }

  // ================================
  //      Delete
  async function onDeleteFile(e, entry) {
    e.stopPropagation(); // prevent triggering download if button inside file item

    if (!entry || !entry.file_id) {
      return userNotification("error", "Invalid file selected");
    }

    // 1️⃣ Ask for confirmation
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${entry.file_name}"?`
    );
    if (!confirmDelete) return;

    // 2️⃣ Optimistic UI update
    const prevFiles = [...files_meta];
    setFilesMeta((files) =>
      files.filter((f) => f.file_id !== entry.file_id)
    );

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
        return userNotification(
          "error",
          data.message || "Failed to delete file"
        );
      }

      // 4️⃣ Success notification
      userNotification(
        "success",
        `Deleted "${entry.file_name}" successfully`
      );
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
      const res = await fetch(
        `${process.env.APIKEY}/users/${user_data.user_id}`,
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
        return userNotification("error", data.message);
      }

      userNotification("success", "Account deleted successfully");
      router.replace("/login");
    } catch (err) {
      console.error(err);
      userNotification("error", "Error deleting account");
      setIsDeletingAccount(false);
    }
  }

  return (
    <>
      <div className={styles["profile-info"]}>
        <h1 className={styles["profile-name"]}>{user_data.patient_name}</h1>
        <p className={styles["profile-position"]}>Patient</p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Phone:</strong> {user_data.phone_number}</p>
        <p><strong>Date of Birth:</strong> {user_data.date_of_birth}</p>
        <p><strong>Emergency Contact:</strong> {user_data.emergency_contact}</p>
      </div>

      <ProfileEditManager
        role="patient"
        userData={user_data}
        userDisplayed={user_data}
        update_handler={()=>{}}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
      />

      <PatientFiles 
          urls={{initial_url:`files/patient/${user_data.user_id}` ,download_one_url:files/patient}} 
          files={[]} 
          onDeleteFile={onDeleteFile} 
          onUploadFile={onUploadFile} 
          patient={user_data} 
          files_meta ={files_meta} 
          setFilesMeta ={setFilesMeta} 
        /> 
      <HealthStatus user_id={user_data.user_id} />

      <button className="red-button" onClick={() => setShowDeleteModal(true)}>
        Delete Account
      </button>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Account"
        message="This action will permanently delete your account and all associated data."
        confirmText="Yes, delete"
        cancelText="Cancel"
        danger
        isLoading={isDeletingAccount}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

// Role mapping object
export const profileComponents = {
  doctor: DoctorProfile,
  surgeon: SurgeonProfile,
  nurse: NurseProfile,
  patient: PatientProfile
};