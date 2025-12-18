import { global_title,global_specialty , global_roles } from "@/global_data";

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
    ,
    {

        label:"Rate",
        type:"Number",
        name:"emp_rate",
        

    }
    
];


let select_role_options ={
     key:"role_name",
    label:"Select Role",
    name:"role_name",
    options:global_roles,

}



let check_box = {
    perms_check_box :[ 
    {
        label:"Modify Employee Data",
        value:"Modify Employee Data",
        name:"Modify Employee Data",
        type:"checkbox",
        

    },
    {

        label:"Modify Patient Files",
        value:"Modify Patient Files",
        name:"Modify Patient Files",
        type:"checkbox",
        

    },
    {
        label:"Modify Employee Perms",
        value:"Modify Employee Perms",
        name:"Modify Employee Perms",
        type:"checkbox",
        

    },
    {
        label:"Modify Employee Role",
        value:"Modify Employee Role",
        name:"Modify Employee Role",
        type:"checkbox",
        

    },
    {
        label:"Delete Patient",
        value:"Delete Patient",
        name:"Delete Patient",
        type:"checkbox",
        

    },
    {
        label:"Access Rooms",
        value:"Access Rooms",
        name:"Access Rooms",
        type:"checkbox",
        

    },
    {
        label:"Modify Rooms",
        value:"Modify Rooms",
        name:"Modify Rooms",
        type:"checkbox",
        

    },
    {
        label:"Modify Other Patient",
        value:"Modify Other Patient",
        name:"Modify Other Patient",
        type:"checkbox",
        

    },
    {
        label:"Modify Patient Data",
        value:"Modify Patient Data",
        name:"Modify Patient Data",
        type:"checkbox",
        

    }
    



]};

let select_def = {select_role_options }

export  {inputs_info , select_def  , check_box}