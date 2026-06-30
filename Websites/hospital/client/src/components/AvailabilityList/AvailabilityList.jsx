"use client";
import { useEffect, useState } from "react";
import styles from "./AvailabilityList.module.css"
import { to12Hour, convertTimeUTCToLocal } from '@/utils/Date/timeHelpers';
import { useUserDataContext } from "@/contexts/user_data";
import userNotification from "@/utils/userNotification";

const AvailabilityList = ({ user_id, availability_schedule, availabilityUpdated }) => {
  const { user_data } = useUserDataContext();
  const [schedule, setSchedule] = useState(availability_schedule);

  // keep in sync if the initial cached value changes (e.g. employee swapped)
  useEffect(() => {
    setSchedule(availability_schedule);
  }, [availability_schedule]);

  // refetch only the availability after an update
  useEffect(() => {
    if (!availabilityUpdated || !user_id || !user_data?.token) return;

    fetch(`${process.env.APIKEY}/details/employee/availability/${user_id}`, {
      mode: "cors",
      method: "GET",
      headers: {
        authorization: `BEARER ${user_data.token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.body) {
          setSchedule(data.body.availability_schedule);
        } else {
          userNotification("error", data?.message || "Error Fetching Availability");
        }
      })
      .catch((err) => {
        console.error("Error Fetching Availability", err);
        userNotification("error", "Error Fetching Availability");
      });
  }, [availabilityUpdated, user_id, user_data?.token]);

  return (<>
    <strong className={styles.availability_header}>Availability</strong>
    <div className={styles.availability_wrapper}>
      {schedule && schedule !== "None" ? (
        schedule.split("; ").map((entry) => {
          const [dayIndex, timeRange] = entry.split(": ");
          const [startTime, endTime] = timeRange.split("-");
          const days = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" };
          const startTime_local = to12Hour(convertTimeUTCToLocal(startTime));
          const endTime_local = to12Hour(convertTimeUTCToLocal(endTime));
          return (
            <div key={dayIndex} className={styles.schedule_item}>
              <span className={styles.day}>{days[dayIndex] || `Day ${dayIndex}`}</span>
              <span className={styles.time}>{startTime_local} - {endTime_local}</span>
            </div>
          );
        })
      ) : "No schedule available"}
    </div>
  </>);
}

export default AvailabilityList;