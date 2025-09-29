const SuperAdmin = require("../../Classes/SuperAdmin");
const Admin = require("../../Classes/Admin");
async function deletePatient(ModifierRole, otherUserRole,patient_id) {

            if (ModifierRole === "SuperAdmin") {
                return await SuperAdmin.RemovePatientUser(patient_id , otherUserRole);
            } 
            else if (ModifierRole === "Admin") {
                return await Admin.RemovePatientUser(patient_id, otherUserRole);
            }

}

    module.exports = deletePatient;