import Form from "../Form/Form";
import { useState, useRef } from "react";
import styles from "./update_emp_form.module.css";

export default function UpdateForm({
  isEditing,
  setIsEditing,
  dataDisplayed,
  currPage,
  userData,
  cachedDataSetter,
  inputs_info,
  select_options,
  check_box,
  onSubmit, // function to handle form submission externally
  validateFieldsNotEmpty, // optional external validation function
  actionLabels = { modifyData: "Modify Data", modifyRole: "Modify Role", modifyPerms: "Modify Perms" },
}) {
  const [formBtnState, setFormBtnState] = useState("Update");
  const [isLoadingBtn, setIsLoadingBtn] = useState(false);

  const inputsBoxsRef = useRef({});
  const checkBoxsRef = useRef({});
  const selectBoxsRef = useRef({});

  const addAction = (actions, action) => {
    if (!actions.includes(action)) actions.push(action);
  };

  const defaultValidateFields = () => {
    const emptyInput = inputs_info.some(input => inputsBoxsRef.current[input.name] && !inputsBoxsRef.current[input.name].value);
    const emptySelect = Object.values(select_options).some(sel => selectBoxsRef.current[sel.name] && !selectBoxsRef.current[sel.name].value);
    if (emptyInput || emptySelect) {
      alert("Input fields cannot be empty"); // fallback if no external notification system
      return false;
    }
    return true;
  };

  const checkActionsMade = () => {
    let actions = [];
    let updatedData = {};

    // === Inputs ===
    inputs_info.forEach(input => {
      const elem = inputsBoxsRef.current[input.name];
      if (elem && elem.value !== dataDisplayed[input.name]) {
        updatedData[input.name] = elem.value;
        addAction(actions, actionLabels.modifyData);
      }
    });

    // === Selects ===
    Object.values(select_options).forEach(sel => {
      const elem = selectBoxsRef.current[sel.name];
      if (elem && elem.value !== dataDisplayed[sel.name]) {
        updatedData[sel.name] = elem.value;
        addAction(actions, sel.name === "role" ? actionLabels.modifyRole : actionLabels.modifyData);
      }
    });

    // === Checkboxes ===
    if (check_box) {
      const previousPerms = new Set((dataDisplayed.perms || []).map(String));
      let updatedPerms = [];
      let permModified = false;

      check_box.forEach(cb => {
        const isChecked = checkBoxsRef.current[cb.name]?.checked || false;
        const wasChecked = previousPerms.has(cb.value);
        if (isChecked !== wasChecked) permModified = true;
        if (isChecked) updatedPerms.push(cb.value);
      });

      if (permModified || (updatedPerms.length === 0 && previousPerms.size > 0)) {
        addAction(actions, actionLabels.modifyPerms);
      }

      updatedData.newPerms = updatedPerms.join(", ");
    }

    return { updatedData, actionString: actions.join("-") };
  };

  const handleSubmit = e => {
    e.preventDefault();

    const isValid = validateFieldsNotEmpty ? validateFieldsNotEmpty() : defaultValidateFields();
    if (!isValid) return;

    const { updatedData, actionString } = checkActionsMade();

    if (Object.keys(updatedData).length === 0) {
      alert("No changes detected"); // fallback
      return;
    }

    if (onSubmit) {
      onSubmit({
        updatedData,
        actionString,
        refs: { inputsBoxsRef, checkBoxsRef, selectBoxsRef },
        setFormBtnState,
        setIsLoadingBtn,
      });
    }
  };

  return (
    <div className={styles["update-emp-page"]}>
      <div className={styles["center"]}>
        <Form
          references={{ inputsBoxsRef, checkBoxsRef, selectBoxsRef }}
          form_handler={handleSubmit}
          employee_displayed={dataDisplayed} // can be renamed to `dataDisplayed` in Form for generic use
          select_options={select_options}
          check_box={check_box}
          inputs_info={inputs_info}
          formBtnState={formBtnState}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          formKind="update_form"
        />
      </div>
    </div>
  );
}
