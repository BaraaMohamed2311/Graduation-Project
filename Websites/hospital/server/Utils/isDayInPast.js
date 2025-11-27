function isDayInPast(bookedAt , consultation_date) {
  // Convert both strings to Date objects in local time
  const booked = new Date(bookedAt.replace(" ", "T"));
  const consultation = new Date(consultation_date.replace(" ", "T"));

  // If booked date/time is after consultation date/time → it's invalid (past)
  return booked > consultation;
}

module.exports = isDayInPast;