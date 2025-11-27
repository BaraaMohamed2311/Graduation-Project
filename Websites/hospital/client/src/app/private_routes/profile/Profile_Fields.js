import pickRoleIcon  from "@/utils/pickRoleIcon";
import Link from "next/link";
import MoneyShortner from "@/utils/MoneyShortner"
import styles from "./profile.module.css"
import Image from "next/image";
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
            {permissions[0] !== "None" ? permissions.map((perm) => (
              <span key={perm} className="perm">{perm}</span>
            )) : "None"}
          </div>
  </>)
}

// ===================================================
//            Specific Fields Components
// ===================================================
const DoctorProfile = ({ user_data, permissions }) => {
  return (
    <>
    <div className={styles["profile-info"]}>
      <h1 className={styles["profile-name"]}>{user_data.emp_name}</h1>
      <p className={styles["profile-position"]}>{`${user_data.emp_title} | ${user_data.emp_specialty}` || "Doctor"}</p>
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
        <li className={styles.role_box}><strong>Role: </strong>{user_data.role_name} <Image src={pickRoleIcon(user_data.role_name)} width={"30"} height={"30"} alt="doctor role icon" /></li>
        {/* Availability Schedule */}
              <li className={styles.availability_box}>
                <AvailabilityList availability_schedule={user_data.availability_schedule}/>
              </li>
        {/* Perms List */}
        <li className={styles.perms_box}>
          <PermsList permissions={permissions}/>
        </li>
        <li className={`${styles["buttons-wrapper"]}`}>
          {user_data.role_name === "Employee" && <Link href={"/private_routes/mailer?subject=Edit Data Request"} className={`grey-button`}>Edit Request</Link>}
          <Link href={"/private_routes/mailer?subject=Retirement Request"} className={`red-button`}>Retire Request</Link>
        </li>
      </ul>
    </div>
    </>
  );
};

const SurgeonProfile = ({ user_data, permissions }) => {
  return (
    <>
    <div className={styles["profile-info"]}>
      <h1 className={styles["profile-name"]}>{user_data.emp_name}</h1>
      <p className={styles["profile-position"]}>{`${user_data.emp_title} | ${user_data.emp_specialty}` || "Surgeon"}</p>
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
        <li className={styles.role_box}><strong>Role: </strong>{user_data.role_name} <Image src={pickRoleIcon(user_data.role_name)} width={"30"} height={"30"} alt="surgeon role icon" /></li>
        {/* Availability Schedule */}
              <li className={styles.availability_box}>
                <AvailabilityList availability_schedule={user_data.availability_schedule}/>
              </li>
        {/* Perms List */}
        <li className={styles.perms_box}>
          <PermsList permissions={permissions}/>
        </li>
        <li className={`${styles["buttons-wrapper"]}`}>
          {user_data.role_name === "Employee" && <Link href={"/private_routes/mailer?subject=Edit Data Request"} className={`grey-button`}>Edit Request</Link>}
          <Link href={"/private_routes/mailer?subject=Retirement Request"} className={`red-button`}>Retire Request</Link>
        </li>
      </ul>
    </div>
    </>
  );
};

const NurseProfile = ({ user_data, permissions }) => {
  return (
    <>
    <div className={styles["profile-info"]}>
      <h1 className={styles["profile-name"]}>{user_data.emp_name}</h1>
      <p className={styles["profile-position"]}>{`${user_data.emp_title} | ${user_data.emp_specialty}` || "Nurse"}</p>
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
        <li className={styles.role_box}><strong>Role: </strong>{user_data.role_name} <Image src={pickRoleIcon(user_data.role_name)} width={"30"} height={"30"} alt="nurse role icon" /></li>
        {/* Availability Schedule */}
              <li className={styles.availability_box}>
                <AvailabilityList availability_schedule={user_data.availability_schedule}/>
              </li>
        {/* Perms List */}
        <li className={styles.perms_box}>
          <PermsList permissions={permissions}/>
        </li>
        <li className={`${styles["buttons-wrapper"]}`}>
          {user_data.role_name === "Employee" && <Link href={"/private_routes/mailer?subject=Edit Data Request"} className={`grey-button`}>Edit Request</Link>}
          <Link href={"/private_routes/mailer?subject=Retirement Request"} className={`red-button`}>Retire Request</Link>
        </li>
      </ul>
    </div>
    </>
  );
};

const PatientProfile = ({ user_data, permissions }) => {
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

    <div className={styles["profile-details"]}>
      <ul className={styles["activity-list"]}>
        <li><strong>Insurance Provider:</strong> {user_data.insurance_provider}</li>
        <li><strong>Insurance ID:</strong> {user_data.insurance_id}</li>
        <li><strong>Last Visit:</strong> {user_data.last_visit_date}</li>
        <li className={styles.role_box}><strong>Role: </strong>Patient <Image src={pickRoleIcon("Patient")} width={"30"} height={"30"} alt="patient role icon" /></li>
        <li className={styles.perms_box}>
          <strong className={styles.perms_header}>Permissions</strong>
          <div className={styles.perms_wrapper}>
            {permissions[0] !== "None" ? permissions.map((perm) => (
              <span key={perm} className="perm">{perm}</span>
            )) : "None"}
          </div>
        </li>
        <li className={`${styles["buttons-wrapper"]}`}>
          <Link href={"/private_routes/mailer?subject=Edit Data Request"} className={`grey-button`}>Edit Request</Link>
          <Link href={"/private_routes/mailer?subject=Account Deletion Request"} className={`red-button`}>Delete Account</Link>
        </li>
      </ul>
    </div>
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