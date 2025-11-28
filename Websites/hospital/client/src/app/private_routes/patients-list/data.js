

let inputs_info= [
    {  key:"user_email",label:"Email", name: "user_email", type: "email" },
    { key:"user_name",label:"Name", name: "user_name", type: "text" },
    { key:"patient_phone",label:"Phone ", name: "patient_phone", type: "text" },
]

let selectsElementsData = [
    {   
        key:"Inpatient care",
        label:"Inpatient care",
        name:"isAssignedToRoom",
        options:[{value:true,text:"yes"},{value:false,text:"no"}],
        
    },
    
]
 

export   {selectsElementsData ,inputs_info}