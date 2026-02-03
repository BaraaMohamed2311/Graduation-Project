# General
- systems are managed with roles and perms
- users with higher roles can modify others data of users lower roles but not vice versa
- To modify role of other user you must be SuperAdmin

# Employee Management System

Generally
- User can modify his own data (allowed data only like email, name etc.)
- Important data like salary cannot be modified by user himself
- Any modification is Audited

new User Scenario
- User registers
- User gets accepted or declined by other user with permission
- Wether user is accepted/declined he gets notified via email
- If user is accepted his data is added to general user tables and action is audited
old User Scenario
- User can modify other user's data he has "Modify Employee Data" permission
- User can see other user's salary he has "Display Salary" permission
- User can modify other user's salary he has "Modify Salary" permission
- User can modify other user's role he has "Modify Employee Role" permission
- User can modify other user's perms he has "Modify Employee Perms" permission

# Hospital

Generally
- User can modify his own data (allowed data only like email, name etc.)
- Any modification is Audited

Patient 
- Can book consultations appointment
- Can list his booked consultations
- Cannot Modify his healthstatus nor files, it's staff's responsibility

Employees
- Can modify others if they have required perms and role
- Can modify rooms in hospital if they have required perms and role
- They do not have access to modify fields related to management department like salaries etc.
- They can access and modify patients' data & files if required perms existed



