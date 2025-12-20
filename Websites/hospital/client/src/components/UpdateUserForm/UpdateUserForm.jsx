import Form from "../Form/Form";
import { useState } from "react";
import styles from "./update_emp_form.module.css";
import { useRouter } from "next/navigation";
export default function UpdateUserForm({
    url,
  isEditing,
  setIsEditing,
  user_displayed,
    currPage,
    // New props
    references, // Contains all refs: inputsBoxsRef, checkBoxsRef, selectBoxsRef
    update_handler,
    modifier_data,
    fieldDefinitions,
    isUpdatingSelf=false
 

}) {
  
    let [formBtnState, setFormBtnState] = useState("Update");
    let [isLoadingBtn , setIsLoadingBtn ] = useState(false);
    let {inputsBoxsRef , checkBoxsRef , selectBoxsRef} = references;
        const { select_role_options, ...otherOptions } = fieldDefinitions.select_def || {};
    const { perms_check_box, ...otherCheckBoxes } = fieldDefinitions.check_box || {};

    // if updating other user we have to check that modifier is authorized 
    if(!isUpdatingSelf){
        const is_authorized_to_update_roles = modifier_data.emp_perms && modifier_data.emp_perms.has("Modify Employee Role");
        const is_authorized_to_update_perms = modifier_data.emp_perms && modifier_data.emp_perms.has("Modify Employee Perms");


        const authorized_select_def = is_authorized_to_update_roles ? fieldDefinitions.select_def : otherOptions;
        const  authorized_check_box = is_authorized_to_update_perms ? fieldDefinitions.check_box  : otherCheckBoxes;
        fieldDefinitions = {select_def : authorized_select_def ,  check_box : authorized_check_box , inputs_info : fieldDefinitions.inputs_info}
    }
    
    console.log("authorized fieldDefinitions",fieldDefinitions)

    return (
        <div className={styles["update-emp-page"]}>
            <div className={styles["center"]}>
                {/* we have to check user modifier perms to check which inputs are displayed for editable fields  */}
                <Form 
                    references ={{ inputsBoxsRef, checkBoxsRef ,selectBoxsRef}} 
                    form_handler = {(e)=>update_handler(e ,url )}
                    // add employee_displayed to form to show prev values of inputs
                    user_displayed = {user_displayed} 
                    fieldDefinitions={fieldDefinitions}
                    formBtnState = {formBtnState}  
                    isLoginPage={false} 
                    isEditing={isEditing}  
                    setIsEditing={setIsEditing} 
                    formKind={"update_form"}/>
            </div>
        </div>
    )
}