import Select from "../Select/Select";
import Link from "next/link";
import Inputs from "../Inputs/Inputs"
import { useEffect , useState , useMemo} from "react";
import { global_mapped_specialities } from "@/global_data";


// ================================
//    Checks Option before rendering
// ================================

function DynamicSelect({ selectOption, userDisplayed, references, onChange, styles }) {
    if (!selectOption || !references || !references.selectBoxsRef) return null;

    const defaultValue = userDisplayed[selectOption.name];

    return (
        <Select
            styles={styles}
            defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
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
       user_displayed?.emp_title ??
  select_def?.select_title_options?.options?.[0]?.value ??
  "" // default title is first option
    );

     // Memoize specialty options for selected title 
    const specialitiesForTitle  = useMemo(() => {
        return global_mapped_specialities[selectedTitleValue] && select_def?.select_title_options ? ({
            label: "specialty",
            options: global_mapped_specialities[selectedTitleValue] || [],
            name: "emp_specialty",
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
    
    const [isAssigned, setIsAssigned] = useState(
        user_displayed?.isAssignedToRoom == 1
    );

    return Object.entries(select_def || {})
        .filter(([key]) => {
            if (exclude.includes(key)) return false;

            if (!isAssigned && (key === "floorNum_select" || key === "RoomNum_select")) {
                return false;
            }

            return true;
        })
        .map(([key, selectOption]) => (
            <DynamicSelect
                key={key}
                selectOption={selectOption}
                userDisplayed={user_displayed}
                references={references}
                styles={styles}
                onChange={(e) => {
                    // detect change of isAssignedToRoom
                    if (selectOption.name === "isAssignedToRoom") {
                        setIsAssigned(e.target.value == 1);
                    }
                }}
            />
        ));
}


export default function UpdateUserFormFields({
    references,
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

            {/* Check Boxs */}
            { check_box &&  Object.keys(check_box)?.length > 0 && Object.entries(check_box).map(([key , arrOfInputDefs])=>(
                <Inputs
                    key={key}
                    inputs_info={arrOfInputDefs} // bcuz components need an array to loop on
                    defaultValues={user_displayed}
                    references={references.checkBoxsRef}
                    formKind={"check_inputs_wrapper"}
                />
            ))
                
            }


        </>
    );
}


 function RegisterFormFields({
    references,
    styles,
    fieldDefinitions,
}) {
    const {select_def , check_box}= fieldDefinitions;

    return (
        <>


            {/* Render all remaining selects dynamically */}
            <RenderOtherSelects
                select_def={select_def}
                exclude={["select_title_options", "select_role_options"]}  // keep OCP
                references={references}
                styles={styles}
            />

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
    register_form: RegisterFormFields,
};

export {FormFieldsMap};