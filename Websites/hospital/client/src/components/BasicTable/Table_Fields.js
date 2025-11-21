// EmployeesTableColumns.jsx
import styles from "./table.module.css";

// Separate Button Components
const VisitButton = ({ row, handleActionBtn }) => (
  <button onClick={() => handleActionBtn(row)} className={styles["grey-button"]}>
    Visit
  </button>
);

const SelectUserButton = ({ row, handleActionBtn }) => (
  <button onClick={() => handleActionBtn(row)} className={styles["blue-button"]}>
    Select
  </button>
);

// Button Components Map
const ButtonComponents = {
  "visit": VisitButton,
  "select": SelectUserButton,

};

function PatientsTableColumns({ type, isSmallScreen, row, handleActionBtn, buttonType }) {

  const ActionButton = ButtonComponents[buttonType] || ButtonComponents["visit"];
  if (type === "headers") {
    return (
      <>
        <th className={styles.table_col_1}>ID</th>
        <th className={styles.table_col_1}>Name</th>
        <th className={styles.table_col_1}>patient_gender</th>
        <th className={styles.table_col_2}>Email</th>
        {!isSmallScreen && (
          <>
            <th className={styles.table_col_2}>Phone</th>
            <th className={styles.table_col_2}>Address</th>
            <th className={styles.table_col_1}>Inpatient care</th>
            <th className={styles.table_col_2}>emergency_contact</th>
            <th className={styles.table_col_1}>date_of_birth</th>
          </>
        )}
        <th className={styles.table_col_1}>Details</th>
      </>
    );
  }

  // For row rendering
  return (
    <>
      <td className={styles.table_col_1}>{row.user_id}</td>
      <td className={styles.table_col_1}>{row.patient_name}</td>
      <td className={styles.table_col_1}>{row.patient_gender}</td>
      <td className={styles.table_col_2}>{row.user_email}</td>
      {!isSmallScreen && (
        <>
          <td className={styles.table_col_2}>{row.patient_phone}</td>
          <td className={styles.table_col_2}>{row.patient_address}</td>
          <td className={styles.table_col_1}>{parseInt(row.isAssignedToRoom) ? "yes" : "no"}</td>
          <td className={styles.table_col_2}>{row.emergency_contact}</td>
          <td className={styles.table_col_1}>{row.date_of_birth}</td>
        </>
      )}
      <td className={styles.table_col_1}>
        <ActionButton  handleActionBtn={handleActionBtn} />
      </td>
    </>
  );
}

function EmployeesTableColumns({ type, isSmallScreen, row, handleActionBtn, buttonType }) {

  const ActionButton = ButtonComponents[buttonType] || ButtonComponents["visit"];  

  if (type === "headers") {
    return (
      <>
        <th className={styles.table_col_1}>Name</th>
        <th className={styles.table_col_2}>Email</th>
        <th className={styles.table_col_1}>Title</th>
        <th className={styles.table_col_2}>Speciality</th>
        {!isSmallScreen && (
          <>
            <th className={styles.table_col_2}>Phone</th>
            <th className={styles.table_col_1}>Abscence</th>
          </>
        )}
        <th className={styles.table_col_1}>Details</th>
      </>
    );
  }

  // For row rendering
  return (
    <>
      <td className={styles.table_col_1}>{row.emp_name}</td>
      <td className={styles.table_col_2}>{row.user_email}</td>
      <td className={styles.table_col_1}>{row.emp_title}</td>
      <td className={styles.table_col_2}>{row.emp_specialty}</td>

      {!isSmallScreen && (
        <>
          <td className={styles.table_col_2}>{row.emp_phone || "N/A"}</td>
          <td className={styles.table_col_1}>{row.emp_abscence || "N/A"}</td>

        </>
      )}
      <td className={styles.table_col_1}>
        <ActionButton  handleActionBtn={handleActionBtn} />
      </td>
    </>)
}


const TableColumnsMap = {
  "patients": PatientsTableColumns,
  "employees": EmployeesTableColumns,
};

export {TableColumnsMap }
