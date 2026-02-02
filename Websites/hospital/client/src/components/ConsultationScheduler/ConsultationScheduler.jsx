import React, { useState, useMemo, useEffect } from 'react';
import styles from './ConsultationScheduler.module.css';
import { getDaysInMonth, getPrevMonth, getNextMonth, isDateSelectable, monthNames, dayNames, formatDateDisplay,getDayIndexInWeek  } from '@/utils/Date/dateHelpers';
import { calculateEndTime12Hour ,to24Hour , getDefaultStartTime , getCurrentTime24 , convertTimeLocalToUTC, to12Hour, convertTimeUTCToLocal , calculateEndTime24Hour} from '@/utils/Date/timeHelpers';
import { validateBookingData, canSubmitBooking, getConsultationTypeDisplay } from '@/utils/Date/bookingHelpers';
import {parseAvailabilityData,isDateAvailable,getAvailableTimeSlots,getFirstAvailableTimeSlot} from '@/utils/Date/availabilityHelpers';
import formatToMySQLDatetime from "@/utils/Date/formatToMySQLDatetime "
import userNotification from '@/utils/userNotification';

const ConsultationScheduler = ({ onBookingSubmit, availabilityData }) => {
  const [selectedPriceType, setSelectedPriceType] = useState('initial_consultation_price');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endTime,setEndTime] = useState(calculateEndTime24Hour(getDefaultStartTime()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse availability data, parsedAvailability = {"day_indx": {start:"00:00",end:"00:00"}"}
  const parsed_availability = useMemo(() => {
    return parseAvailabilityData(availabilityData);
  }, [availabilityData]);

  // Update start time when date changes to ensure it's within available range
  const updateStartTimeForSelectedDate = (date) => {
    if (!date || Object.keys(parsed_availability).length === 0) {
      setStartTime(getDefaultStartTime());
      return;
    }
    
    const firstAvailableSlot = getFirstAvailableTimeSlot(date, parsed_availability);
    if (firstAvailableSlot) {
      setStartTime(firstAvailableSlot);
    } else {
      setStartTime(getDefaultStartTime());
    }
  };

  //==================================
  // Calendar Navigation Handlers
  //==================================

  const prevMonth = () => {
    setCurrentDate(getPrevMonth(currentDate));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(getNextMonth(currentDate));
  };

  //==================================
  // Handlers
  //==================================

  const handleDateSelect = (day) => {
    if (isDateSelectable(day) && isDateAvailable(day.date, parsed_availability)) {

      setSelectedDate(day.date);
      // get corresponding start time using day's index in availability
      setStartTime(parsed_availability[day.date.getDay()].start) 
    }
  };

  // ==================================
  const handleBooking = async () => {
    if (!selectedDate) {
      userNotification("error",'Please select a date first');
      return;
    }

    if (!onBookingSubmit) {
      console.warn('No booking handler provided');
      return;
    }


      // ==1. first get current date and time in UTC 
      const now = new Date();
      const bookedAtUTC = now.toISOString().slice(0,19).replace('T', ' ');  // YYYY-MM-DD HH:MM:SS in UTC
      // combined is today's date along with selected start time
      const [selected_hour , selected_minutes] = startTime.split(":")
      // Extract date parts from selectedDate
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');

      // startTime is already "HH:MM" in UTC, just append seconds
      const selectedDateUTC = `${year}-${month}-${day} ${startTime}:00`;
      // Result: "2026-02-01 10:30:00"
      
      
    const bookingData = {
      consultationType: selectedPriceType,
      date_time:selectedDateUTC,
      bookedAt: bookedAtUTC,
      startTime: startTime, // already retrived from option's value as UTC 24-hr
      endTime: endTime, // already retrived from option's value as UTC 24-hr
      duration: '1 hour'
    };

    // Validate booking data
    validateBookingData(bookingData);

    setIsSubmitting(true);
    try {
      await onBookingSubmit(bookingData);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // ==========================================================
  // Get calendar days and only available time slots for selected date

    const days = getDaysInMonth(currentDate);

    const availableTimeSlots = getAvailableTimeSlots(getDayIndexInWeek(selectedDate), parsed_availability);
    const canBook = canSubmitBooking(selectedDate, isSubmitting);



  return (
    <div className={styles.consultationScheduler}>
      {/* Price Type Selection */}
      <div className={styles.priceTypeSection}>
        <h3>Select Consultation Type</h3>
        <div className={styles.priceTypeButtons}>
          <button
            className={`${styles.priceBtn} ${selectedPriceType === 'initial_consultation_price' ? styles.priceBtnActive : ''}`}
            onClick={() => setSelectedPriceType('initial_consultation_price')}
          >
            Initial Consultation
          </button>
          <button
            className={`${styles.priceBtn} ${selectedPriceType === 'followup_consultation_price' ? styles.priceBtnActive : ''}`}
            onClick={() => setSelectedPriceType('followup_consultation_price')}
          >
            Follow-up Consultation
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className={styles.calendarNavigation}>
        <button onClick={prevMonth} className={styles.navBtn}>&lt; Previous</button>
        <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button onClick={nextMonth} className={styles.navBtn}>Next &gt;</button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarGrid}>
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className={styles.dayHeader}>{day}</div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const isAvailable = isDateAvailable(day.date, parsed_availability);
          const isSelectable = isDateSelectable(day, isAvailable);
          
          const dayClasses = [
            styles.calendarDay,
            day.isCurrentMonth ? styles.calendarDayCurrentMonth : styles.calendarDayOtherMonth,
            day.isDisabled ? styles.calendarDayDisabled : '',
            !isAvailable ? styles.calendarDayUnavailable : '',
            selectedDate && day.date.toDateString() === selectedDate.toDateString() ? styles.calendarDaySelected : ''
          ].filter(Boolean).join(' ');

          return (
            <div
              key={index}
              className={dayClasses}
              onClick={() => handleDateSelect(day)}
              title={!isAvailable ? 'Not available for booking' : ''}
            >
              <span className={styles.dayNumber}>{day.date.getDate()}</span>
              {day.isCurrentMonth && (
                <div className={styles.dayOfWeek}>{dayNames[day.date.getDay()]}</div>
              )}
              {day.isCurrentMonth && !day.isPastDate  && !isAvailable && (
                <div className={styles.unavailableIndicator}>Unavailable</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className={styles.timeSelection}>
          <h3>Select Start Time for {formatDateDisplay(selectedDate)}</h3>

          {availableTimeSlots.length > 0 ? (
            <>
            { /* Set both start and endtime states to avoid recalling functions many times */}
              <select 
                onChange={(e) => {setStartTime(e.target.value); setEndTime(calculateEndTime24Hour(e.target.value)) }}
                className={styles.timeSelect}
              >
                {/* let option value retrieved be in UTC */}
                {availableTimeSlots.map(time => (
                  <option key={time} value={convertTimeLocalToUTC(time)}>{to12Hour(time)}</option>
                ))}
              </select>
              
              <div className={styles.timeDisplay}>
                {/** startTime uses option value in UTC-24hr so when display we convert to Local-12hr **/}
                <p><strong>Start Time:</strong> {to12Hour(convertTimeUTCToLocal(startTime))}</p>
                <p><strong>End Time:</strong> {to12Hour(convertTimeUTCToLocal(endTime))}</p>
                <p className={styles.durationNote}>Duration: 1 hour (fixed)</p>
              </div>
            </>
          ) : (
            <div className={styles.noSlotsMessage}>
              No available time slots for this date
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className={styles.summary}>
        <h3>Appointment Summary</h3>
        <p><strong>Consultation Type:</strong> {getConsultationTypeDisplay(selectedPriceType)}</p>
        <p><strong>Selected Date:</strong> {selectedDate ? formatDateDisplay(selectedDate) : 'Not selected'}</p>
        <p><strong>Local Time:</strong> {selectedDate ? `${to12Hour(convertTimeUTCToLocal(startTime))} - ${to12Hour(convertTimeUTCToLocal(endTime))}` : 'Not selected'}</p>
        <p><strong>UTC Time:</strong> {selectedDate ? `${startTime} - ${endTime}` : 'Not selected'}</p>
        
        {/* Booking Button */}
        <div className={styles.bookingActions}>
          <button 
            className={`${styles.bookBtn} ${!canBook || availableTimeSlots.length === 0 ? styles.bookBtnDisabled : ''}`}
            onClick={handleBooking}
            disabled={!canBook || availableTimeSlots.length === 0}
          >
            {isSubmitting ? 'Booking...' : 'Book Consultation'}
          </button>
          {!selectedDate && (
            <p className={styles.bookingHint}>Please select a date to book your consultation</p>
          )}
          {selectedDate && availableTimeSlots.length === 0 && (
            <p className={styles.bookingHint}>No available time slots for selected date</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationScheduler;