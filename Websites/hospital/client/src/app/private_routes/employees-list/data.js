import {  global_perms, global_roles , global_title,global_specialty} from "@/global_data"

let inputs_info= [
    {  key:"user_email",label:"Email", name: "user_email", type: "email" },
    { key:"user_name",label:"Name", name: "user_name", type: "text" },
]

let selectsElementsData = [
    {   

        key:"By Title",
        label:"By Title",
        name:"emp_title",
        options:global_title,
        
    },
    {   

        key:"By specialty",
        label:"By specialty",
        name:"emp_specialty",
        options:global_specialty,
        
    },
    {   

        key:"By Role",
        label:"By Role",
        name:"role_name",
        options:global_roles,
        
    },
    {   

        key:"By Perms",
        label:"By Perms",
        name:"emp_perms",
        options:global_perms,
    }

]
 

export  {selectsElementsData , inputs_info}