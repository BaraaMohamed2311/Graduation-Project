const Tables = {
  doctors: [
    "doctor_id",
    "hosp_emp_id",
    "initial_consultation_price",
    "followup_consultation_price",
    "years_of_exp"
  ],
  surgeons: [
    "surgeon_id",
    "hosp_emp_id",
    "initial_consultation_price",
    "followup_consultation_price",
    "surgery_price",
    "years_of_exp"
  ],
  nurses: [
    "nurse_id",
    "hosp_emp_id",
    "floor_number"
  ],
  patients: [
    "patient_id",
    "patient_name",
    "patient_email",
    "patient_password",
    "patient_phone",
    "patient_address",
    "isAssignedToRoom",
    "floor_number",
    "room_number",
    "date_of_birth",
    "next_check_date",
    "patient_gender",
    "emergency_contact",
    "created_at"
  ],
  doctor_patient: [
    "doctor_id",
    "patient_id",
    "assigned_date"
  ],
  doctor_availability: [
    "availability_id",
    "doctor_id",
    "day_of_week",
    "start_time",
    "end_time",
    "created_at",
    "updated_at"
  ],
  rooms: [
    "room_id" ,
    "room_number" ,
    "floor_id" ,
    "patient_id" ,
    "isOccupied" ,
  ],
  floors: [
    "floor_id",
    "floor_number"
  ],
  employees: [
    "emp_id",
    "emp_name",
    "emp_salary",
    "emp_abscence",
    "emp_bonus",
    "emp_rate",
    "emp_title",
    "emp_specialty",
    "emp_email",
    "emp_password"
  ]

};
module.exports = Tables;