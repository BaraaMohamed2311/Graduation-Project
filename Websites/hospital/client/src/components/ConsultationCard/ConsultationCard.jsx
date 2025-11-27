// components/ConsultationCard.jsx
import styles from "./ConsultationCard.module.css";
import {convertUTCToLocal } from '@/utils/Date/dateHelpers';
import { convertTimeUTCToLocal,minutesTo12Hour } from '@/utils/Date/timeHelpers';
import {convertTimeToMinutes} from '@/utils/Date/availabilityHelpers';
export default function ConsultationCard({ consultation_data }) {
  const iso = consultation_data.consultation_date;
  const utcString = iso.replace('T', ' ').split('.')[0]; // "2024-11-30 20:00:00"
  const date = convertUTCToLocal(utcString).split(" ")[0]
  const start_time = minutesTo12Hour(convertTimeToMinutes(convertTimeUTCToLocal(consultation_data.start_time)));
  const end_time = minutesTo12Hour(convertTimeToMinutes(convertTimeUTCToLocal(consultation_data.end_time)));
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
        <button className={styles.button}>View Details</button>
      </div>
    </div>
  );
}
