"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import styles from "./roomDetails.module.css";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import SelectUser from "@/components/SelectUser/SelectUser";
export default function RoomDetailsPage() {


// ====1. Extract patient_id from query, room_id from params
  const { room_id } = useParams();
  let search_params = useSearchParams();
  const [patient, setPatient] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [isAssigningModalDisplayed, setIsAssigningModalDisplayed] = useState(false);
  const queryString = new URLSearchParams(search_params);
  let {patient_id,...roomData} = Object.fromEntries(queryString.entries());



  // Separate fetch function
const fetchPatientDetails = async (patientId, roomId) => {
  if (!roomId) return null;

  try {
    const response = await fetch(`${process.env.APIKEY}/rooms/patient/${patientId}/details`);
    
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
    const result = await fetchPatientDetails(patient_id, room_id);
    if (result) {
      setPatient(result.patient);
      setGraphData(result.graphData);
    }
  };

  loadPatientDetails();
  }, [room_id, patient_id]);

  function handleEmptyRoom() {
    fetch(`${process.env.APIKEY}/rooms/${room_id}/empty`, { method: "PUT" })
      .then(res => {
        statusNotification(res.status);
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

  function showSelectPatientModal() {
    setIsAssigningModalDisplayed(true);
  }

  async function handleAssignPatient() {
  try {
    // First Assign Patient to Room
    const assignResponse = await fetch(`${process.env.APIKEY}/rooms/${room_id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      mode: "cors",
      body: JSON.stringify({ 
        patient_id, 
        floor_id: roomData.floor_number, 
        room_number: roomData.room_number 
      }),
    });

    statusNotification(assignResponse.status);
    const assignData = await assignResponse.json();

    if (!assignData.success) {
      userNotification("error", assignData.message);
      return; // Stop here if assignment failed
    }

    userNotification("success", "Patient assigned successfully");

    // Then grab patient's data (only if assignment was successful)
    const result = await fetchPatientDetails(patient_id, room_id);
    if (result) {
      setPatient(result.patient);
      setGraphData(result.graphData);
    }

  } catch (error) {
    userNotification("error", "Failed to assign patient");
  }
}


  return (
    <main className={`${styles["room-details-page"]} wrapper`}>
      <SelectUser 
        list_url={}
        handleSelectBtn={}
        handleClearFilterOption={}
        handleFilterOption={}
      />
      {/* === Section 1: Room info + graph === */}
      <section className={styles.section}>
        <h2>Room Information</h2>
        <div className={styles.infoGrid}>
          <p><strong>Room ID:</strong> {roomData.room_id}</p>
          <p><strong>Room Number:</strong> {roomData.room_number}</p>
          <p><strong>Floor:</strong> {roomData.floor_number}</p>
          <p><strong>Status:</strong> {parseInt(roomData.isOccupied) ? "Occupied" : "Empty"}</p>
        </div>

        <div className={styles.chartWrapper}>
          <h3>Room Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="occupancy" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* === Section 2: Patient info === */}
      <section className={styles.section}>
        <h2>Patient Information</h2>
        {patient ? (
          <div className={styles.patientInfo}>
            <p><strong>Name:</strong> {patient.patient_name}</p>
            <p><strong>Gender:</strong> {patient.patient_gender}</p>
            <p><strong>Email:</strong> {patient.patient_email}</p>
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
        </div>
      </section>
    </main>
  );
}
