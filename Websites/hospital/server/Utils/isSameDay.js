function isSameDay(dateTime1, dateTime2) {
  const d1 = new Date(dateTime1.replace(" ", "T"));
  const d2 = new Date(dateTime2.replace(" ", "T"));

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

module.exports = isSameDay;
