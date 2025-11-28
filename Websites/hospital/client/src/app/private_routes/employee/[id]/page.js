"use client";
import Image from "next/image";
import styles from "./employee.module.css";
import MapToEmployeeDetails from "./employee_fields"
import { useState , useRef } from "react";
import { useParams } from "next/navigation";
import { useEmployeesCache } from "@/hooks/useEmployeesCache";
import private_routes from "../../page";
import { useUserDataContext } from "@/contexts/user_data";
import UpdateForm from "@/components/UpdateUserForm/UpdateUserForm";
import {inputs_info , select_options  , check_box} from "./data"
 function EmployeeDetailsPage() {
  const [isEditing, setIsEditing] = useState(false);
  let [blobURL , setBlobURL] = useState("/avatar.jpg");
   const { id :user_id ,currPage} = useParams(); // Get user_id from URL
   const { cached_employees,isIndexedDBLoaded } = useEmployeesCache();
   const { user_data } = useUserDataContext();

  

  function onSubmit(){}
   // Efficiently find the patient from cache
    const originalEmployee = cached_employees?.find(
      e => e.user_id === parseInt(user_id)
    );
    
     // Define references at page level
  const inputsBoxsRef = useRef({});
  const checkBoxsRef = useRef({});
  const selectBoxsRef = useRef({});

  // Combine all references into one object
  const references = {
    inputsBoxsRef,
    checkBoxsRef,
    selectBoxsRef
  };

  /***************************************update_handler***************************************/
     function update_handler(e, url, token) {
        e.preventDefault();
        // get updated user data and actions that were made
        let {updatedEmployeeData , actionString} = checkActionsMade();
        

        const reqBody = {
                      modifier_id: user_data.emp_id,
                      
                      emp_id: employee_displayed.emp_id,
                      employee_emp_email:employee_displayed.emp_email,
                      ...updatedEmployeeData
                    }

          updateEmpFetch(url, token, reqBody ,actionString , setCached_Employees , currPage , router);
        

        
      }
/***************************************checkActionsMade***************************************/
      function checkActionsMade(){

        let actions = [];
        let updatedEmployeeData = {};
        const employee_displayed_perms = new Set(employee_displayed.emp_perms.split(", "));

    // ====================================================== Modify Data ======================================================

       // === 1. Check for changes in general input fields

        inputs_info.forEach((input_info) => {
          //  Check If any inputBox is empty 
          if ( (inputsBoxsRef.current[input_info.name] && !inputsBoxsRef.current[input_info.name].value) ){
            userNotification("error", "Input fields cannot be empty");
            return
          }
          
          // we check at first that input element is rendered using current of reference
          else if (inputsBoxsRef.current[input_info.name] && (inputsBoxsRef.current[input_info.name].value !== employee_displayed[input_info.name])) {
              updatedEmployeeData[input_info.name] = inputsBoxsRef.current[input_info.name].value;
            if (!actions.includes("Modify Data")) actions.push("Modify Data"); // Add "MD" if not already added
          }
          
        });

        // === 2. Check If any SelectBox is empty ===

        if ( 
            (selectBoxsRef.current[select_options.select_title_options.name] && !selectBoxsRef.current[select_options.select_title_options.name].value) ||
            (selectBoxsRef.current[select_options.select_specialty_options.name] && !selectBoxsRef.current[select_options.select_specialty_options.name].value) ||
            (selectBoxsRef.current[select_options.select_role_options.name] && !selectBoxsRef.current[select_options.select_role_options.name].value) 
          ){
            userNotification("error", "Input fields cannot be empty");
            return
          }

        // === 3. Check for changes in Title ===


          // we check at first that input element is rendered using current of reference
          if (selectBoxsRef.current[select_options.select_title_options.name] && (selectBoxsRef.current[select_options.select_title_options.name].value !== employee_displayed[select_options.select_title_options.name])) {
            updatedEmployeeData[select_options.select_title_options.name] = selectBoxsRef.current[select_options.select_title_options.name].value;
            if (!actions.includes("Modify Data")) actions.push("Modify Data"); 
          }

          // === 4. Check for changes in specialty ===

          // we check at first that input element is rendered using current of reference
          console.log("debugging",selectBoxsRef.current, selectBoxsRef.current[select_options.select_specialty_options.name],employee_displayed[select_options.select_specialty_options.name])
          if (selectBoxsRef.current[select_options.select_specialty_options.name] && (selectBoxsRef.current[select_options.select_specialty_options.name].value !== employee_displayed[select_options.select_specialty_options.name])) {
            updatedEmployeeData[select_options.select_specialty_options.name] = selectBoxsRef.current[select_options.select_specialty_options.name].value;
            if (!actions.includes("Modify Data")) actions.push("Modify Data"); 
          }


      //  ====================================================== Modify Role ======================================================
        
        

          // we check at first that input element is rendered using current of reference
          if (selectBoxsRef.current[select_options.select_role_options.name] && (selectBoxsRef.current[select_options.select_role_options.name].value !== employee_displayed[select_options.select_role_options.name])) {
            updatedEmployeeData[select_options.select_role_options.name] = selectBoxsRef.current[select_options.select_role_options.name].value;
            if (!actions.includes("Modify Role")) actions.push("Modify Role"); // Add "MR" if not already added
          }
        
      
      // ====================================================== Modify Permissions ======================================================
        
        let updated_emp_perms = [];
        let permModified = false; // Track if any permission was modified

        check_box.forEach((check_box_info) => {
            const isCurrentlyChecked = checkBoxsRef.current[check_box_info.name].checked;
            const wasPreviouslyChecked = employee_displayed_perms.has(check_box_info.value);
            
            // Check if permission state changed
            if (isCurrentlyChecked !== wasPreviouslyChecked) {
                permModified = true; // Mark that permissions were modified
            }
            
            // Add to updated array if currently checked (scenarios 1 and 2)
            if (isCurrentlyChecked) {
                updated_emp_perms.push(check_box_info.value);
            }
        });

        // Scenario 3: If all permissions were unchecked but some existed before
        // OR if any permission was changed in any way
        if (permModified || (updated_emp_perms.length === 0 && employee_displayed_perms.size > 0)) {
            if (!actions.includes("Modify Perms")) {
                actions.push("Modify Perms");
            }
        }
        console.log("Updated Permissions:", updated_emp_perms);
        updatedEmployeeData.newperms = updated_emp_perms.join(", ");

      
        // Join actions array to form the action string
        let actionString = actions.join("-");

        return {
          updatedEmployeeData,
          actionString,
          
        };

    }

     

    if (!isIndexedDBLoaded || !originalEmployee) {
      return <p>Loading...</p>;
    }

    // make sure you NEVER mutate originalEmployee
    const employee = {
      ...originalEmployee,
      emp_perms: new Set(originalEmployee.emp_perms?.split(", ") ?? [])
    };

console.log("employee", employee);

   // SpecificContentFields when employee is defined
   const SpecificContentFields = MapToEmployeeDetails[employee.emp_title] || (<></>)

  return (
    <main className={styles["employee-main"]}>
      {isEditing ? (
         <UpdateForm
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            user_displayed={employee}
            currPage={currPage}
            userData={user_data}
            onSubmit={onSubmit}
            modifier_data={user_data}
            // Pass the references and functions as props
            references={references}
            inputs_info={inputs_info}
            select_options={select_options}
          />
      ) : (
        <div className={styles["employee-container"]}>
          {/* --- Header --- */}
          <div className={styles["employee-header"]}>
            <div className={styles["employee-img-wrapper"]}>
              <Image
                priority={false}
                src={blobURL}
                className={styles["employee-picture"]}
                width="192"
                height="192"
                alt="User Profile Image"
              />
            </div>

            <div className={styles["employee-info"]}>
              <h1 className={styles["employee-name"]}>{employee.user_name}</h1>
              <p className={styles["employee-position"]}>
                {`${employee.emp_title} | ${employee.emp_specialty}`}
              </p>
              <p><strong>Email:</strong> {employee.user_email}</p>
              <p><strong>Location:</strong> {employee.emp_address || "Not Specified"}</p>
              
            </div>
          </div>

          {/* --- Role-specific details --- */}
          <div className={styles["employee-details"]}>
            <ul className={styles["role-details"]}>
              <SpecificContentFields  user={employee}/>
              <li><strong>Absence:</strong> {employee.emp_abscence || 'N/A'}</li>
              <li><strong>Rating:</strong> {employee.emp_rate}</li>
               {/* Availability Schedule */}
              <li className={styles.availability_box}>
                <strong className={styles.availability_header}>Availability</strong>
                <div className={styles.availability_wrapper}>
                  {employee.availability_schedule ? (
                    employee.availability_schedule.split("; ").map((schedule) => {
                      const [dayIndex, timeRange] = schedule.split(": ");
                      const [startTime, endTime] = timeRange.split("-");
                      const days = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"};
                      
                      return (
                        <div key={dayIndex} className={styles.schedule_item}>
                          <span className={styles.day}>{days[dayIndex] || `Day ${dayIndex}`}</span>
                          <span className={styles.time}>{startTime} - {endTime}</span>
                        </div>
                      );
                    })
                  ) : "No schedule available"}
                </div>
              </li>
              <li className={styles.perms_box}><strong className={styles.perms_header}>Permissions </strong>
                        <div className={styles.perms_wrapper}>
                            {employee.emp_perms && employee.emp_perms[0] !== "None" ?(Array.from(employee.emp_perms).map((perm)=>{

                                return <span key={perm} className="perm">{perm}</span>
                                })) : "None"
                                  }
                          </div>
                </li>

              </ul>

            {/* --- Action Buttons --- */}
            <div className={styles["buttons-wrapper"]}>
              <button onClick={() => setIsEditing(prev => !prev)} className="grey-button">
                Edit Employee
              </button>
              <button
                onClick={() =>
                  handleDeletion("list/delete-employee", user_data.token, {
                    user_id: employee.user_id,
                    emp_name: employee.emp_name, // FIXME: Check if emp_name is correct
                    user_email: employee.user_email,
                    modifier_email: user_data.user_email,
                    modifier_id: user_data.user_id,
                    modifier_name: user_data.emp_name, // FIXME: Check if emp_name is correct
                  })
                }
                className="red-button"
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


export default private_routes(EmployeeDetailsPage);
