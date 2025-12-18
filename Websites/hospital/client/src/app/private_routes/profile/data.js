const selfEditableFields = {
  shared: {
    inputs_info: [
      {
        key: "user_email",
        label: "Email",
        name: "user_email",
        type: "email",
      },
    ],
  },

  patient: {
    inputs_info: [
      {
        key: "patient_phone",
        label: "Phone Number",
        name: "patient_phone",
        type: "tel",
      },
      {
        key: "patient_address",
        label: "Address",
        name: "patient_address",
        type: "text",
      },
      {
        key: "patient_gender",
        label: "Gender",
        name: "patient_gender",
        type: "select",
        options: ["Male", "Female", "Other"],
      },
      {
        key: "date_of_birth",
        label: "Date of Birth",
        name: "date_of_birth",
        type: "date",
      },
      {
        key: "emergency_contact",
        label: "Emergency Contact",
        name: "emergency_contact",
        type: "text",
      },
    ],
  },

  doctor: {
    inputs_info: [],
  },

  surgeon: {
    inputs_info: [],
  },

  nurse: {
    inputs_info: [],
  },
};

const approvalRequiredFields = {
  shared: {
    inputs_info: [],
  },

  patient: {},

  doctor: {
    inputs_info: [
      {
        key: "initial_consultation_price",
        label: "Initial Consultation Price",
        name: "initial_consultation_price",
        type: "number",
        approval_required_from: ["finance", "admin"],
      },
      {
        key: "followup_consultation_price",
        label: "Follow-up Consultation Price",
        name: "followup_consultation_price",
        type: "number",
        approval_required_from: ["finance", "admin"],
      },
      {
        key: "years_of_exp",
        label: "Years of Experience",
        name: "years_of_exp",
        type: "number",
        approval_required_from: ["hr"],
      },
    ],
  },

  surgeon: {
    inputs_info: [
      {
        key: "initial_consultation_price",
        label: "Initial Consultation Price",
        name: "initial_consultation_price",
        type: "number",
        approval_required_from: ["finance", "admin"],
      },
      {
        key: "followup_consultation_price",
        label: "Follow-up Consultation Price",
        name: "followup_consultation_price",
        type: "number",
        approval_required_from: ["finance", "admin"],
      },
      {
        key: "surgery_price",
        label: "Surgery Price",
        name: "surgery_price",
        type: "number",
        approval_required_from: ["finance", "admin"],
      },
      {
        key: "years_of_exp",
        label: "Years of Experience",
        name: "years_of_exp",
        type: "number",
        approval_required_from: ["hr"],
      },
    ],
  },

  nurse: {
    inputs_info: [
      {
        key: "floor_number",
        label: "Assigned Floor",
        name: "floor_number",
        type: "number",
        approval_required_from: ["admin"],
      },
    ],
  },
};




export { selfEditableFields , approvalRequiredFields };
