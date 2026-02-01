function isDayInPast(bookedAt, consultation_date) {
  const booked = new Date(bookedAt.replace(" ", "T"));
  const consultation = new Date(consultation_date.replace(" ", "T"));

  // Normalize both to start of day to focus on comparing date only
  booked.setHours(0, 0, 0, 0);
  consultation.setHours(0, 0, 0, 0);

  return booked > consultation;
}


module.exports = isDayInPast;