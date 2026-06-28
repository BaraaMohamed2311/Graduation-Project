"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./Patientmedstable.module.css";
import userNotification from "@/utils/userNotification";

export default function PatientMedsTable({ token, user_id , setPatientMedsParent}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMed, setNewMed] = useState({ med_id: "", times: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.APIKEY}/meds/patient-meds?user_id=${user_id}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to fetch patient medicines");
      }

      setRows(data); // or data.rows if your API returns { success, rows }
      setPatientMedsParent(data);
    } catch (err) {
      setError(err.message);
      userNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(assignmentId) {
    if (!confirm("Are you sure you want to delete this medicine assignment?")) return;
    try {
      const res = await fetch(`${process.env.APIKEY}/meds/patient-meds/${assignmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to delete assignment");

      userNotification("success", "Medicine assignment deleted successfully");
      fetchData();
    } catch (err) {
      userNotification("error", err.message);
    }
  }

  async function handleEditTimes(assignmentId, timesArray) {
    try {
      const res = await fetch(`${process.env.APIKEY}/meds/patient-meds/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ times: timesArray }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to update times");

      userNotification("success", "Times updated successfully");
      fetchData();
    } catch (err) {
      userNotification("error", err.message);
    }
  }

  async function handleAddNewMed() {
    if (!newMed.med_id || !newMed.times) return userNotification("warning", "Enter medicine ID and times (comma-separated)");
    const timesArray = newMed.times.split(",").map(t => t.trim());
    try {
      const res = await fetch(`${process.env.APIKEY}/meds/patient-meds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: user_id, med_id: newMed.med_id, times: timesArray }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to add new medicine");

      setNewMed({ med_id: "", times: "" });
      userNotification("success", "New medicine added successfully");
      fetchData();
    } catch (err) {
      userNotification("error", err.message);
    }
  }

  if (loading) return <p className={styles.emptyCell}>Loading patient medicines…</p>;
  if (error) return <></>;

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Medicine ID</th>
            <th>Scheduled Times</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className={styles.emptyCell}>No medicines assigned to this patient.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.assignment_id}>
              <td className={styles.mono}>{row.med_id}</td>
              <td>
                {row.scheduled_times
                  ? row.scheduled_times.split(", ").map((t) => (
                      <span key={t} className={`${styles.badge} ${styles.badgeOk}`}>{t}</span>
                    ))
                  : "—"}
              </td>
              <td>
                <button
                  className={styles.btnEdit}
                  onClick={() => {
                    const newTimes = prompt("Edit times (comma-separated)", row.scheduled_times);
                    if (newTimes) handleEditTimes(row.assignment_id, newTimes.split(",").map(t => t.trim()));
                  }}
                >
                  Edit Times
                </button>
                <button className={styles.btnDelete} onClick={() => handleDelete(row.assignment_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.addMedForm}>
        <input
          type="text"
          placeholder="Medicine ID"
          value={newMed.med_id}
          onChange={e => setNewMed({ ...newMed, med_id: e.target.value })}
        />
        <input
          type="text"
          placeholder="Times (comma-separated, e.g. 08:00, 14:00)"
          value={newMed.times}
          onChange={e => setNewMed({ ...newMed, times: e.target.value })}
        />
        <button className={styles.btnAdd} onClick={handleAddNewMed}>Add Medicine</button>
      </div>
    </div>
  );
}