function isDayInPast(date) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDay();

    const targetedDate = new Date(date);
  
  const targetedYear = targetedDate.getFullYear();
  const targetedMonth = targetedDate.getMonth();
  const targetedDay = targetedDate.getDay();

  
  
  
  // Add current month days
    const isPastDate = targetedYear < currentYear || (targetedYear === currentYear && targetedMonth < currentMonth) || (targetedYear === currentYear && targetedMonth === currentMonth && targetedDay < currentDay);
    return isPastDate;
}

module.exports = isDayInPast;