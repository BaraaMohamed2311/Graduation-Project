import { global_title ,global_bookable_hospital_title} from "@/global_data"

let selectsElementsData = [
    {   

        key:"Title",
        label:"Title",
        name:"emp_title",
        options:global_bookable_hospital_title,
        
    },
    {   

        key:"Consultation Price",
        label:"Consultation Price",
        name:"initial_consultation_price",
        options:[{ value: "High To Low", text: "High To Low" },{ value: "Low To High", text: "Low To High" }],
        
    },
    {   

        key:"Surgery Price",
        label:"Surgery Price",
        name:"surgery_price",
        options:[{ value: "High To Low", text: "High To Low" },{ value: "Low To High", text: "Low To High" }],
        
    },


]
 

export   {selectsElementsData}