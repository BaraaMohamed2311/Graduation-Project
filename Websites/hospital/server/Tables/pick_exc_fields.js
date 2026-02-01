const SELF_UPDATE_FIELDS = [
  "user_name",
  "user_email",
  "patient_address",
  "patient_phone",
  "patient_address",
  "date_of_birth",
  "emergency_contact",
  "patient_gender",
];

const EXCLUDE_UPDATE_FIELDS = [
  "emp_salary",
  "emp_bonus",
  "emp_abscence",
  "emp_rate"
];

function pickAllowedFields(source, allowed) {
  const forbiddenFields = Object.keys(source).filter(key => !allowed.includes(key));
  if (forbiddenFields.length > 0) {
    throw new Error(`Attempted to update forbidden fields: ${forbiddenFields.join(", ")}`);
  }
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => allowed.includes(key))
  );
}

function excludeFields(source, excluded) {
  const forbiddenFields = Object.keys(source).filter(key => excluded.includes(key));
  if (forbiddenFields.length > 0) {
    throw new Error(`Attempted to update excluded fields: ${forbiddenFields.join(", ")}`);
  }
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !excluded.includes(key))
  );
}



module.exports = {SELF_UPDATE_FIELDS,EXCLUDE_UPDATE_FIELDS,excludeFields , pickAllowedFields};