const Tables = {
  // ==========================================
  // Core Users Table
  // ==========================================
  users: [
    "user_id",
    "user_email",
    "user_name",
    "user_password",
    "user_type",
    "created_at",
    "latest_update"
  ],

  // ==========================================
  // Employee Related Tables
  // ==========================================
  employees: [
    "emp_id",
    "emp_salary",
    "emp_abscence",
    "emp_bonus",
    "emp_rate",
    "emp_title",
    "emp_specialty"
  ],

  employees_hospital: [
    "hosp_emp_id",
    "emp_id",
    "emp_title"
  ],

  unregistered_employees: [
    "emp_id",
    "emp_name",
    "emp_title",
    "emp_specialty",
    "emp_password",
    "emp_email"
  ],

  // ==========================================
  // Medical Staff Tables
  // ==========================================
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

  // ==========================================
  // Patient Related Tables
  // ==========================================
  patients: [
    "patient_id",
    "patient_phone",
    "patient_address",
    "isAssignedToRoom",
    "room_number",
    "floor_number",
    "date_of_birth",
    "next_check_date",
    "patient_gender",
    "emergency_contact",
    "created_at"
  ],

  staff_patient: [
    "staff_id",
    "patient_id",
    "relation_type",
    "assigned_date"
  ],

  // ==========================================
  // Role & Permission Tables
  // ==========================================


  hospital_roles: [
    "hosp_emp_id",
    "role_name"
  ],



  hospital_perms: [
    "perm_id",
    "perm_name"
  ],


  hospital_emp_perms: [
    "perm_id",
    "hosp_emp_id"
  ],

  // ==========================================
  // Scheduling & Availability Tables
  // ==========================================
  availability: [
    "availability_id",
    "hosp_emp_id",
    "day_of_week",
    "start_time",
    "end_time",
    "created_at",
    "updated_at"
  ],

  consultations: [
    "consultation_id",
    "hosp_emp_id",
    "patient_id",
    "availability_id",
    "consultation_date",
    "start_time",
    "end_time",
    "consultation_status",
    "created_at",
    "consultation_type"
  ],

  // ==========================================
  // Facility Management Tables
  // ==========================================
  floors: [
    "floor_id",
    "floor_number"
  ],

  rooms: [
    "room_id",
    "room_number",
    "floor_id",
    "patient_id",
    "isOccupied"
  ],

  // ==========================================
  // Legacy Tables (for reference - these might be deprecated)
  // ==========================================
  doctor_availability: [
    "availability_id",
    "doctor_id",
    "day_of_week",
    "start_time",
    "end_time",
    "created_at",
    "updated_at"
  ]
};

const TableAliases = {
  users: 'u',
  patients: 'p',
  employees: 'e',
  employees_hospital: 'eh',
  doctors: 'd',
  surgeons: 's',
  nurses: 'n',
  hospital_roles: 'hr',
  consultations: 'c',
  availability: 'a',
  rooms: 'r',
  floors: 'f',
  staff_patient: 'sp',
  hospital_perms: 'hp',
  hospital_emp_perms: 'hep',
};
const permissions = [
  "Access Rooms",
  "Delete Patient",
  "Modify Employee Data",
  "Modify Employee Perms",
  "Modify Employee Role",
  "Modify Other Patient",
  "Modify Patient Files",
  "Modify Rooms",
  'Modify My Patient',
  'Modify Health Status',
  'Modify Availability',
  'Access Other Patients'
];
const setOfPerms = new Set(permissions)

module.exports = {TableAliases , Tables ,setOfPerms };