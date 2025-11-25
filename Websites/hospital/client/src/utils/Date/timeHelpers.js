// Generate time slots for selection
export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

// Calculate end time (always 1 hour after start time)
export const calculateEndTime = (start) => {
  const [hours, minutes] = start.split(':').map(Number);
  let endHours = hours + 1;
  let endMinutes = minutes;
  
  if (endHours >= 24) {
    endHours = endHours - 24;
  }
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Validate time format
export const isValidTime = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Get default start time (9:00 AM)
export const getDefaultStartTime = () => {
  return '09:00';
};

export const minutesTo12Hour = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12 || 12;
    
    // Format minutes with leading zero if needed
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${hours}:${formattedMinutes} ${period}`;
  };