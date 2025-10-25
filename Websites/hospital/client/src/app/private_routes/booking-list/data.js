import { global_title } from "@/global_data"

let selectsElementsData = [
    {   
        ref: null,
        key:"Title",
        label:"Title",
        name:"emp_title",
        options:[],
        
    },
    {   
        ref: null,
        key:"Consultion Price",
        label:"Consultion Price",
        name:"initial_consultation_price",
        options:[{ value: "High To Low", text: "High To Low" },{ value: "Low To High", text: "Low To High" }],
        
    },
    {   
        ref: null,
        key:"Surgery Price",
        label:"Surgery Price",
        name:"surgery_price",
        options:[{ value: "High To Low", text: "High To Low" },{ value: "Low To High", text: "Low To High" }],
        
    },


]
 

export   {selectsElementsData}