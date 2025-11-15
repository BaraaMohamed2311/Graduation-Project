 const global_perms = [
    { value: "Modify Employee Data", text: "Modify Employee Data" },
    { value: "Modify Patient Files", text: "Modify Patient Files" },
    { value: "Modify Employee Perms", text: "Modify Employee Perms" },
    { value: "Modify Employee Role", text: "Modify Employee Role" },
    { value: "Modify Role", text: "Modify Role" },
    { value: "Modify Other Patient", text: "Modify Other Patient" },
    { value: "Modify Patient Data", text: "Modify Patient Data" },
    { value: "Delete Patient", text: "Delete Patient" },
    { value: "Access Rooms", text: "Access Rooms" },
    { value: "Modify Rooms", text: "Modify Rooms" }



    ]
    

    const global_rooms = [
      { value: 1, text: 1 },
      { value: 2, text: 2 },
      { value: 3, text: 3 },
      { value: 4, text: 4 },
      { value: 5, text: 5 },

    ];
    const global_floors = [
      { value: 1, text: 1 },
      { value: 2, text: 2 },
      { value: 3, text: 3 },
      { value: 4, text: 4 },
      { value: 5, text: 5 },

    ];



// All titles in the system
const global_title = [
    { value: "HR", text: "HR" },
    { value: "Manager", text: "Manager" },
    { value: "Doctor", text: "Doctor" },
    { value: "Nurse", text: "Nurse" },
    { value: "Surgeon", text: "Surgeon" }
];

// titles of the hospital 
const global_hospital_title = [
    { value: "Manager", text: "Manager" },
    { value: "Doctor", text: "Doctor" },
    { value: "Nurse", text: "Nurse" },
    { value: "Surgeon", text: "Surgeon" }
];

// bookable titles of the hospital
const global_bookable_hospital_title = [
    { value: "Doctor", text: "Doctor" },
    { value: "Surgeon", text: "Surgeon" }
];

const global_specialty = [

    // Hospital specialities
    { value: "Pediatrics (Kids)", text: "Pediatrics (Kids)" },
    { value: "Cardiology (Heart)", text: "Cardiology (Heart)" },
    { value: "Pulmonology (Lungs)", text: "Pulmonology (Lungs)" },
    { value: "Neurology (Brain)", text: "Neurology (Brain)" },
    { value: "Oncology (Cancer)", text: "Oncology (Cancer)" },
    { value: "Dermatology (Skin)", text: "Dermatology (Skin)" },

    { value: "Children''s Nursing", text: "Children''s Nursing" },
    { value: "Intensive Care Nursing", text: "Intensive Care Nursing" },
    { value: "Emergency Room Nursing", text: "Emergency Room Nursing" },
    { value: "Cancer Nursing", text: "Cancer Nursing" },

    { value: "Heart Surgery", text: "Heart Surgery" },
    { value: "Brain Surgery", text: "Brain Surgery" },
    { value: "Orthopedic Surgery", text: "Orthopedic Surgery" },
    { value: "ENT Surgery", text: "ENT Surgery" },
    { value: "Plastic Surgery", text: "Plastic Surgery" }
];

const global_mapped_specialities = {
  "Developer": [
    { value: "Front-End", text: "Front-End" },
    { value: "Back-End", text: "Back-End" },
    { value: "Full-Stack", text: "Full-Stack" }
  ],
  "Manager": [
    { value: "Manager", text: "Manager" },
  ],

  "HR": [
    { value: "HR", text: "HR" }
  ],


  "Doctor": [
    { value: "Pediatrics (Kids)", text: "Pediatrics (Kids)" },
    { value: "Cardiology (Heart)", text: "Cardiology (Heart)" },
    { value: "Pulmonology (Lungs)", text: "Pulmonology (Lungs)" },
    { value: "Neurology (Brain)", text: "Neurology (Brain)" },
    { value: "Oncology (Cancer)", text: "Oncology (Cancer)" },
    { value: "Dermatology (Skin)", text: "Dermatology (Skin)" }
  ],
  "Nurse": [
    { value: "Children''s Nursing", text: "Children''s Nursing" },
    { value: "Intensive Care Nursing", text: "Intensive Care Nursing" },
    { value: "Emergency Room Nursing", text: "Emergency Room Nursing" },
    { value: "Cancer Nursing", text: "Cancer Nursing" }
  ],
  "Surgeon": [
    { value: "Heart Surgery", text: "Heart Surgery" },
    { value: "Brain Surgery", text: "Brain Surgery" },
    { value: "Orthopedic Surgery", text: "Orthopedic Surgery" },
    { value: "ENT Surgery", text: "ENT Surgery" },
    { value: "Plastic Surgery", text: "Plastic Surgery" }
  ]
}


    
    const global_roles = [
            {value:"SuperAdmin", text:"SuperAdmin"},
            {value:"Admin", text:"Admin"},
            {value:"NormalUser", text:"NormalUser"},
    ]

        export  { 
          global_perms,
          global_roles,
          global_title, 
          global_specialty, 
          global_mapped_specialities,
          global_rooms,
          global_floors,
          global_hospital_title,
          global_bookable_hospital_title
        };