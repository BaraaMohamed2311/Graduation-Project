import styles from "./employeeprofile.module.css";

function DoctorDetails({ doctor }) {
  return (
    <ul className={styles["role-details"]}>
      <li><strong>Initial Consultation Price:</strong> {doctor.initial_consultation_price} EGP</li>
      <li><strong>Follow-up Consultation Price:</strong> {doctor.followup_consultation_price} EGP</li>
      <li><strong>Years of Experience:</strong> {doctor.years_of_exp} years</li>
    </ul>
  );
}




 function SurgeonDetails({ surgeon }) {
  return (
    <ul className={styles["role-details"]}>
      <li><strong>Initial Consultation Price:</strong> {surgeon.initial_consultation_price} EGP</li>
      <li><strong>Follow-up Consultation Price:</strong> {surgeon.followup_consultation_price} EGP</li>
      <li><strong>Surgery Price:</strong> {surgeon.surgery_price} EGP</li>
      <li><strong>Years of Experience:</strong> {surgeon.years_of_exp} years</li>
    </ul>
  );
}




function NurseDetails({ nurse }) {
  return (
    <ul className={styles["role-details"]}>
      <li><strong>Assigned Floor Number:</strong> {nurse.floor_number !== -1 ? nurse.floor_number : "Not Assigned"}</li>
    </ul>
  );
}


const MapToEmployeeDetails = {
    "Doctor":DoctorDetails,
    "Surgeon":SurgeonDetails,
    "Nurse":NurseDetails

}

export default MapToEmployeeDetails