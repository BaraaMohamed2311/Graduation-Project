import {global_rooms,global_floors} from "@/global_data";
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
        type:"text",
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

let isAssignedToRoom_select = {
    key:"isAssignedToRoom",
    label:"Assigned to a room?",
    name:"isAssignedToRoom",
    options:[{value:"1", text:"True"},{value:"0", text:"False"}],
}

let floorNum_select = {
    key:"floor_number",
    label:"Floor Number",
    name:"floor_number",
    options: global_floors,
}

let RoomNum_select = {
    key:"room_number",
    label:"Room Number",
    name:"room_number",
    options: global_rooms,
}


let select_def ={
    gender_select,

}


export  {inputs_info ,select_def}