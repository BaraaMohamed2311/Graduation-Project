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
  user_data,
  inputs_info=[],
  select_options={},
  check_box={},
  // New props
  references, // Contains all refs: inputsBoxsRef, checkBoxsRef, selectBoxsRef
  update_handler,
    modifier_data
 

}) {
  
    let [formBtnState, setFormBtnState] = useState("Update");
    let [isLoadingBtn , setIsLoadingBtn ] = useState(false);
    let inputsBoxsRef = references.inputsBoxsRef;
    let checkBoxsRef = references.checkBoxsRef;
    let selectBoxsRef = references.selectBoxsRef;


    
    const is_authorized_to_update_roles = modifier_data.emp_perms && modifier_data.emp_perms.has("Modify Employee Role");
    const is_authorized_to_update_perms = modifier_data.emp_perms && modifier_data.emp_perms.has("Modify Employee Perms");
    const { select_role_options, ...otherOptions } = select_options;
    const { perms_check_box, ...otherCheckBoxes } = check_box;

    console.log("inputs_info",inputs_info,"select_options",select_options,"check_box",check_box)

    return (
        <div className={styles["update-emp-page"]}>
            <div className={styles["center"]}>
                {/* we have to check user modifier perms to check which inputs are displayed for editable fields  */}
                <Form 
                    references ={{ inputsBoxsRef, checkBoxsRef ,selectBoxsRef}} 
                    form_handler = {(e)=>update_handler(e ,url , modifier_data.token )}
                    // add employee_displayed to form to show prev values of inputs
                    user_displayed = {user_displayed} 
                    // removes Role selection if no permission
                    select_options={  is_authorized_to_update_roles ? select_options : otherOptions} 
                    /*removes check box of perms for user who\s not allowed to edit others perms */
                    check_box={  is_authorized_to_update_perms ? check_box : otherCheckBoxes } 


                    inputs_info = {inputs_info}
                    formBtnState = {formBtnState}  
                    isLoginPage={false} 
                    isEditing={isEditing}  
                    setIsEditing={setIsEditing} 
                    formKind={"update_form"}/>
            </div>
        </div>
    )
}