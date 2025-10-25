

let inputs_info= [
    {  key:"patient_email",label:"Email", name: "patient_email", type: "email" },
    { key:"patient_name",label:"Name", name: "patient_name", type: "text" },
    { key:"patient_phone",label:"Phone ", name: "patient_phone", type: "text" },
]

let selectsElementsData = [
    {   
        ref: null,
        key:"Inpatient care",
        label:"Inpatient care",
        name:"isAssignedToRoom",
        options:[{value:true,text:"yes"},{value:false,text:"no"}],
        
    },
    
]
 

export   {selectsElementsData ,inputs_info}