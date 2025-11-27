function isTimeSlotInPast(booking_time, consultation_start_time) {
  // Split hours and minutes
  const [bHours, bMinutes] = booking_time.split(':').map(Number);
  const [cHours, cMinutes] = consultation_start_time.split(':').map(Number);

  // Compare hours first, then minutes
  if (bHours > cHours) return true;        // booking time is later
  if (bHours === cHours && bMinutes > cMinutes) return true; // booking time is later
  return false; // booking time is not after consultation
}

module.exports = isTimeSlotInPast;
