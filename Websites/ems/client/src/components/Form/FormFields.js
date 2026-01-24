import Select from "../Select/Select";
import Link from "next/link";
import Inputs from "../Inputs/Inputs"
import { useEffect , useState , useMemo} from "react";
import { global_mapped_specialities } from "@/global_data";


// ================================
//    Checks Option before rendering
// ================================

function DynamicSelect({ selectOption, userDisplayed, references, onChange, styles }) {
    console.log("selectOption",selectOption)

    console.log("userDisplayed:", userDisplayed ,selectOption?.name ); // Add this
    if (!selectOption || !references || !references.selectBoxsRef) return null;

    return (
        <Select
            styles={styles}
            defaultValue={userDisplayed && userDisplayed[selectOption.name]}
            select_options={selectOption}
            reference={references.selectBoxsRef}
            onChange={onChange}
        />
    );
}
// ================================
//    Employee's Specific Select Elements
// ================================
function EmployeeSelectFields({ select_def, user_displayed, references, styles }) {
    const [selectedTitleValue, setSelectedTitleValue] = useState(
        user_displayed?.emp_title ?? ""
    );

     // Memoize specialty options for selected title 
    const specialitiesForTitle  = useMemo(() => {
        return global_mapped_specialities[selectedTitleValue] && select_def?.select_title_options ? ({
            label: "specialty",
            options: global_mapped_specialities[selectedTitleValue] || [],
            name: "specialty",
        }) : null;
    }, [selectedTitleValue]);

    return (
        <>
            {/* Title select */}
            <DynamicSelect
                selectOption={select_def?.select_title_options}
                userDisplayed={user_displayed}
                references={references}
                onChange={(e) => setSelectedTitleValue(e.target.value)}
                styles={styles}
            />

            {/* Specialty select (auto-filtered) */}
            {specialitiesForTitle && (
                <DynamicSelect
                    selectOption={specialitiesForTitle}
                    userDisplayed={user_displayed}
                    references={references}
                    styles={styles}
                />
            )}

            {/* Role select */}
            <DynamicSelect
                selectOption={select_def?.select_role_options}
                userDisplayed={user_displayed}
                references={references}
                styles={styles}
            />
        </>
    );
}
// ================================
//    Generic selct options rendering
// ================================
function RenderOtherSelects({ select_def, exclude = [], user_displayed, references, styles }) {

    Object.entries(select_def || {})
        .filter(([key]) => !exclude.includes(key))
        .map(([key, selectOption]) =>console.log("RenderOtherSelects",key, selectOption));

    return  Object.entries(select_def || {})
        .filter(([key]) => !exclude.includes(key))
        .map(([key, selectOption]) =>
            
            <DynamicSelect
                key={key}
                selectOption={selectOption}
                userDisplayed={user_displayed}
                references={references}
                styles={styles}
            />
        );
}


export default function UpdateUserFormFields({
    references,
    isEditing,
    setIsEditing,
    formBtnState,
    user_displayed,
    styles,
    fieldDefinitions,
}) {
    const {select_def , check_box}= fieldDefinitions;

    return (
        <>
            {/* Employee-related grouped selects */}
            <EmployeeSelectFields
                select_def={select_def}
                user_displayed={user_displayed}
                references={references}
                styles={styles}
            />

            {/* Render all remaining selects dynamically */}
            <RenderOtherSelects
                select_def={select_def}
                exclude={["select_title_options", "select_role_options"]}  // keep OCP
                user_displayed={user_displayed}
                references={references}
                styles={styles}
            />

            {/* Check Box Permissions */}
            {check_box && Object.keys(check_box).map(key=>(
                <Inputs
                    inputs_info={check_box[key]}
                    defaultValues={user_displayed}
                    references={references.checkBoxsRef}
                    formKind={"check_inputs_wrapper"}
                />
            ))}

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