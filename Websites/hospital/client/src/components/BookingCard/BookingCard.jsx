// components/BookingCard/BookingCard.jsx
"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./BookingCard.module.css";
import { CardFieldsMap } from "./BookingCard_Fields";
import getUserImage from "@/utils/getUserImg"

export default function BookingCard({ userType, bookingData, handleBookBtn ,userToken }) {
  const CardFields = CardFieldsMap[userType];

  let [blobURL , setBlobURL] = useState("/avatar.jpg");
 // fetch on first render if wasn't stored in localStorage 
   useEffect(()=>{

       // fetch image

       getUserImage('/files/profile', bookingData.user_id ,userToken ,setBlobURL )
     

 
 } ,[bookingData.user_id])

 
  if (!CardFields) return <div>❌ Unknown user type: {userType}</div>;
  

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Image
          src={blobURL || "/default-profile.png"}
          alt={bookingData.name || "User Image"}
          width={90}
          height={90}
          className={styles.image}
        />
        <div className={styles.info}>
          <h3>{bookingData.user_name || "N/A"}</h3>
          <p className={styles.sub}>{bookingData.user_title || "N/A"}</p>
          <p className={styles.sub}>{bookingData.user_specialty || "N/A"}</p>
        </div>
      </div>

      <div className={styles.body}>

        <CardFields data={bookingData} />
      </div>

      <div className={styles.footer}>
        <button className={styles.bookBtn} onClick={() => handleBookBtn(bookingData)}>
          Book Appointment
        </button>
      </div>
    </div>
  );
}
