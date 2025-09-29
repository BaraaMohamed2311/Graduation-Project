const Tables = {
  employee_perms: [
    "perm_id",
    "emp_id"
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
  ],
  perms: [
    "perm_id",
    "perm_name"
  ],
  roles: [
    "emp_id",
    "emp_email",
    "role_name"
  ],
  unregistered_employees: [
    "emp_id",
    "emp_name",
    "emp_title",
    "emp_specialty",
    "emp_password",
    "emp_email"
  ]
};

module.exports = Tables;
