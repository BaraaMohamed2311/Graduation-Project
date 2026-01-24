import pickRoleIcon from "@/utils/pickRoleIcon";
import Link from "next/link";
import MoneyShortner from "@/utils/MoneyShortner";
import styles from "./ConsultationDisplay.module.css";
import Image from "next/image";
import {convertTimeUTCToLocal,to12Hour } from "@/utils/Date/timeHelpers"



// ===================================================
//            Availability Rendering
// ===================================================
const AvailabilityList = ({ availability_schedule }) => {
  return (
    <>
      <strong className={styles.availability__title}>Availability</strong>
      <div className={styles.availability__list}>
        {availability_schedule ? (
          availability_schedule.split("; ").map((schedule) => {
            const [dayIndex, timeRange] = schedule.split(": ");
            const [startTime, endTime] = timeRange.split("-");
            const days  = {
                    0: "Sun",
                    1: "Mon",
                    2: "Tue",
                    3: "Wed",
                    4: "Thu",
                    5: "Fri",
                    6: "Sat"
                    };


            return (
              <div key={dayIndex} className={styles.availability__item}>
                <span className={styles.availability__day}>{days[dayIndex] || `Day ${dayIndex}`}</span>
                <span className={styles.availability__time}>{to12Hour(convertTimeUTCToLocal(startTime))} - {to12Hour(convertTimeUTCToLocal(endTime))}</span>
              </div>
            );
          })
        ) : "No schedule available"}
      </div>
    </>
  );
};




// ===================================================
//            Common Profile Component
// ===================================================
const StaffProfile = ({ user_data, roleType }) => {
  const title = `${user_data.emp_title || roleType} | ${user_data.emp_specialty || ""}`;
  const priceLabel = roleType === "Surgeon" ? "Surgery Price" : "Consultation Price";

  return (
    <>
      <div className={styles.profileHeader}>
        <h1 className={styles.profileHeader__name}>{user_data.user_name}</h1>
        <p className={styles.profileHeader__title}>{title}</p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        {roleType !== "Nurse" && (
          <>
            <p><strong>{priceLabel}:</strong> {MoneyShortner(user_data.initial_consultation_price || user_data.surgery_price)}</p>
            <p><strong>Follow-up Price:</strong> {MoneyShortner(user_data.followup_consultation_price)}</p>
          </>
        )}
        {roleType === "Nurse" && (
          <>
            <p><strong>Shift:</strong> {user_data.shift_type}</p>
            <p><strong>Department:</strong> {user_data.department}</p>
          </>
        )}
        <p><strong>Experience:</strong> {user_data.years_of_exp} years</p>
      </div>

      <div className={styles.profileDetails}>
        <ul className={styles.profileDetails__list}>
          <li className={styles.profileDetails__role}>
            <strong>Role:</strong> {user_data.role_name}{" "}
            <Image
              src={pickRoleIcon(user_data.role_name)}
              width={30}
              height={30}
              alt={`${roleType.toLowerCase()} role icon`}
            />
          </li>

          <li className={styles.profileDetails__availability}>
            <AvailabilityList availability_schedule={user_data.availability_schedule} />
          </li>

          <li className={styles.profileActions}>
            {user_data.role_name === "Employee" && (
              <Link href={"/private_routes/mailer?subject=Edit Data Request"} className="grey-button">
                Edit Request
              </Link>
            )}
            <Link href={"/private_routes/mailer?subject=Retirement Request"} className="red-button">
              Retire Request
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

// ===================================================
//            Patient Profile Component
// ===================================================
const PatientProfile = ({ user_data }) => {
  return (
    <>
      <div className={styles.profileHeader}>
        <h1 className={styles.profileHeader__name}>{user_data.patient_name}</h1>
        <p className={styles.profileHeader__title}>Patient</p>
        <p><strong>Email:</strong> {user_data.user_email}</p>
        <p><strong>Phone:</strong> {user_data.phone_number}</p>
        <p><strong>Date of Birth:</strong> {user_data.date_of_birth}</p>
        <p><strong>Emergency Contact:</strong> {user_data.emergency_contact}</p>
      </div>

      <div className={styles.profileDetails}>
        <ul className={styles.profileDetails__list}>
          <li><strong>Insurance Provider:</strong> {user_data.insurance_provider}</li>
          <li><strong>Insurance ID:</strong> {user_data.insurance_id}</li>
          <li><strong>Last Visit:</strong> {user_data.last_visit_date}</li>

          <li className={styles.profileActions}>
            <Link href={"/private_routes/mailer?subject=Edit Data Request"} className="grey-button">
              Edit Request
            </Link>
            <Link href={"/private_routes/mailer?subject=Account Deletion Request"} className="red-button">
              Delete Account
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

// ===================================================
//            Export Profile Components
// ===================================================
export const UserDetailsComponents = {
  doctor: (props) => <StaffProfile {...props} roleType="Doctor" />,
  surgeon: (props) => <StaffProfile {...props} roleType="Surgeon" />,
  nurse: (props) => <StaffProfile {...props} roleType="Nurse" />,
  patient: PatientProfile,
};
