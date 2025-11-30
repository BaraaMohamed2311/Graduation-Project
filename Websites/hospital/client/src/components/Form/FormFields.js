import Select from "../Select/Select";
import Link from "next/link";
import Inputs from "../Inputs/Inputs"
import { useEffect , useState , useMemo} from "react";
import { global_mapped_specialities } from "@/global_data";



function DynamicSelect({ selectOption, userDisplayed, references, onChange, styles }) {
    console.log("selectOption",selectOption)
    if (!selectOption) return null;

    return (
        <Select
            styles={styles}
            defaultValue={userDisplayed && userDisplayed[selectOption.name]}
            select_options={selectOption}
            user_displayed={userDisplayed}
            reference={references.selectBoxsRef}
            onChange={onChange}
        />
    );
}

export default function UpdateUserFormFields({
    references,
    check_box,
    select_options,
    isEditing,
    setIsEditing,
    formBtnState,
    user_displayed,
    user_data,
    styles,
}) {
    const [selectedTitleValue, setSelectedTitleValue] = useState(user_displayed?.emp_title ?? "");
    // If there is not title selectOptions and global specialities then return null
    // Memoize specialty options for selected title 
    const specialitiesForTitle  = useMemo(() => {
        return global_mapped_specialities[selectedTitleValue] && select_options.select_title_options ? ({
            label: "specialty",
            options: global_mapped_specialities[selectedTitleValue] || [],
            name: "specialty",
        }) : null;
    }, [selectedTitleValue]);

    console.log("select_options select_options" , specialitiesForTitle )

    return (
        <>
            {/* Employee-specific selects */}
            <DynamicSelect
                selectOption={select_options?.select_title_options}
                userDisplayed={user_displayed}
                references={references}
                onChange={(e) => setSelectedTitleValue(e.target.value)}
                styles={styles}
            />

            <DynamicSelect
                selectOption={specialitiesForTitle }
                userDisplayed={user_displayed}
                references={references}
                styles={styles}
            />

            {/* Common selects */}
            <DynamicSelect
                selectOption={select_options?.select_role_options}
                userDisplayed={user_displayed}
                references={references}
                styles={styles}
            />

            {/* Check Box Permissions */}
            {check_box && (
                <Inputs
                    inputs_info={check_box}
                    type={"checkbox"}
                    defaultValues={user_displayed}
                    references={references.checkBoxsRef}
                />
            )}

            {/* Cancel Edit Button */}
            {isEditing && (
                <button
                    onClick={() => setIsEditing(false)}
                    className={styles.formButton}
                    disabled={formBtnState === "Submitting"}
                    type="button"
                >
                    Cancel
                </button>
            )}
        </>
    );
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