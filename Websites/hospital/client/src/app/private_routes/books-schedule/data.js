import {  global_consultation_types,
          global_consultation_status} from "@/global_data"


let select_options = [
    {   

        key:"Status",
        label:"Status",
        name:"consultation_status",
        options:global_consultation_status,
        
    },
    {   

        key:"Consultation Type",
        label:"Consultation Type",
        name:"consultation_type",
        options:global_consultation_types,
        
    },
    {   

        key:"Date Order",
        label:"Date Order",
        name:"consultation_date",
        options:[{ value: "htl", text: "High To Low" },{ value: "lth", text: "Low To High" }],
        
    },
   

]
 

export   {select_options}