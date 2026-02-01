import React, { useState } from 'react';
import styles from './AvailabilitySelector.module.css';
import { convertTimeLocalToUTC, convertTimeUTCToLocal , calculateEndTime12Hour, to12Hour  } from '@/utils/Date/timeHelpers';
import {generateAllTimeSlots} from "@/utils/Date/availabilityHelpers.js"
import userNotification from '@/utils/userNotification';

const AvailabilitySelector = ({ onSubmit, initialAvailability = "" }) => {
  // Days of the week (0 = Sunday, 6 = Saturday)
  const daysOfWeek = [
    { index: 0, name: 'Sunday', shortName: 'Sun' },
    { index: 1, name: 'Monday', shortName: 'Mon' },
    { index: 2, name: 'Tuesday', shortName: 'Tue' },
    { index: 3, name: 'Wednesday', shortName: 'Wed' },
    { index: 4, name: 'Thursday', shortName: 'Thu' },
    { index: 5, name: 'Friday', shortName: 'Fri' },
    { index: 6, name: 'Saturday', shortName: 'Sat' }
  ];

  // Parse initial availability from "0: 07:00-15:00; 2: 08:00-16:00" format
  // Convert UTC times to local for display
  const parseInitialAvailability = () => {
    if (!initialAvailability || initialAvailability.trim() === '') return {};
    
    const parsed = {};
    const days = initialAvailability.split(';').map(d => d.trim()).filter(Boolean);
    
    days.forEach(day => {
      const colonIndex = day.indexOf(':');
      if (colonIndex === -1) return;
      
      const dayIndex = parseInt(day.slice(0, colonIndex).trim());
      const timeRange = day.slice(colonIndex + 1).trim();
      
      if (timeRange && !isNaN(dayIndex)) {
        const [startUTC, endUTC] = timeRange.split('-').map(time => time.trim());
        
        // Convert UTC to local for display
        const startLocal = convertTimeUTCToLocal(startUTC);
        const endLocal = convertTimeUTCToLocal(endUTC);
        
        parsed[dayIndex] = {
          start: startLocal,
          end: endLocal
        };
      }
    });
    
    return parsed;
  };

  const [selectedDays, setSelectedDays] = useState(parseInitialAvailability());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle day selection
  const toggleDay = (dayIndex) => {
    setSelectedDays(prev => {
      const newSelected = { ...prev };
      
      if (newSelected[dayIndex]) {
        // Remove day if already selected
        delete newSelected[dayIndex];
      } else {
        // Add day with default times (9 AM - 5 PM in 24h format)
        newSelected[dayIndex] = {
          start: '09:00',
          end: '17:00'
        };
      }
      
      return newSelected;
    });
  };

  // Update start time for a specific day
  const updateStartTime = (dayIndex, time) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        start: time
      }
    }));
  };

  // Update end time for a specific day
  const updateEndTime = (dayIndex, time) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        end: time
      }
    }));
  };

  // Validate times
  const validateTimes = () => {
    for (const dayIndex in selectedDays) {
      const { start, end } = selectedDays[dayIndex];
      
      if (!start || !end) {
        userNotification('error', 'Please set both start and end times for all selected days');
        return false;
      }

      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        const dayName = daysOfWeek.find(d => d.index === parseInt(dayIndex))?.name;
        userNotification('error', `End time must be after start time for ${dayName}`);
        return false;
      }
    }
    
    return true;
  };

  // Convert selectedDays to the required string format with UTC times
  const buildAvailabilityString = () => {
    const parts = [];
    
    // Sort by day index to maintain consistent order
    Object.entries(selectedDays)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([dayIndex, times]) => {
        // Extract UTC times, remember options value were in UTC already
        const startUTC = times.start;
        const endUTC = times.end;
        
        // Format: "dayIndex: startUTC-endUTC"
        parts.push(`${dayIndex}: ${startUTC}-${endUTC}`);
      });
    
    // Join with semicolon and space: "0: 07:00-15:00; 2: 08:00-16:00"
    return parts.join('; ');
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (Object.keys(selectedDays).length === 0) {
      userNotification('error', 'Please select at least one day');
      return;
    }

    if (!validateTimes()) {
      return;
    }

    setIsSubmitting(true);


      const availabilityString = buildAvailabilityString();
      console.log('Sending availability:', availabilityString);
      
      await onSubmit(availabilityString);
      setIsSubmitting(false);

  };



  const timeOptions = generateAllTimeSlots();

  return (
    <div className={styles.availabilitySelector}>
      <h2>Set Your Availability</h2>
      <p className={styles.instructions}>
        Select the days you're available and set your working hours (times shown in your local timezone)
      </p>

      {/* Days Grid */}
      <div className={styles.daysGrid}>
        {daysOfWeek.map(day => {
          const isSelected = selectedDays.hasOwnProperty(day.index);
          
          return (
            <div
              key={day.index}
              className={`${styles.dayCard} ${isSelected ? styles.dayCardSelected : ''}`}
              onClick={() => toggleDay(day.index)}
            >
              <div className={styles.dayHeader}>
                <span className={styles.dayName}>{day.name}</span>
                <div className={styles.checkbox}>
                  {isSelected && <span className={styles.checkmark}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Selection for Selected Days */}
      {Object.keys(selectedDays).length > 0 && (
        <div className={styles.timeSelectionSection}>
          <h3>Set Working Hours</h3>
          
          {Object.entries(selectedDays)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([dayIndex, times]) => {
              const dayName = daysOfWeek.find(d => d.index === parseInt(dayIndex))?.name;
              
              return (
                <div key={dayIndex} className={styles.timeRow}>
                  <div className={styles.dayLabel}>{dayName}</div>
                  
                  <div className={styles.timeInputs}>
                    <div className={styles.timeInputGroup}>
                      <label>Start Time</label>
                      <select
                        value={times.start}
                        onChange={(e) => updateStartTime(parseInt(dayIndex), e.target.value)}
                        className={styles.timeSelect}
                      >
                        {
                        // we make sure we display in 12hr format and retireve UTC value for request
                        timeOptions.map(time => (
                          <option key={time} value={convertTimeLocalToUTC(time)}>{to12Hour(time)}</option>
                        ))}
                      </select>
                    </div>

                    <span className={styles.timeSeparator}>to</span>

                    <div className={styles.timeInputGroup}>
                      <label>End Time</label>
                      <select
                        value={times.end}
                        onChange={(e) => updateEndTime(parseInt(dayIndex), e.target.value)}
                        className={styles.timeSelect}
                      >
                        {// we make sure we display in 12hr format and retireve UTC value for request
                        timeOptions.map(time => (
                          <option key={time} value={convertTimeLocalToUTC(time)}>{to12Hour(time)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    className={styles.removeDayBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDay(parseInt(dayIndex));
                    }}
                    title="Remove this day"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* Summary */}
      <div className={styles.summary}>
        <h3>Summary</h3>
        {Object.keys(selectedDays).length === 0 ? (
          <p className={styles.noSelection}>No days selected</p>
        ) : (
          <div className={styles.summaryList}>
            {Object.entries(selectedDays)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([dayIndex, times]) => {
                const dayName = daysOfWeek.find(d => d.index === parseInt(dayIndex))?.name;
                return (
                  <div key={dayIndex} className={styles.summaryItem}>
                    {/* We also display UTC time for checking */}
                    <strong>{dayName}:</strong> {times.start} - {times.end} (UTC time)
                  </div>
                );
              })}
            <div className={styles.summaryNote}>
              Times will be converted to UTC when saved
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className={styles.actions}>
        <button
          className={`${styles.submitBtn} ${Object.keys(selectedDays).length === 0 ? styles.submitBtnDisabled : ''}`}
          onClick={handleSubmit}
          disabled={Object.keys(selectedDays).length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Confirm Availability'}
        </button>
      </div>
    </div>
  );
};

export default AvailabilitySelector;