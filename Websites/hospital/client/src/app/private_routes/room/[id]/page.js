"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "./roomDetails.module.css";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function RoomDetailsPage() {

  const router = useRouter();
// ====1. Extract patient_id from query, room_id from params
  const { id } = useParams();
  let search_params = useSearchParams();
  const queryString = new URLSearchParams(search_params);
  let {patient_id,...roomData} = Object.fromEntries(queryString.entries())

  const [patient, setPatient] = useState(null);
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    if (!id) return;

    fetch(`${process.env.APIKEY}/rooms/patient/${patient_id}/details`)
      .then(res => {
        statusNotification(res.status);
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setPatient(data.patient || null);
          // Dummy graph data (replace with real API data if available)
          setGraphData([
            { day: "Mon", occupancy: 50 },
            { day: "Tue", occupancy: 70 },
            { day: "Wed", occupancy: 90 },
            { day: "Thu", occupancy: 40 },
            { day: "Fri", occupancy: 60 },
          ]);
        } else {
          userNotification("error", data.message);
        }
      })
      .catch(() => userNotification("error", "Failed to fetch room details"));
  }, [id]);

  function handleEmptyRoom() {
    fetch(`${process.env.APIKEY}/rooms/${id}/empty`, { method: "PUT" })
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

  function handleAssignPatient() {
    router.push(`/assign-patient?room_id=${id}`);
  }


  return (
    <main className={`${styles["room-details-page"]} wrapper`}>
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
            onClick={handleAssignPatient}
          >
            Assign Patient
          </button>
        </div>
      </section>
    </main>
  );
}
