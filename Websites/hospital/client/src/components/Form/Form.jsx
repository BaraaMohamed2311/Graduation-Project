import styles from "./form.module.css"; 

import Inputs from "../Inputs/Inputs"

import { useUserDataContext } from "@/contexts/user_data";

import {FormFieldsMap} from "./FormFields.js";


export default function Form({
    references, form_handler , formBtnState ,
     inputs_info,check_box, select_options ,
    formKind , isEditing , setIsEditing ,
     user_displayed , isLoadingBtn}) {

    let {user_data} = useUserDataContext();
     const Fields = FormFieldsMap[formKind] || (() => null);

    return (
        <form className={formKind === "update_form" ? styles.sided_form :""} method="post" onSubmit={form_handler}>
            
            {/* for any page display input fields with corresponding label and type */}
            <Inputs  styles={styles } type={"labled_input"} formKind={formKind} inputs_info={inputs_info} defaultValues={user_displayed} references = {references.inputsBoxsRef}/>

            {/* Form-kind-specific fields */}
            <Fields
            
                check_box={check_box}
                references={references}
                select_options={select_options}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                formBtnState={formBtnState}
                user_displayed={user_displayed}
                user_data={user_data}
                styles={styles}
            />


            {/* The submit button for each form page Login\Register\etc..*/}
            <button
                className={`${styles.formButton}  ${(isLoadingBtn ? "loading_btn" : "")}`}
                disabled={formBtnState === "Submitting"}
                type="submit"
            >
                {formBtnState}
            </button>

            
            
        </form>
    );
}
