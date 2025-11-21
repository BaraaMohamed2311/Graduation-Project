"use client";
import Image from "next/image";
import styles from "./employee.module.css";
import MapToEmployeeDetails from "./employee_fields"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useEmployeesCache } from "@/hooks/useEmployeesCache";
import private_routes from "../../page";
import { useUserDataContext } from "@/contexts/user_data";
 function EmployeeDetailsPage() {
  const [isEditing, setIsEditing] = useState(false);
  let [blobURL , setBlobURL] = useState("/avatar.jpg");
   const { id :user_id ,currPage} = useParams(); // Get user_id from URL
   const { cached_employees,isIndexedDBLoaded } = useEmployeesCache();
   const { user_data } = useUserDataContext();

   // Efficiently find the patient from cache
    const employee = cached_employees?.find(e => e.user_id === parseInt(user_id));
  

  if (!isIndexedDBLoaded) {
        return <div>Loading...</div>;
    }
    
    if (!employee) {
        return <div>Patient not found in cache</div>;
    }

    const SpecificContentFields = MapToEmployeeDetails[employee.emp_title] || (<></>)

  return (
    <main className={styles["employee-main"]}>
      {user_data.emp_perms && user_data.emp_perms.has("Modify Data") && isEditing ? (
        <UpdateEmpForm
          currPage={currPage}
          user={employee}
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
              <h1 className={styles["employee-name"]}>{employee.emp_name}</h1>
              <p className={styles["employee-position"]}>
                {`${employee.emp_title} | ${employee.emp_specialty}`}
              </p>
              <p><strong>Email:</strong> {employee.user_email}</p>
              <p><strong>Location:</strong> {employee.emp_address || "Not Specified"}</p>
              <p><strong>Member Since:</strong> {employee.emp_joined || "Not Specified"}</p>
            </div>
          </div>

          {/* --- Role-specific details --- */}
          <div className={styles["employee-details"]}>
            <ul className={styles["role-details"]}>
              <SpecificContentFields  user={employee}/>
              <li><strong>Absence:</strong> {employee.emp_abscence || 'N/A'}</li>
              <li><strong>Rating:</strong> {employee.emp_rate}</li>
              <li className={styles.perms_box}><strong className={styles.perms_header}>Permissions </strong>
                        <div className={styles.perms_wrapper}>
                            {employee.emp_perms && employee.emp_perms[0] !== "None" ?(employee.emp_perms.split(", ").map((perm)=>{

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
