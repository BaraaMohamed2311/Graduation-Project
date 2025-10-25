"use client";
import Image from "next/image";
import styles from "./EmployeeProfile.module.css";
import MapToEmployeeDetails from "./employee_fields"
import { useState } from "react";

 function EmployeeProfile({
  currPage,
  user_data,
  employee_displayed,
  blobURL,
  handleDeletion,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const SpecificContentFields = MapToEmployeeDetails[user_data.emp_title] || (<></>)

  return (
    <main className={styles["employee-main"]}>
      {user_data.emp_perms && user_data.emp_perms.has("Modify Data") && isEditing ? (
        <UpdateEmpForm
          currPage={currPage}
          employee_displayed={employee_displayed}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
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
              <h1 className={styles["employee-name"]}>{employee_displayed.emp_name}</h1>
              <p className={styles["employee-position"]}>
                {`${employee_displayed.emp_title} | ${employee_displayed.emp_specialty}`}
              </p>
              <p><strong>Email:</strong> {employee_displayed.emp_email}</p>
              <p><strong>Location:</strong> {employee_displayed.emp_address || "Not Specified"}</p>
              <p><strong>Member Since:</strong> {employee_displayed.emp_joined || "Not Specified"}</p>
            </div>
          </div>

          {/* --- Role-specific details --- */}
          <div className={styles["employee-details"]}>
            <SpecificContentFields />

            {/* --- Action Buttons --- */}
            <div className={styles["buttons-wrapper"]}>
              <button onClick={() => setIsEditing(prev => !prev)} className="grey-button">
                Edit Employee
              </button>
              <button
                onClick={() =>
                  handleDeletion("list/delete-employee", user_data.token, {
                    emp_id: employee_displayed.emp_id,
                    emp_name: employee_displayed.emp_name,
                    emp_email: employee_displayed.emp_email,
                    modifier_email: user_data.emp_email,
                    modifier_id: user_data.emp_id,
                    modifier_name: user_data.emp_name,
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


export default private_routes(EmployeeProfile);
