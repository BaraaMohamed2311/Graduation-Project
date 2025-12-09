// components/ConsultationCard.jsx
import styles from "./ConsultationCard.module.css";
import {convertUTCToLocal } from '@/utils/Date/dateHelpers';
import { convertTimeUTCToLocal,to12Hour } from '@/utils/Date/timeHelpers';
import {convertTimeToMinutes} from '@/utils/Date/availabilityHelpers';
import { global_consultation_status } from "@/global_data";
import { useState } from "react";
import { useUserDataContext } from "@/contexts/user_data";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";
export default function ConsultationCard({ consultation_data , handleViewConsultation , setConsultations }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const iso = consultation_data?.consultation_date;
  const utcString = iso.replace('T', ' ').split('.')[0]; // "2024-11-30 20:00:00"
  const date = convertUTCToLocal(utcString).split(" ")[0]
  const start_time = consultation_data?.start_time ?  to12Hour(convertTimeUTCToLocal(consultation_data.start_time)) : "N/A";
  const end_time = consultation_data?.end_time ?  to12Hour(convertTimeUTCToLocal(consultation_data.end_time)): "N/A";
  const {user_data} = useUserDataContext();

  const AllowableNewStatus = global_consultation_status.filter(({value, text})=> value !== "Scheduled" && value !== "Available")

  function handleStatusUpdate(consultation_id, newStatus) {
  fetch(`${process.env.APIKEY}/booking/update-consultation-status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `BEARER ${user_data.token}`,
    },
    body: JSON.stringify({
      consultation_id,
      new_status: newStatus
    })
  })
    .then(res => {
      statusNotification(res.status);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        userNotification("success", "Status updated");

        setConsultations(prev =>
          prev.map(c =>
            c.consultation_id === consultation_id
              ? { ...c, consultation_status: newStatus }
              : c
          )
        );
      } else {
        userNotification("error", data.message);
      }
    })
    .catch(() => {
      userNotification("error", "Failed to update status");
    });
}

function handleRemoveConsultation(consultation_id, user_id) {
  fetch(`${process.env.APIKEY}/booking/delete-appointment?consultation_id=${consultation_id}&user_id=${user_id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `BEARER ${user_data.token}`,
    }
  })
    .then(res => {
      statusNotification(res.status);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        setConsultations(prev =>
          prev.filter(c => c.consultation_id !== consultation_id)
        );
      } 
        userNotification(data.success? "success" :"error", data.message);

    })
    .catch((err) => {
      console.log("err", err)
      userNotification("error", "Failed to Remove Consultation");
    });
}

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Consultation</h2>

        <span
          className={`${styles.status} ${
            styles[consultation_data.consultation_status.toLowerCase()]
          }`}
        >
          {consultation_data.consultation_status}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.label}>Date:</span>
          <span>{date}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Start Time:</span>
          <span>{ start_time || "NA"}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>End Time:</span>
          <span>{end_time}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Type:</span>
          <span>{consultation_data.consultation_type.replaceAll("_", " ")}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.button} onClick={(e)=>setShowStatusMenu(prev => !prev)}>Update Status</button>
        <button className={styles.button} onClick={(e)=>handleViewConsultation(consultation_data.consultation_id)}>View Details</button>
        <button className={styles.button} onClick={(e)=>handleRemoveConsultation(consultation_data.consultation_id,user_data.user_id )}>Remove</button>
        {/* STATUS DROPDOWN MENU */}
          {showStatusMenu && (
            <div className={styles.statusMenu}>
              {AllowableNewStatus.map(opt => (
                <button
                  key={opt.value}
                  className={styles.statusOption}
                  onClick={() => {
                    setShowStatusMenu(false);
                    handleStatusUpdate(
                      consultation_data.consultation_id,
                      opt.value
                    );
                  }}
                >
                  {opt.text}
                </button>
              ))}
              </div>)}
              
      </div>
    </div>
  );
}
