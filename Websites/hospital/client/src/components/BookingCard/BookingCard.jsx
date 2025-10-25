// components/BookingCard/BookingCard.jsx
"use client";
import React from "react";
import Image from "next/image";
import styles from "./BookingCard.module.css";
import { CardFieldsMap } from "./BookingCard_Fields";

export default function BookingCard({ userType, data, onBook }) {
  const CardFields = CardFieldsMap[userType];
  if (!CardFields) return <div>❌ Unknown user type: {userType}</div>;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Image
          src={data.image_url || "/default-profile.png"}
          alt={data.name || "User Image"}
          width={90}
          height={90}
          className={styles.image}
        />
        <div className={styles.info}>
          <h3>{data.name || "Unnamed"}</h3>
          <p className={styles.sub}>{data.specialty || "General"}</p>
        </div>
      </div>

      <div className={styles.body}>
        <CardFields data={data} />
      </div>

      <div className={styles.footer}>
        <button className={styles.bookBtn} onClick={() => onBook(data)}>
          Book Appointment
        </button>
      </div>
    </div>
  );
}
