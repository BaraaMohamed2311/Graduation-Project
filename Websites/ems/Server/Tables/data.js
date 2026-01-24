

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
    "user_name",
    "emp_title",
    "emp_specialty",
    "user_password",
    "user_email"
  ],



  // ==========================================
  // Role & Permission Tables
  // ==========================================


  roles: [
    "hosp_emp_id",
    "role_name"
  ],



  perms: [
    "perm_id",
    "perm_name"
  ],


  employee_perms: [
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

};

const TableAliases = {
  users: 'u',
  employees: 'e',
  availability: 'a',
  floors: 'f',
  roles: 'r',
  perms: 'p',
  employee_perms: 'ep',
};
const permNames = [
  "Modify Data",
  "Modify Salary",
  "Display Salary",
  "Accept Registered",
  "Modify Perms",
  "Modify Role",
  "Delete User"
];

const setOfPerms = new Set(permNames);

const approvalRequiredFields = {
  patients: [],
  employees: [],
  doctors: ['initial_consultation_price', 'followup_consultation_price', 'years_of_exp'],
  surgeons: ['initial_consultation_price', 'followup_consultation_price', 'surgery_price', 'years_of_exp'],
  nurses: ['floor_number'],

};

const roleToEntityMap = {
  patient: 'patients',
  employee: 'employees',
  doctor: 'doctors',
  surgeon: 'surgeons',
  nurse: 'nurses',
};

const hospitalJobs = new Set(["Doctor", "Nurse", "Surgeon"]);

module.exports = {TableAliases , Tables ,setOfPerms ,approvalRequiredFields,roleToEntityMap , hospitalJobs};