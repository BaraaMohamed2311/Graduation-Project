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
  // Role & Permission Tables
  // ==========================================
  roles: [
    "emp_id",
    "role_name"
  ],

  hospital_roles: [
    "hosp_emp_id",
    "role_name"
  ],

  perms: [
    "perm_id",
    "perm_name"
  ],


  employee_perms: [
    "perm_id",
    "emp_id"
  ],




};
const TableAliases = {
  users: 'u',
  employees_hospital: 'eh',
  roles: 'r',
  consultations: 'c',
  availability: 'a',
  perms: 'p',
  employee_perms: 'ep',
  unregistered_employees: 'ue'
};

// Helper function to get table fields
Tables.getFields = (tableName) => {
  return Tables[tableName] || [];
};

// Helper function to check if table exists
Tables.hasTable = (tableName) => {
  return Tables.hasOwnProperty(tableName);
};


module.exports = Tables;