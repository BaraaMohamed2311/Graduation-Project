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
        options:[{ value: "htl", text: "High To Low" },{ value: "lth", text: "Low To High" }],
        
    },
    {   

        key:"Surgery Price",
        label:"Surgery Price",
        name:"surgery_price",
        options:[{ value: "htl", text: "High To Low" },{ value: "lth", text: "Low To High" }],
        
    },
    {   

        key:"Years Of Experience",
        label:"Years Of Experience",
        name:"years_of_exp",
        options:[{ value: "htl", text: "High To Low" },{ value: "lth", text: "Low To High" }],
        
    }


]
 

export   {selectsElementsData}