// components/BookingCard/BookingCard_Fields.js
"use client";
import React from "react";

function DoctorCardFields({ data }) {
  return (
    <>
      <p><strong>Doctor ID:</strong> {data.doctor_id}</p>
      <p><strong>Experience:</strong> {data.years_of_exp} years</p>
      <p><strong>Initial Consultation:</strong> ${data.initial_consultation_price}</p>
      <p><strong>Follow-up Consultation:</strong> ${data.followup_consultation_price}</p>
    </>
  );
}

function SurgeonCardFields({ data }) {
  return (
    <>
      <p><strong>Surgeon ID:</strong> {data.surgeon_id}</p>
      <p><strong>Experience:</strong> {data.years_of_exp} years</p>
      <p><strong>Initial Consultation:</strong> ${data.initial_consultation_price}</p>
      <p><strong>Follow-up Consultation:</strong> ${data.followup_consultation_price}</p>
      <p><strong>Surgery Price:</strong> ${data.surgery_price}</p>
    </>
  );
}

export const CardFieldsMap = {
  "doctor": DoctorCardFields,
  "surgeon": SurgeonCardFields,
};
