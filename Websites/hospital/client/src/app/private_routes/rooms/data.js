import {   global_floors,global_rooms} from "@/global_data"



let selectsElementsData = [
    {   

        key:"By Floor",
        label:"By Floor",
        name:"floor_id",
        options:global_floors,
        
    },
    {   

        key:"By Room Number",
        label:"By Room Number",
        name:"room_number",
        options:global_rooms,
        
    },
    {   

        key:"Status",
        label:"Status",
        name:"status",
        options:[{ value: "occupied", text: "occupied" },{ value: "empty", text: "empty" }],
        
    }


]
 

export   {selectsElementsData}