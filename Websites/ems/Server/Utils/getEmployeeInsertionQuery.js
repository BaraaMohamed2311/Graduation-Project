
// !!!! IMPORTANT : MUST INSERT IN employees_hospital FIRST CUZ OTHER TABLES ARE REFRENCING hosp_emp_id FROM IT
function DoctorInsertionQuery(registered_user_id){
    return[` INSERT INTO employees_hospital (hosp_emp_id,emp_id,emp_title) VALUES (${registered_user_id},${registered_user_id},'Doctor');`, `INSERT INTO doctors (doctor_id,hosp_emp_id ) VALUES (${registered_user_id},${registered_user_id});`]
}

function NurseInsertionQuery(registered_user_id){
    return [` INSERT INTO employees_hospital (hosp_emp_id,emp_id,emp_title) VALUES (${registered_user_id},${registered_user_id},'Nurse');`,`INSERT INTO nurses (nurse_id,hosp_emp_id) VALUES (${registered_user_id},${registered_user_id});`]
}


function SurgeonInsertionQuery(registered_user_id){
    return [` INSERT INTO employees_hospital (hosp_emp_id,emp_id,emp_title) VALUES (${registered_user_id},${registered_user_id},'Surgeon');`,`INSERT INTO surgeons (surgeon_id,hosp_emp_id) VALUES (${registered_user_id},${registered_user_id});`]
}

function EmployeeInsertionQuery(registered_user_id){
    return [` INSERT INTO employees_hospital (hosp_emp_id,emp_id,emp_title) VALUES (${registered_user_id},${registered_user_id},'Employee');`]
}




const mapInsertionToTitle={
    "Doctor": DoctorInsertionQuery,
    "Nurse": NurseInsertionQuery,
    "Surgeon": SurgeonInsertionQuery
}




function getEmployeeInsertionQuery(registered_user_id,emp_title){
    // EmployeeInsertionQuery is the default option, so it specify that user is related to management not hospital itself at the employees_hospital table
    const fn = mapInsertionToTitle[emp_title] || EmployeeInsertionQuery;
    if(!fn) throw new Error("Invalid Employee Title for Insertion Query");
    return fn(registered_user_id);

}

module.exports = getEmployeeInsertionQuery;
