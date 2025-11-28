import Form from "../Form/Form";
import { useState } from "react";
import styles from "./update_emp_form.module.css";
import { useRouter } from "next/navigation";
export default function UpdateForm({
  isEditing,
  setIsEditing,
  user_displayed,
  currPage,
  user_data,
  inputs_info,
  select_options,
  check_box,
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

    const router = useRouter();
    

        console.log("select_optionss",select_options)



    return (
        <div className={styles["update-emp-page"]}>
            <div className={styles["center"]}>
                {/* we have to check user modifier perms to check which inputs are displayed for editable fields  */}
                <Form 
                    references ={{ inputsBoxsRef, checkBoxsRef ,selectBoxsRef}} 
                    form_handler = {(e)=>update_handler(e ,"list/update-others" , modifier_data.token )}
                    // add employee_displayed to form to show prev values of inputs
                    user_displayed = {user_displayed} 
                    // removes Role selection if no permission
                    select_options={  
                    modifier_data.emp_perms && modifier_data.emp_perms.has("Modify Role") ? select_options : {select_title_options :select_options.select_title_options }} 
                    /*removes check box of perms for user who\s not allowed to edit others perms */
                    check_box={ modifier_data.emp_perms && modifier_data.emp_perms.has("Modify Perms") ?
                                check_box : null } 


                    inputs_info = { modifier_data.emp_perms && !modifier_data.emp_perms.has("Modify Salary") && 
                        inputs_info.forEach((input , indx)=>{
                            /*this ensures only  delete salary input if no permission to edit */
                            if(input.id === "emp_salary")
                                inputs_info.splice(indx , 1)
                            }) ? inputs_info : inputs_info
                }
                    formBtnState = {formBtnState}  
                    isLoginPage={false} 
                    isEditing={isEditing}  
                    setIsEditing={setIsEditing} 
                    formKind={"update_form"}/>
            </div>
        </div>
    )
}