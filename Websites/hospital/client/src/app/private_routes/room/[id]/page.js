"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import styles from "./roomDetails.module.css";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { inputs_info } from "./data";
import SelectUser from "@/components/SelectUser/SelectUser";
import { useUserDataContext } from "@/contexts/user_data";

export default function RoomDetailsPage() {


// ====1. Extract user_id from query, room_id from params
  const { id  } = useParams();
  const room_id = id;
  let search_params = useSearchParams();
  const [patient, setPatient] = useState(null);
  const [graphData, setGraphData] = useState([]);
  let [selectedUser , setSelectedUser] = useState(null); 
  const [isAssigningModalDisplayed, setIsAssigningModalDisplayed] = useState(false);
  let [isConfirmed , setIsConfirmed] = useState(false)
  const queryString = new URLSearchParams(search_params);
  let {user_id,...roomData} = Object.fromEntries(queryString.entries());
  const inputsBoxsRef = useRef({})
  const {user_data} = useUserDataContext()



  // Separate fetch function
const fetchPatientDetails = async (patientId, roomId) => {
  if ([roomId, patientId].some(v => v == null || v === "undefined" || v === "null")) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.APIKEY}/rooms/patient/${patientId}/details`,{
      mode:"cors",
      headers: {
      Authorization: `BEARER ${user_data.token}`,
      "Content-Type": "application/json"
    }

      }
    );
    
    statusNotification(response.status);
    const data = await response.json();

    if (data.success) {
      return {
        patient: data.patient || null,
        graphData: [
          { day: "Mon", occupancy: 50 },
          { day: "Tue", occupancy: 70 },
          { day: "Wed", occupancy: 90 },
          { day: "Thu", occupancy: 40 },
          { day: "Fri", occupancy: 60 },
        ]
      };
    } else {
      userNotification("error", data.message);
      return null;
    }
  } catch (error) {
    userNotification("error", "Failed to fetch room details");
    return null;
  }
};

  useEffect(() => {
    if (!room_id) return;

    const loadPatientDetails = async () => {
    const result = await fetchPatientDetails(user_id, room_id);
    if (result) {
      setPatient(result.patient);
      setGraphData(result.graphData);
    }
  };

  loadPatientDetails();
  }, [room_id, user_id]);

  function handleEmptyRoom() {
    fetch(`${process.env.APIKEY}/rooms/${room_id}/empty`, { method: "PUT", mode: "cors" , headers:{
      "Content-Type": "application/json",
      Authorization: `BEARER ${user_data.token}`
    } })
      .then(res => {
        return res.json();
      })
      .then(data => {
        if (data.success) {
          userNotification("success", "Room emptied successfully");
          setPatient(null);
        } else {
          userNotification("error", data.message);
        }
      });
  }

  // ===========================================
//        Display Select User Container
// ===========================================

  function showSelectPatientModal() {
    setIsAssigningModalDisplayed(prev => !prev);
  }

  // ===========================================
//        Confirm Assign Patient
// ===========================================

  async function handleConfirmBtn() {
  try {
    // First Assign Patient to Room
    const assignResponse = await fetch(`${process.env.APIKEY}/rooms/${room_id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" ,Authorization: `BEARER ${user_data.token}`},
      mode: "cors",
      body: JSON.stringify({ 
        user_id:selectedUser.user_id, 
        floor_id: roomData.floor_number, 
        room_number: roomData.room_number 
      }),
    });

    statusNotification(assignResponse.status);
    const assignData = await assignResponse.json();

    if (!assignData.success) {
      userNotification("error", assignData.message);
      return;
    }

    userNotification("success", "Patient assigned successfully");

    // ✅ Use selectedUser.user_id directly — user_id from URL is the old occupant
    const result = await fetchPatientDetails(selectedUser.user_id, room_id);
    if (result) {
      setPatient(result.patient);
      setGraphData(result.graphData);
    }

    setIsAssigningModalDisplayed(false);
    setIsConfirmed(false);
    setSelectedUser(null);

  } catch (error) {
    userNotification("error", "Failed to assign patient");
  }
}

// Only send confirm request when it isConfirmed and selectedUser is updated to new user
useEffect(()=>{
  if(!isConfirmed) return;
  if(!selectedUser || !selectedUser.user_id) return;
  handleConfirmBtn()
},[selectedUser,isConfirmed])




  return (
    <main className={`${styles["room-details-page"]} wrapper`}>
      {isAssigningModalDisplayed && (
        <div className={styles.selectUserModal}>
          <button
            className={styles.closeButton} // optional, style as you like
            onClick={() => setIsAssigningModalDisplayed(false)}
          >
            ✖
          </button>
          <SelectUser 
            list_url={`/patient`}
            handleConfirmBtn={() => setIsConfirmed(true)}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            references={{ inputsBoxsRef }}
            inputs_info={inputs_info}
            fieldDefinitions={{ inputs_info }}
          />
        </div>
      )}

      
      {/* === Section 1: Room info + graph === */}
      <section className={styles.section}>
        <h2>Room Information</h2>
        <div className={styles.infoGrid}>
          <p><strong>Room ID:</strong> {roomData.room_id}</p>
          <p><strong>Room Number:</strong> {roomData.room_number}</p>
          <p><strong>Floor:</strong> {roomData.floor_number}</p>
          <p><strong>Status:</strong> {parseInt(roomData.isOccupied) ? "Occupied" : "Empty"}</p>
        </div>

       
      </section>

      {/* === Section 2: Patient info === */}
      <section className={styles.section}>
        <h2>Patient Information</h2>
        {patient ? (
          <div className={styles.patientInfo}>
            <p><strong>Name:</strong> {patient.user_name}</p>
            <p><strong>Gender:</strong> {patient.patient_gender}</p>
            <p><strong>Email:</strong> {patient.user_email}</p>
            <p><strong>Phone:</strong> {patient.patient_phone}</p>
            <p><strong>Date of Birth:</strong> {patient.date_of_birth}</p>
          </div>
        ) : (
          <p>No patient currently assigned to this room.</p>
        )}
      </section>

      {/* === Section 3: Actions === */}
      <section className={styles.section}>
        <h2>Actions</h2>
        <div className={styles.buttons}>
          <button
            className={`${styles.actionBtn} ${styles.emptyBtn}`}
            onClick={handleEmptyRoom}
            disabled={!patient}
          >
            Empty Room
          </button>
          <button
            className={`${styles.actionBtn} ${styles.assignBtn}`}
            onClick={showSelectPatientModal}
          >
            Assign Patient
          </button>
          {/* New Link Button styled with your existing actionBtn properties */}
          <a
            href="https://trichromatic-shirlee-nonenthusiastically.ngrok-free.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.actionBtn} ${styles.linkBtn || ""}`}
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Visit Device
          </a>
        </div>
      </section>
    </main>
  );
}