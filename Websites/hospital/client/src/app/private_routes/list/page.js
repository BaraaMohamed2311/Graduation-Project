"use client";
import { useRouter } from "next/navigation";
import styles from "./listpage.module.css";
import private_routes from "../page";
import { useUserDataContext } from "@/contexts/user_data";
import { useState, useRef } from "react";
import SelectUser from "@/components/SelectUser/SelectUser";
import { inputs_info } from "./data";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";

function ListPage() {
  const router = useRouter();
  const { user_data } = useUserDataContext();

  // ─── Role / title derived flags ───────────────────────────────────────────
  const empTitle = user_data?.emp_title?.toLowerCase();
  const isNurse     = empTitle === "nurse";
  const isManager   = empTitle === "manager";
  const isHR        = empTitle === "hr";

  const AccessAllPatients = isManager || isNurse;
  const AccessMyPatient   = !isManager && !isNurse && !isHR;

  // ─── Assign-to-staff modal state ──────────────────────────────────────────
  const [isAssignModalOpen, setIsAssignModalOpen]   = useState(false);
  const [selectedStaff, setSelectedStaff]           = useState(null);
  const [selectedPatient, setSelectedPatient]       = useState(null);
  const [assignStep, setAssignStep]                 = useState("pick-staff"); // "pick-staff" | "pick-patient"
  const [isConfirmed, setIsConfirmed]               = useState(false);

  const staffInputsRef   = useRef({});
  const patientInputsRef = useRef({});

  // ─── Staff search inputs (search by email) ────────────────────────────────
  const staff_inputs_info = [
    { label: "Staff Email", name: "user_email",  type: "text", placeholder: "e.g. doctor@hospital.com" },
  ];

  // ─── Patient search inputs ────────────────────────────────────────────────
  const patient_inputs_info = inputs_info; // reuse existing patient field definitions from data.js

  // ─── Open modal and reset all state ──────────────────────────────────────
  function openAssignModal() {
    setSelectedStaff(null);
    setSelectedPatient(null);
    setAssignStep("pick-staff");
    setIsConfirmed(false);
    setIsAssignModalOpen(true);
  }

  // ─── After nurse picks a staff member, move to patient-picking step ───────
  function handleStaffConfirm() {
    if (!selectedStaff?.user_id) {
      userNotification("error", "Please select a staff member first");
      return;
    }
    setAssignStep("pick-patient");
  }

  // ─── After nurse picks a patient, trigger the actual assignment ───────────
  function handlePatientConfirm() {
    setIsConfirmed(true);
  }

  // ─── Fire the API call once both selections are confirmed ─────────────────
  async function executeAssignment() {
    if (!isConfirmed || !selectedStaff || !selectedPatient) return;

    try {
      const response = await fetch(`${process.env.APIKEY}/staff/add-patient-to-staff`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `BEARER ${user_data.token}`,
        },
        body: JSON.stringify({
          nurse_id:        user_data.user_id,
          nurse_email:     user_data.user_email,
          staff_email:     selectedStaff.user_email,
          patient_user_id: selectedPatient.user_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        userNotification("success", data.message || "Patient assigned successfully");
        setIsAssignModalOpen(false);
      } else {
        userNotification("error", data.message || "Assignment failed");
      }
    } catch {
      userNotification("error", "Network error during assignment");
    } finally {
      setIsConfirmed(false);
    }
  }

  // Trigger API call whenever isConfirmed flips to true and both users are set
  if (isConfirmed && selectedStaff && selectedPatient) {
    executeAssignment();
  }

  return (
    <main className={`${styles["list-page"]} wrapper`}>

      {/* ─── Assign Patient to Staff modal (Nurse only) ───────────────── */}
      {isNurse && isAssignModalOpen && (
        <div className={styles.selectUserModal}>
          <button
            className={styles.closeButton}
            onClick={() => setIsAssignModalOpen(false)}
          >
            ✖
          </button>

          {assignStep === "pick-staff" ? (
            <>
              <h3 style={{ marginBottom: "0.75rem" }}>Step 1 — Select Doctor or Surgeon</h3>
              <SelectUser
                list_url={`/employees`}
                handleConfirmBtn={handleStaffConfirm}
                selectedUser={selectedStaff}
                setSelectedUser={setSelectedStaff}
                references={{ inputsBoxsRef: staffInputsRef }}
                inputs_info={staff_inputs_info}
                fieldDefinitions={{ inputs_info: staff_inputs_info }}
              />
            </>
          ) : (
            <>
              <h3 style={{ marginBottom: "0.75rem" }}>
                Step 2 — Select Patient to Assign to{" "}
                <strong>{selectedStaff?.user_name ?? selectedStaff?.user_email}</strong>
              </h3>
              <SelectUser
                list_url={`/patient`}
                handleConfirmBtn={handlePatientConfirm}
                selectedUser={selectedPatient}
                setSelectedUser={setSelectedPatient}
                references={{ inputsBoxsRef: patientInputsRef }}
                inputs_info={patient_inputs_info}
                fieldDefinitions={{ inputs_info: patient_inputs_info }}
              />
            </>
          )}
        </div>
      )}

      <h1 className={styles["title"]}>Patients Management</h1>

      <div className={styles["cards-container"]}>
        {AccessAllPatients && (
          <div
            className={styles["nav-card"]}
            onClick={() => router.push("/private_routes/patients-list")}
          >
            <i className={`fa-solid fa-users ${styles["card-icon"]}`}></i>
            <h2>All Patients</h2>
            <p>View and manage all hospital patients</p>
          </div>
        )}

        {AccessMyPatient && (
          <div
            className={styles["nav-card"]}
            onClick={() => router.push("/private_routes/mypatients-list")}
          >
            <i className={`fa-solid fa-user-doctor ${styles["card-icon"]}`}></i>
            <h2>My Patients</h2>
            <p>See only patients assigned to you</p>
          </div>
        )}

        {/* ─── Nurse-only card: Assign Patient to Doctor/Surgeon ─────── */}
        {isNurse && (
          <div
            className={styles["nav-card"]}
            onClick={openAssignModal}
          >
            <i className={`fa-solid fa-user-plus ${styles["card-icon"]}`}></i>
            <h2>Assign to Staff</h2>
            <p>Assign a patient to a Doctor or Surgeon</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default private_routes(ListPage);