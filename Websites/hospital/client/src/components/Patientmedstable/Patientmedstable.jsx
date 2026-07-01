"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./Patientmedstable.module.css";
import userNotification from "@/utils/userNotification";
import {
  convertTimeLocalToUTC,
  convertTimeUTCToLocal,
  to24Hour,
  to12Hour,
  isValidTime,
} from "@/utils/Date/timeHelpers";

export default function PatientMedsTable({ token, user_id, setPatientMedsParent, isPatientProfile = false }) {
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

      // data.scheduled_times comes back from the API as UTC "HH:MM, HH:MM, ...".
      // We keep the raw UTC strings in state and only convert to local at render time,
      // so re-fetching / re-editing always works off the source-of-truth UTC values.
      setRows(data);
      setPatientMedsParent(data);
    } catch (err) {
      setError(err.message);
      userNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // timesArrayLocal: array of local "HH:MM" or "hh:mm AM/PM" strings from the UI.
  // Converts each to UTC "HH:MM" before sending to the API.
  function localTimesToUTC(timesArrayLocal) {
    return timesArrayLocal.map((t) => {
      const trimmed = t.trim();
      // Accept both "14:00" and "02:00 PM" input formats
      const time24 = /am|pm/i.test(trimmed) ? to24Hour(trimmed.toUpperCase()) : trimmed;

      if (!isValidTime(time24)) {
        throw new Error(`Invalid time value: "${t}". Use HH:MM (24h) or hh:mm AM/PM.`);
      }

      return convertTimeLocalToUTC(time24);
    });
  }

  async function handleEditTimes(assignmentId, timesArrayLocal) {
    try {
      const timesArrayUTC = localTimesToUTC(timesArrayLocal);

      const res = await fetch(`${process.env.APIKEY}/meds/patient-meds/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ times: timesArrayUTC }),
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
    if (!newMed.med_id || !newMed.times) {
      return userNotification("warning", "Enter medicine ID and times (comma-separated)");
    }

    try {
      const timesArrayLocal = newMed.times.split(",").map((t) => t.trim());
      const timesArrayUTC = localTimesToUTC(timesArrayLocal);

      const res = await fetch(`${process.env.APIKEY}/meds/patient-meds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: user_id, med_id: newMed.med_id, times: timesArrayUTC }),
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
              <td colSpan={3} className={styles.emptyCell}>
                No medicines assigned to this patient.
              </td>
            </tr>
          )}
          {rows.map((row) => {
            // row.scheduled_times is UTC "HH:MM, HH:MM, ...". Convert each to local for display.
            const localTimes = row.scheduled_times
              ? row.scheduled_times.split(", ").map((utcTime) => convertTimeUTCToLocal(utcTime))
              : [];

            return (
              <tr key={row.assignment_id}>
                <td className={styles.mono}>{row.med_id}</td>
                <td>
                  {localTimes.length > 0
                    ? localTimes.map((t, i) => (
                        <span key={`${t}-${i}`} className={`${styles.badge} ${styles.badgeOk}`}>
                          {to12Hour(t)}
                        </span>
                      ))
                    : "—"}
                </td>
                {!isPatientProfile && (
                  <td>
                    <button
                      className={styles.btnEdit}
                      onClick={() => {
                        const currentLocalDisplay = localTimes.join(", ");
                        const newTimes = prompt(
                          "Edit times (comma-separated, 24h HH:MM or hh:mm AM/PM, in your local time)",
                          currentLocalDisplay
                        );
                        if (newTimes) {
                          handleEditTimes(
                            row.assignment_id,
                            newTimes.split(",").map((t) => t.trim())
                          );
                        }
                      }}
                    >
                      Edit Times
                    </button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(row.assignment_id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {!isPatientProfile && (
        <div className={styles.addMedForm}>
          <input
            type="text"
            placeholder="Medicine ID"
            value={newMed.med_id}
            onChange={(e) => setNewMed({ ...newMed, med_id: e.target.value })}
          />
          <input
            type="text"
            placeholder="Times, your local time (e.g. 08:00, 14:00 or 08:00 AM, 02:00 PM)"
            value={newMed.times}
            onChange={(e) => setNewMed({ ...newMed, times: e.target.value })}
          />
          <button className={styles.btnAdd} onClick={handleAddNewMed}>
            Add Medicine
          </button>
        </div>
      )}
    </div>
  );
}