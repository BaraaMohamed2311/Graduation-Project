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

        label:"Phone",
        type:"number",
        name:"patient_phone",
        

    },
    {

        label:"Birth Date",
        type:"date",
        name:"date_of_birth",
        

    },
    {

        label:"Emergency Contact",
        type:"text",
        name:"emergency_contact",
        

    },
    {

        label:"Patient Address",
        type:"text",
        name:"patient_address",
        

    }
    
];



let gender_select = {
    key:"patient_gender",
    label:"Select Gender",
    name:"patient_gender",
    options:[{value:"Male", text:"Male"},{value:"Female", text:"Female"}],
}



let select_def ={
    gender_select
}


export  {inputs_info ,select_def}