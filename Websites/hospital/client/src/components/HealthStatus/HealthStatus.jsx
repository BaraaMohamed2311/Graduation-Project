
import styles from "./HealthStatus.module.css";
import { useUserDataContext } from "@/contexts/user_data";
import { useState , useEffect } from "react";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";

export default function HealthState({user_id}) {
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

useEffect(() => {
  if (healthStatus) {
    setFormData({
      patient_allergic: [...healthStatus.patient_allergic],
      patient_chronic_illnes: [...healthStatus.patient_chronic_illnes],
      patient_health_devices: [...healthStatus.patient_health_devices]
    });
  }
}, [healthStatus]);


    // Fetching Health Status
      useEffect(()=>{
        fetch(`${process.env.APIKEY}/details/patient-health-status/${user_id}`, {
          mode: "cors",
          headers: {
            Authorization: `BEARER ${user_data.token}`,
            "Content-Type": "application/json",
          }})
          .then(res=>{
            statusNotification(res.status);
            return res.json()
          })
          .then(data=>{
            if(data?.success){
              setHealthStatus(data.body)
            }
            userNotification(data?.success ? "success" :"error" , data.message)
          })
          .catch(err=>
          {
            userNotification("error" , "Error Fetching Health Status")
          }
          )
      },[])
      console.log("healthStatus",healthStatus)
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
            setFormData(prev => ({
              ...prev,
              patient_allergic: [...prev.patient_allergic, e.target.value.trim()]
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
            setFormData(prev => ({
              ...prev,
              patient_chronic_illnes: [...prev.patient_chronic_illnes, e.target.value.trim()]
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

    {/* Device Logs (editable values) */}
    <div>
      <h4>Health Device Logs</h4>
      {formData.patient_health_devices.map((d, idx) => (
        <div key={idx} className={styles.deviceCard}>
          <span>{d.device.replaceAll("_"," ")}</span>
          <input
            type="number"
            value={d.value}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => {
                const devices = [...prev.patient_health_devices];
                devices[idx].value = val;
                return { ...prev, patient_health_devices: devices };
              });
            }}
          />
          <span>{d.unit}</span>
        </div>
      ))}
    </div>

    <div className={styles.editActions}>
      <button
        className="green-button"
        onClick={ () => {}}
      >
        Save
      </button>
      <button className="grey-button" onClick={() => setEditMode(false)}>Cancel</button>
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

      {/* Health Devices */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Health Device Logs</h3>

        {patient_health_devices.length === 0 ? (
          <p className={styles.empty}>No device logs recorded</p>
        ) : (
          <div className={styles.deviceGrid}>
            {patient_health_devices.map((d, idx) => (
              <div className={styles.deviceCard} key={idx}>
                <div className={styles.deviceName}>{d.device.replaceAll("_"," ")}</div>
                <div className={styles.deviceValue}>
                  {d.value} <span>{d.unit}</span>
                </div>
                <div className={styles.deviceDate}>
                  {new Date(d.recordedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        <button
                  onClick={() => setEditMode(true) }
                  className="grey-button"
                >
                  Edit Health Status
                </button>
      </div>
    </div>
  );
}
