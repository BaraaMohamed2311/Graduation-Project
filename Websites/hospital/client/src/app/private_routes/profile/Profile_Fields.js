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
import PermsList from "@/components/PermsList/PermsList"
import { selfEditableFields , approvalRequiredFields } from "./data";
import AvailabilityList from "@/components/AvailabilityList/AvailabilityList"
import Patientmedstable from "@/components/Patientmedstable/Patientmedstable"
// ===================================================
//            Rendering helpers
// ===================================================




// ===================================================
//            Specific Fields Components
// ===================================================
// ===================================================
//            Doctor
const DoctorProfile = ({ user_data, permissions }) => {
  const inputsBoxsRef = useRef({})

  return (
    <>
      <div className={"user-info"}>
        <h1 className={"user-name"} id="user_name">{user_data.user_name}</h1>
        <p className={styles["profile-position"]}>
          {`${user_data.emp_title} | ${user_data.emp_specialty}`}
        </p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Consultation Price:</strong> {MoneyShortner(user_data.initial_consultation_price)}</p>
        <p><strong>Follow-up Price:</strong> {MoneyShortner(user_data.followup_consultation_price)}</p>
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

    <div className="further-info-wrapper">
      <div className={"details-card"}>
        <ul className={"clean-list"}>
          <li><strong>Salary:</strong> {MoneyShortner(user_data.emp_salary)}</li>
          <li><strong>This Month Bonus:</strong> {MoneyShortner(user_data.emp_bonus)}</li>
          <li><strong>This Month Absence:</strong> {user_data.emp_abscence}</li>

          <li className={styles.role_box}>
            <strong>Role:</strong> {user_data.role_name}
            <Image src={pickRoleIcon(user_data.role_name)} width={30} height={30} alt="doctor role" />
          </li>

          <li className={styles.availability_box}>
            
            <AvailabilityList
              user_id={user_data?.user_id}
              availability_schedule={user_data.availability_schedule}
            />

          </li>

          <li className={styles.perms_box}>
            <PermsList permissions={permissions} />
          </li>
        </ul>
      </div>

      <ProfileEditManager
        role="doctor"
        userData={user_data}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
        
      />
      </div>
    </>
  );
};

// ===================================================
//            Surgeon
const SurgeonProfile = ({ user_data, permissions }) => {
  const inputsBoxsRef = useRef({})
  return (
    <>
      <div className={"user-info"}>
        <h1 className={"user-name"} id="user_name">{user_data.user_name}</h1>
        <p className={styles["profile-position"]}>
          {`${user_data.emp_title} | ${user_data.emp_specialty}`}
        </p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Surgery Price:</strong> {MoneyShortner(user_data.surgery_price)}</p>
        <p><strong>Follow-up Price:</strong> {MoneyShortner(user_data.followup_consultation_price)}</p>
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

    <div className="further-info-wrapper">
      <div className={"details-card"}>
          <ul className={"clean-list"}>
            <li><strong>Salary:</strong> {MoneyShortner(user_data.emp_salary)}</li>
            <li><strong>This Month Bonus:</strong> {MoneyShortner(user_data.emp_bonus)}</li>
            <li><strong>This Month Absence:</strong> {user_data.emp_abscence}</li>

            <li className={styles.role_box}>
              <strong>Role:</strong> {user_data.role_name}
              <Image src={pickRoleIcon(user_data.role_name)} width={30} height={30} alt="surgeon role" />
            </li>

            <li className={styles.availability_box}>
              <AvailabilityList
              user_id={user_data?.user_id}
              availability_schedule={user_data.availability_schedule}
            />
              
            </li>

            <li className={styles.perms_box}>
              <PermsList permissions={permissions} />
            </li>
          </ul>
        </div>

        <ProfileEditManager
          role="surgeon"
          userData={user_data}
          references={{ inputsBoxsRef }}
          selfEditableFields={selfEditableFields} 
          approvalRequiredFields={approvalRequiredFields}
        />
      </div>
    </>
  );
};

// ===================================================
//            Nurse
const NurseProfile = ({ user_data, permissions }) => {
  const inputsBoxsRef = useRef({})
  return (
    <>
      <div className={"user-info"}>
        <h1 className={"user-name"} id="user_name">{user_data.user_name}</h1>
        <p className={styles["profile-position"]}>
          {`${user_data.emp_title} | ${user_data.emp_specialty}`}
        </p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

    <div className="further-info-wrapper">
      <div className={"details-card"}>
        <ul className={"clean-list"}>
          <li><strong>Salary:</strong> {MoneyShortner(user_data.emp_salary)}</li>
          <li><strong>This Month Bonus:</strong> {MoneyShortner(user_data.emp_bonus)}</li>
          <li><strong>This Month Absence:</strong> {user_data.emp_abscence}</li>

          <li className={styles.role_box}>
            <strong>Role:</strong> {user_data.role_name}
            <Image src={pickRoleIcon(user_data.role_name)} width={30} height={30} alt="nurse role" />
          </li>

          <li className={styles.availability_box}>
            <AvailabilityList
              user_id={user_data?.user_id}
              availability_schedule={user_data.availability_schedule}
            />
          </li>

          <li className={styles.perms_box}>
            <PermsList permissions={permissions} />
          </li>
        </ul>
      </div>

      <ProfileEditManager
        role="nurse"
        userData={user_data}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
      />
    </div>
    </>
  );
};

// ===================================================
//            Patient
const DefaultEmpProfile = ({ user_data, permissions }) => {
  const inputsBoxsRef = useRef({})
  return (
    <>
      <div className={"user-info"}>
        <h1 className={"user-name"} id="user_name">{user_data.user_name}</h1>
        <p className={styles["profile-position"]}>
          {`${user_data.emp_title} | ${user_data.emp_specialty}`}
        </p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Shift:</strong> {user_data.shift_type}</p>
        <p><strong>Department:</strong> {user_data.department}</p>
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

    <div className="further-info-wrapper">
      <div className={"details-card"}>
        <ul className={"clean-list"}>
          <li><strong>Salary:</strong> {MoneyShortner(user_data.emp_salary)}</li>
          <li><strong>This Month Bonus:</strong> {MoneyShortner(user_data.emp_bonus)}</li>
          <li><strong>This Month Absence:</strong> {user_data.emp_abscence}</li>

          <li className={styles.role_box}>
            <strong>Role:</strong> {user_data.role_name}
            <Image src={pickRoleIcon(user_data.role_name)} width={30} height={30} alt="nurse role" />
          </li>

          <li className={styles.availability_box}>
            <AvailabilityList
              user_id={user_data?.user_id}
              availability_schedule={user_data.availability_schedule}
            />
          </li>

          <li className={styles.perms_box}>
            <PermsList permissions={permissions} />
          </li>
        </ul>
      </div>

      <ProfileEditManager
        role="nurse"
        userData={user_data}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
      />
    </div>
    </>
  );
};

// ===================================================
//            Patient
const PatientProfile = ({ user_data }) => {
  const [files_meta, setFilesMeta] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [ patientMeds, setPatientMedsParent] = useState([]);
  const inputsBoxsRef = useRef({})


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
    
      <div className={"user-info"}>
        <h1 className={"user-name"} id="user_name">{user_data.patient_name}</h1>
        <p className={styles["profile-position"]}>Patient</p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Phone:</strong> {user_data.patient_phone}</p>
        <p><strong>Address:</strong> {user_data.patient_address}</p>
        <p><strong>Date of Birth:</strong> {user_data.date_of_birth}</p>
        <p><strong>Emergency Contact:</strong> {user_data.emergency_contact}</p>
      </div>

    <div className="further-info-wrapper">
      <ProfileEditManager
        role="patient"
        userData={user_data}
        references={{ inputsBoxsRef }}
        selfEditableFields={selfEditableFields} 
        approvalRequiredFields={approvalRequiredFields}
      />

      <PatientFiles 
          urls={{initial_url:`files/patient/${user_data.user_id}` ,download_one_url:`files/patient`}} 
          files={[]} 
          patient={user_data} 
          files_meta ={files_meta} 
          setFilesMeta ={setFilesMeta} 
          isEditable={false}
        /> 
      {/* Cannot modify it urself */}
      <HealthStatus user_id={user_data.user_id} isEditable={false} />

      <Patientmedstable token={user_data.token} user_id={user_data.user_id} setPatientMedsParent={setPatientMedsParent} isPatientProfile={true}/>
    </div>
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
  patient: PatientProfile,
  default: DefaultEmpProfile
};