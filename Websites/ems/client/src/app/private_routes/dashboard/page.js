"use client";
import { useEffect, useRef, useState } from "react";
import private_routes from "../page";
import styles from "./dashboard.module.css";
import { useUserDataContext } from "@/contexts/user_data";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";
import MoneyShortner from "@/utils/MoneyShortner";


function DashboardPage() {
    const { user_data } = useUserDataContext();
    const [displayedData, setDisplayedData] = useState({});
    let chart = useRef(null);
    
    

    useEffect(() => {
        
        fetch(`${process.env.APIKEY}/dashboard/main`, {
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                Authorization: `BEARER ${user_data.token}`
            }
        })
        .then((res) => {
            statusNotification(res.status);
            return res.json();
        })
        .then((data) => {
            if (data && data.success) {
                setDisplayedData(data.body);
            } else {
                userNotification("error", "Failed To Fetch Dashboard Data");
            }
        })
        .catch((err) => {
            userNotification("error", "Error Fetching Dashboard Data");
            console.error("Error Fetching Dashboard Data: ", err);
        });
    }, [user_data.token]);

    

    return (
        <main className={`${styles.dashboardContainer} wrapper`}>
            <div className={styles.analyticsGrid}>
                <div className={styles.analyticsBox}>
                    <h2>Total Users</h2>
                    <p className={styles.analyticsValue}>{displayedData.numOfEmployees}</p>
                </div>
                <div className={styles.analyticsBox}>
                    <h2>Super Admins</h2>
                    <p className={styles.analyticsValue}>{displayedData.numOfSuperAdmins}</p>
                </div>
                <div className={styles.analyticsBox}>
                    <h2>Admins</h2>
                    <p className={styles.analyticsValue}>{displayedData.numOfAdmins}</p>
                </div>
                <div className={styles.analyticsBox}>
                    <h2>Absence Rate</h2>
                    <p className={styles.analyticsValue}>{displayedData.totalAbscence}</p>
                </div>
                <div className={styles.analyticsBox}>
                    <h2>Total Salaries Paid</h2>
                    <p className={styles.analyticsValue}>{MoneyShortner(displayedData.totalSalariesPaid)}</p>
                </div>
                <div className={styles.analyticsBox}>
                    <h2>Total Bonus</h2>
                    <p className={styles.analyticsValue}>{MoneyShortner(displayedData.totalBonusPaid)}</p>
                </div>
                
                
            </div>
        </main>
    );
}

export default private_routes(DashboardPage);
