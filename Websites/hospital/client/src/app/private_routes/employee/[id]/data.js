import { global_title,global_specialty , global_roles ,global_perms } from "@/global_data";

let inputs_info = [ 
    {

        label:"Email",
        type:"email",
        name:"user_email",
        

    },
    {

        label:"Name",
        type:"text",
        name:"user_name",
        

    }
    
    
];


// Title-specific fields mapping
const title_specific_fields = {
    "Doctor": [],
    "Surgeon": [],
    "Nurse": [
        {
            label: "Floor Number",
            type: "number",
            name: "floor_number",
        }
    ],
    // Add more titles as needed
};

// Helper function to get all fields for a specific title
export const getFieldsForTitle = (title) => {
    const specificFields = title_specific_fields[title] || [];
    return [...inputs_info, ...specificFields];
};


let select_role_options ={
     key:"role_name",
    label:"Select Role",
    name:"role_name",
    options:global_roles,

}



let check_box = {
    perms_check_box: global_perms.map(perm => ({
        label: perm.text,
        value: perm.value,
        name: perm.value,
        type: "checkbox"
    }))
};

let select_def = {select_role_options }

export  {inputs_info , select_def  , check_box , title_specific_fields}