"use client";

import styles from "./HealthStatus.module.css";
import { useUserDataContext } from "@/contexts/user_data";
import { useState, useEffect, useRef } from "react";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";

export default function HealthState({ user_id, modifierObj, isEditable = true, setHealthStatusParent }) {
  const [healthStatus, setHealthStatus] = useState(null);
  
  const {
    patient_allergic = [],
    patient_chronic_illnes = [],
    patient_health_devices = [],
  } = healthStatus || {};

  const { user_data } = useUserDataContext();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    patient_allergic: [],
    patient_chronic_illnes: [],
    patient_health_devices: []
  });
  
  // Use Reference to make sure to send new data in body of request in handleSaveNewHealthStatus
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Initialize form data with user's healthStatus
  useEffect(() => {
    if (healthStatus) {
      setFormData({
        patient_allergic: healthStatus.patient_allergic ? [...healthStatus.patient_allergic] : [],
        patient_chronic_illnes: healthStatus.patient_chronic_illnes ? [...healthStatus.patient_chronic_illnes] : [],
        patient_health_devices: healthStatus.patient_health_devices ? [...healthStatus.patient_health_devices] : []
      });
    }
  }, [healthStatus]);

  // Fetching Health Status
  useEffect(() => {
    if (!user_id || !user_data?.token) return;

    fetch(`${process.env.APIKEY}/details/patient/health-status/${user_id}`, {
      mode: "cors",
      headers: {
        Authorization: `BEARER ${user_data.token}`,
        "Content-Type": "application/json",
      },
    })
      .then(res => {
        statusNotification(res.status);
        return res.json();
      })
      .then(data => {
        if (data?.success) {
          setHealthStatus(data.body);
          setHealthStatusParent(data.body);
        }
        userNotification(data?.success ? "success" : "error", data.message);
      })
      .catch(err => {
        userNotification("error", "Error Fetching Health Status");
      });
  }, [user_id, user_data?.token, setHealthStatusParent]);

  function handleSaveNewHealthStatus() {
    setEditMode(false);
    fetch(`${process.env.APIKEY}/list/other/patient/health-status?user_id=${user_data.user_id}&perms_requested=Modify Health Status`, {
      method: "PUT",
      mode: "cors",
      headers: {
        Authorization: `BEARER ${user_data.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...formDataRef.current, ...modifierObj })
    })
      .then((res) => {
        statusNotification(res.status);
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          // Success code logic if needed
        } else if (data && !data.success) {
          userNotification("error", data.message);
        }
      });
  }

  return (
    <div className={styles.container}>
      {editMode && (
        <div className={styles.editForm}>
          {/* Allergies */}
          <div>
            <h4>Allergies</h4>
            <input
              type="text"
              placeholder="Add allergy"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  const newValue = e.target.value.trim();
                  setFormData(prev => ({
                    ...prev,
                    patient_allergic: [...prev.patient_allergic, newValue]
                  }));
                  e.target.value = "";
                }
              }}
            />
            <div className={styles.chipContainer}>
              {formData.patient_allergic.map((a, idx) => (
                <span
                  key={idx}
                  className={styles.chip}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      patient_allergic: prev.patient_allergic.filter((_, i) => i !== idx)
                    }))
                  }
                >
                  {a} &times;
                </span>
              ))}
            </div>
          </div>

          {/* Chronic Illnesses */}
          <div>
            <h4>Chronic Illnesses</h4>
            <input
              type="text"
              placeholder="Add chronic illness"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  const newValue = e.target.value.trim();
                  setFormData(prev => ({
                    ...prev,
                    patient_chronic_illnes: [...prev.patient_chronic_illnes, newValue]
                  }));
                  e.target.value = "";
                }
              }}
            />
            <div className={styles.chipContainer}>
              {formData.patient_chronic_illnes.map((c, idx) => (
                <span
                  key={idx}
                  className={styles.chipWarning}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      patient_chronic_illnes: prev.patient_chronic_illnes.filter((_, i) => i !== idx)
                    }))
                  }
                >
                  {c} &times;
                </span>
              ))}
            </div>
          </div>

          <div className={styles.editActions}>
            <button className="green-button" onClick={handleSaveNewHealthStatus}>
              Save
            </button>
            <button className="grey-button" onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2 className={styles.title}>Health State Overview</h2>

      {/* Patient Info */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Patient Information</h3>
      </div>

      {/* Allergies */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Allergies</h3>
        {patient_allergic.length === 0 ? (
          <p className={styles.empty}>No allergies reported</p>
        ) : (
          <div className={styles.chipContainer}>
            {patient_allergic.map((a, idx) => (
              <span className={styles.chip} key={idx}>{a}</span>
            ))}
          </div>
        )}
      </div>

      {/* Chronic Illnesses */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Chronic Illnesses</h3>
        {patient_chronic_illnes.length === 0 ? (
          <p className={styles.empty}>No chronic illnesses reported</p>
        ) : (
          <div className={styles.chipContainer}>
            {patient_chronic_illnes.map((c, idx) => (
              <span className={styles.chipWarning} key={idx}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {isEditable && (
        <button onClick={() => setEditMode(true)} className="grey-button">
          Edit Health Status
        </button>
      )}
    </div>
  );
}