import styles from "./inputs.module.css"

function CheckBoxInput({inputs_info , references , employee_displayed  }){
    // convert perms to set for easier checking
    const employee_permsSet = employee_displayed? new Set(employee_displayed.emp_perms.split(", ")) : "";
    
    
    return (
        <div className={styles.check_inputs_wrapper}>
                {
                    inputs_info && inputs_info.map((input,indx)=>{
                        return (
                            <div key={input.name} className={styles.check_input_wrapper }>
                                {/* if employee_displayed exists then check if he had that perm by set of perms he has*/}
                                <input required={input.isRequired || false} name={input.name}  ref={(el)=> references.current[input.name]= el} type={input.type} defaultChecked={employee_permsSet? employee_permsSet.has(input.name):false } />
                                <span></span>
                                <label>{input.label}</label>
                            </div>
                        )
                    })
                }
            </div> 
    )
}

function LabeledInput({inputs_info  , formKind , employee_displayed , references } ){

    return (
        <div className={ inputsWrapperClassMap[formKind] || inputsWrapperClassMap["default"]}>
            
                {
                    
                    inputs_info && inputs_info.map((input,indx)=>{
                        return (
                            <div key={input.name} className={styles.txt_field }>
                                {/* if input is checkbox then add value attribute with same Value as Name*/}
                                <input required={input.isRequired || false} name={input.name}  ref={(el)=>references.current[input.name] = el} type={input.type} defaultValue={employee_displayed ? employee_displayed[input.name]:""} />
                                <span></span>
                                <label>{input.label}</label>
                            </div>
                        )
                    })
                }
            </div>
    )
}

function NormalInput({inputs_info  , formKind , employee_displayed , references } ){

    return (
        <div className={ inputsWrapperClassMap[formKind] || inputsWrapperClassMap["default"]}>
            
                {
                    
                    inputs_info && inputs_info.map((input,indx)=>{
                        return (
                            <div key={input.name} className={styles.txt_field }>
                                {/* if input is checkbox then add value attribute with same Value as Name*/}
                                <input required={input.isRequired || false} name={input.name} placeholder={input.label? input.label : "Type Here"} ref={(el)=>references.current[input.name] = el} type={input.type} defaultValue={employee_displayed ? employee_displayed[input.name]:""} />
                                <span></span>
                            </div>
                        )
                    })
                }
            </div>
    )
}

const InputMaps = {
    "checkbox": CheckBoxInput,
    "labeled_input": LabeledInput,
    "normal_input": NormalInput
}


const inputsWrapperClassMap = {
  "sided_inputs": styles.sided_inputs_wrapper,
  "col_inputs": styles.colm_inputs_wrapper,
  "row_inputs": styles.row_inputs_wrapper,
  "default": styles.colm_inputs_wrapper
};


 export default function Inputs({inputs_info ,type , formKind , employee_displayed , references }){
    
    const InputComponent = InputMaps[type] || NormalInput; // Default to RegularInput if type is not found
    return ( 
        <InputComponent inputs_info={inputs_info} formKind={formKind}  employee_displayed={employee_displayed}  references ={references }></InputComponent>
        
    )
}