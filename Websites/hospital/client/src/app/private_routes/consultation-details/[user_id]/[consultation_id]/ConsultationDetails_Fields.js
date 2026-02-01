
import MoneyShortner from "@/utils/MoneyShortner";
import styles from "./ConsultationDisplay.module.css";







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
        <p><strong>Phone:</strong> {user_data.patient_phone}</p>
        <p><strong>Date of Birth:</strong> {user_data.date_of_birth ? user_data.date_of_birth.split("T")[0] :""}</p>
        <p><strong>Emergency Contact:</strong> {user_data.emergency_contact}</p>
      </div>

      <div className={styles.profileDetails}>
        <ul className={styles.profileDetails__list}>
          <li><strong>Insurance Provider:</strong> {user_data.insurance_provider}</li>
          <li><strong>Insurance ID:</strong> {user_data.insurance_id}</li>
          <li><strong>Last Visit:</strong> {user_data.last_visit_date}</li>

          
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
