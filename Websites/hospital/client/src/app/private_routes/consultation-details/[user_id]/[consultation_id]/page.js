"use client";
import { UserDetailsComponents } from "./ConsultationDetails_Fields";
import { useEffect, useState, useMemo } from "react";
import { convertTimeUTCToLocal, minutesTo12Hour , to12Hour} from "@/utils/Date/timeHelpers";
import { convertUTCToLocal} from "@/utils/Date/dateHelpers";

import { useParams } from "next/navigation";
import statusNotification from "@/utils/statusNotification";
import userNotification from "@/utils/userNotification";
import styles from "./ConsultationDisplay.module.css";
import { useUserDataContext } from "@/contexts/user_data";

function ConsultationDetails() {
  const [consultationPageDetails, setConsultationPageDetails] = useState(null);
  const { user_id, consultation_id } = useParams();
  const { user_data } = useUserDataContext();
  // checks consultationPageDetails to prevent accessing property of undefined
  // checks otherUserDetails cuz there might me consultation details but no user details
  // checks existance of emp_title
  const UserDetailsComponent = UserDetailsComponents[consultationPageDetails?.otherUserDetails?.emp_title?.toLowerCase()] || (()=>(<p>No User Details to be displayed</p>));

  // ---------------- Safe extract date ----------------
  function extractDate(dateString) {
    if (!dateString || typeof dateString !== "string") return "N/A";
    const parts = dateString.split(" ");
    return parts[0] || "N/A";
  }

  // ---------------- Status badge class ----------------
  function getStatusClass(status) {
    if (!status || typeof status !== "string") return styles.statusDefault;

    const map = {
      available: styles.statusAvailable,
      scheduled: styles.statusScheduled,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled,
    };

    return map[status.toLowerCase()] || styles.statusDefault;
  }

  // ---------------- Safe date/time conversions ----------------
  const start_time_12h = useMemo(() => {
    const start = consultationPageDetails?.consultationDetails?.start_time;
    if (!start) return null;

    const local = convertTimeUTCToLocal(start);
    if (!local) return null;

    return to12Hour(local);
  }, [consultationPageDetails]);

  const end_time_12h = useMemo(() => {
    const end = consultationPageDetails?.consultationDetails?.end_time;
    if (!end) return null;

    const local = convertTimeUTCToLocal(end);
    if (!local) return null;

    return to12Hour(local);
  }, [consultationPageDetails]);

  // ---------------- Fetch consultation ----------------
  useEffect(() => {
    if (!user_data?.token) return; // avoid crash before context loads

    fetch(
      `${process.env.APIKEY}/booking/get-consultation/${user_id}/${consultation_id}`,
      {
        mode: "cors",
        headers: {
          authorization: `BEARER ${user_data.token}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => {
        statusNotification(res.status);
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setConsultationPageDetails(data.body || null);
        }
        userNotification(data?.success ? "success" : "error", data.message);
      })
      .catch(() => {
        userNotification("error", "Error fetching consultation details");
      });
  }, [user_data?.token]); // wait for token to exist

  const details = consultationPageDetails?.consultationDetails;
  const user_details = consultationPageDetails?.otherUserDetails;

  return (
    <div className={styles.consultation_details_wrapper}>
      <div className={styles.consultationContainer}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Consultation Details</h2>
          <span
            className={`${styles.statusBadge} ${getStatusClass(
              details?.consultation_status
            )}`}
          >
            {details?.consultation_status || "Unknown"}
          </span>
        </div>

        <div className={styles.content}>
          {/* Time Grid */}
          <div className={styles.timeGrid}>
            <div className={styles.timeCard}>
              <h3 className={styles.timeLabel}>Consultation Date</h3>
              <p className={styles.timeValue}>
                {extractDate(convertUTCToLocal(details?.consultation_date))}
              </p>
            </div>

            <div className={styles.timeCard}>
              <h3 className={styles.timeLabel}>Start Time</h3>
              <p className={styles.timeValue}>{start_time_12h || "N/A"}</p>
            </div>

            <div className={styles.timeCard}>
              <h3 className={styles.timeLabel}>End Time</h3>
              <p className={styles.timeValue}>{end_time_12h || "N/A"}</p>
            </div>
          </div>

          {/* Consultation Type */}
          <div className={styles.typeCard}>
            <h3 className={styles.typeLabel}>Consultation Type</h3>
            <div className={styles.typeContent}>
              <span className={styles.typeValue}>
                {details?.consultation_type || "Unknown"}
              </span>
              <span className={`${styles.typeBadge}`}>
                {details?.consultation_type || "Unknown"}
              </span>
            </div>
          </div>

          {/* Created at */}
          <div className={styles.footer}>
            <div className={styles.createdInfo}>
              <svg
                className={styles.timeIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Created: {extractDate(convertUTCToLocal(details?.created_at))}
              </span>
            </div>
          </div>
          <UserDetailsComponent user_data={user_details} />
        </div>
      </div>
    </div>
  );
}

export default ConsultationDetails;
