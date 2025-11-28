import Select from "../Select/Select";
import Link from "next/link";
import Inputs from "../Inputs/Inputs"
import { useEffect , useState} from "react";
import { global_mapped_specialities } from "@/global_data";



function UpdateUserFormFields({
    references,
    check_box,
    select_options,
    isEditing,
    setIsEditing,
    formBtnState,
    user_displayed,
    user_data,
    styles,
}){
    /* Get Change of title's selected value */
    console.log("UpdateUserFormFields user_displayed",user_displayed)
    const [selectedTitleValue, setSelectedTitleValue] = useState(user_displayed?.emp_title ?? "");

    /* Get Corresponding specialities for title */
    const specialities_for_title = {label:"specialty",options: global_mapped_specialities[selectedTitleValue]};

    console.log("UpdateUserFormFields",select_options,"selectedTitleValue",selectedTitleValue, "specialities_for_title",specialities_for_title)
    return (
        <>
        {/* display select for positions */}
        <Select styles={styles} defaultValue = {user_displayed && user_displayed[select_options.select_title_options.name] } select_options={select_options.select_title_options} user_displayed={user_displayed} reference={references.selectBoxsRef} onChange={(e)=>setSelectedTitleValue(e.target.value)}/>
        <Select styles={styles} defaultValue = {user_displayed && user_displayed[specialities_for_title.name] } select_options={specialities_for_title} user_displayed={user_displayed} reference={references.selectBoxsRef}/>
        {/* display select for Role */}
        {select_options.select_role_options && <Select styles={styles} defaultValue = {user_displayed && user_displayed[select_options.select_role_options.name] }  select_options={select_options.select_role_options} user_displayed={user_displayed} reference={references.selectBoxsRef}/>}
        {/* Update Role If you have permission*/}
        {user_data.role_name === "SuperAdmin" && 
                <div className={styles.perms_checkbox}>
                    {<Inputs inputs_info={check_box} type={"checkbox"} user_displayed={user_displayed}  references = {references.checkBoxsRef}/>}
                </div>
            }
        {/* cancel edit button */}
        {isEditing && 
            <button
                onClick={()=>setIsEditing(false)}
                className={styles.formButton}
                disabled={formBtnState === "Submitting"}
                type="button"
            >
                Cancel
            </button>}
        </>
    )
}

function LoginFormFields({
  styles,
}){
    return (
        <>
        <div className={styles.pass}>
                    <Link href="/forget-password">Forgot Password?</Link>
        </div>
        <div className={styles.signup_link}>
                    Not a member? <Link href="/register">Signup</Link>
                </div>
        </>
    )
}


const FormFieldsMap = {
    update_form: UpdateUserFormFields,
    login_form: LoginFormFields,
};

export {FormFieldsMap};