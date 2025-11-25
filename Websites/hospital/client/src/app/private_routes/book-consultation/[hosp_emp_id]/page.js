"use client";

import styles from "./bookconsultation.module.css";
import private_routes from "../../page";
import ConsultationScheduler from "@/components/ConsultationScheduler/ConsultationScheduler"; // Adjust path as needed
import { useParams } from "next/navigation";
import {useUserDataContext} from "@/contexts/user_data"
import statusNotification from "@/utils/statusNotification";
import userNotification from "@/utils/userNotification";
import { useEffect ,useState} from "react";
import {getYYYYMMDD } from '@/utils/Date/dateHelpers';
function BookConsultationPage() {
    let { hosp_emp_id } = useParams();
    hosp_emp_id = parseInt(hosp_emp_id);
    const { user_data } = useUserDataContext();
    const [availabilityData, setAvailabilityData] = useState(null);
    
    useEffect(() => {
        fetch(`${process.env.APIKEY}/booking/get-availability?hosp_emp_id=${hosp_emp_id}`, {
            method: "GET",
            mode: "cors",
            headers: {
                "content-type": "application/json",
                Authorization: `BEARER ${user_data.token}`,
            }})
        .then((res) => {
            statusNotification(res.status);
            return res.json();
        })
        .then((data) => {
            if (data?.success) {
                setAvailabilityData(data.body);
                console.log("Availability Data:", data.body);
            } else {
                userNotification("error", data.message);
            }
        })
        .catch((error) => {
            console.error("Error fetching availability data:", error);
        });
    }, [hosp_emp_id]);


    function onBookingSubmit(bookingData) {
        console.log("Booking Data Submitted:", bookingData);
        // Format the date for API (YYYY-MM-DD)
        const consultation_date = getYYYYMMDD(bookingData.date);
        console.log("consultation_date", consultation_date);
        const start_time = bookingData.startTime;
        const end_time = bookingData.endTime;

        fetch(`${process.env.APIKEY}/booking/book-consultation`, {
            method: "POST",
            mode: "cors",
            headers: {  
                "content-type": "application/json",
                Authorization: `BEARER ${user_data.token}`,
            },
            body: JSON.stringify({
                hosp_emp_id,       // Doctor or Surgeon ID (from employees_hospital)
                patient_id: user_data.user_id,  // The selected availability slot
                consultation_date ,
                start_time,
                end_time,
                consultation_type: bookingData.consultationType // Added consultation type
            })
        })
        .then((res) => {
            statusNotification(res.status); // Uncomment if you have this function
            return res.json();
        })
        .then((data) => {
            if (data?.success) {
                userNotification("success", data.message); // Uncomment if you have this function

            } else {
                userNotification("error", data.message); // Uncomment if you have this function
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            throw error; 
        });
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.content}>
                {/* Header Section */}
                <div className={styles.header}>
                    <h1>Book Your Consultation</h1>
                    <p>Schedule your appointment with our healthcare professionals. Choose between initial or follow-up consultations and find the perfect time slot for your needs.</p>
                </div>

                {/* Main Booking Card */}
                <div className={styles.bookingCard}>
                    <div className={styles.cardHeader}>
                        <h2>Schedule Appointment</h2>
                        <p>Select your consultation type, choose a date, and pick your preferred time</p>
                    </div>
                    
                    {/* Consultation Scheduler Component */}
                    <ConsultationScheduler 
                    onBookingSubmit={onBookingSubmit}
                    availabilityData={availabilityData}
                    />
                </div>

                {/* Features Section */}
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>📅</div>
                        <h3>Flexible Scheduling</h3>
                        <p>Choose from available dates and times that work best for your schedule with our easy-to-use calendar interface.</p>
                    </div>
                    
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>⏰</div>
                        <h3>1-Hour Sessions</h3>
                        <p>Each consultation is a dedicated 1-hour session to ensure comprehensive care and attention to your needs.</p>
                    </div>
                    
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>💰</div>
                        <h3>Transparent Pricing</h3>
                        <p>Clear distinction between initial and follow-up consultation prices with no hidden fees.</p>
                    </div>
                    
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🔒</div>
                        <h3>Secure & Private</h3>
                        <p>Your appointment details are kept confidential and secure with our privacy-first approach.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <p>Need help? Contact our support team at support@healthcare.com</p>
                    <p>© 2024 Healthcare Services. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

export default private_routes(BookConsultationPage);