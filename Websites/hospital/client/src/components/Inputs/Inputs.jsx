import {InputLabelMaps} from "./Inputs_Fields"




 export default function Inputs({inputs_info ,type , formKind , defaultValues = {} , references }){
    console.log()
    const InputComponent = InputLabelMaps[type] || InputLabelMaps["normal_input"]; // Default to RegularInput if type is not found
    return ( 
        <InputComponent inputs_info={inputs_info} formKind={formKind}  defaultValues={defaultValues}  references ={references }></InputComponent>
        
    )
}