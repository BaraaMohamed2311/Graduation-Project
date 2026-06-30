"use client";
import styles from "./nav.module.css";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useLogOut from "@/hooks/useLogOut";
import { useIsLoginContext } from "@/contexts/isLogin";
import { useAlerts } from "@/contexts/alert"; 
import { useUserDataContext } from "@/contexts/user_data";
export default function Nav() {
    const [displayed, setDisplayed] = useState(false);
    const { isLogin } = useIsLoginContext();
    const logOut = useLogOut();
    const NAV_UL_REF = useRef();
    const { unread, clearUnread } = useAlerts();
    const {user_data} = useUserDataContext()
    const isPatient = user_data?.emp_title === undefined || !(user_data?.emp_title) 
    console.log("isPatient",isPatient)
    const noAccessOthersEmp = user_data?.emp_title?.toLowerCase() !== "hr" && user_data?.emp_title?.toLowerCase() !== "manager"
    console.log("noAccessOthersEmp",noAccessOthersEmp)
    const notNurse = user_data?.emp_title?.toLowerCase() !== "nurse"
    const canAccessSchedule = user_data?.emp_title?.toLowerCase() == "doctor" || user_data?.emp_title?.toLowerCase() == "surgeon" || isPatient
    const canAccessPatients = user_data?.emp_title?.toLowerCase() == "doctor" || user_data?.emp_title?.toLowerCase() == "surgeon"  || user_data?.emp_title?.toLowerCase() == "manager" || user_data?.emp_title?.toLowerCase() =="nurse" 

    const canAccessAlert = user_data?.emp_title?.toLowerCase() == "doctor" || user_data?.emp_title?.toLowerCase() == "surgeon" || user_data?.emp_title?.toLowerCase() == "nurse" || isPatient
    console.log("canAccessAlert",canAccessAlert , isPatient)
    function handleBurger() {
        setDisplayed(prev => !prev);
    }

    // Add logic to show/hide nav based on screen width
    useEffect(() => {
        function resizeHandler() {
            if (window.innerWidth > 800) {
                setDisplayed(true); // Display full nav on larger screens
            } else {
                setDisplayed(false); // Hide full nav on smaller screens by default
            }
        }

        // Initial check
        resizeHandler();
        window.addEventListener("resize", resizeHandler);

        return () => {
            window.removeEventListener("resize", resizeHandler);
        };
    }, []);



 

    function handleLogOut() {
        logOut();
    }

    return (
        <nav className={styles.nav}>
            <div className={`wrapper ${styles["nav-wrapper"]}`}>
                <h1><Link   className={styles.logo} href="/">Hospital</Link></h1>
                <ul
                    ref={NAV_UL_REF}
                    className={`${styles["nav-ul"]} ${displayed ? styles.displayed : ""}`}
                    style={{
                        opacity: displayed ? '1' : '0',
                        pointerEvents: displayed ? 'all' : 'none'
                    }}
                >
                    {isPatient  &&  <li className={styles["nav-li"]}><Link href="/private_routes/booking-list"><i className="fa-solid fa-user-doctor"></i></Link></li>}
                { !isPatient && 
                <>
                    { !notNurse && <li className={styles["nav-li"]}><Link href="/private_routes/rooms"><i className="fa-solid fa-bed-pulse"></i></Link></li>}
                    {canAccessPatients && <li className={styles["nav-li"]}><Link href="/private_routes/list"><i className="fa-solid fa-head-side-cough"></i></Link></li>}
                    
                    
                    {!noAccessOthersEmp && <li className={styles["nav-li"]}><Link href="/private_routes/employees-list"><i className="fa-solid fa-users"></i></Link></li>}
                    
                </>}

                {canAccessAlert && (
                        <li className={styles["nav-li"]}>
                            <Link href="/private_routes/alerts" onClick={clearUnread}>
                                {/* The Bell Icon (Always visible, rings when unread > 0) */}
                                <span 
                                    key={`bell-${unread > 0 ? "active" : "idle"}`} 
                                    className={`${styles["bell-icon"]} ${unread > 0 ? styles["ringing"] : ""}`}
                                >
                                    <i className="fa-regular fa-bell"></i>
                                </span>

                                {/* The Badge (Only visible when unread > 0) */}
                                {unread > 0 && (
                                    <span key={`badge-${unread}`} className={styles["alert-badge"]}>
                                        {unread > 99 ? "99+" : unread}
                                    </span>
                                )}
                            </Link>
                        </li>
                    )}
                    
                    
                    { canAccessSchedule && <li className={styles["nav-li"]}><Link href="/private_routes/books-schedule"><i className="fa-solid fa-calendar-days"></i></Link></li>}
                    {isLogin ? (
                        <li className={styles["nav-li"]}><Link href="/private_routes/profile"><i className="fa-solid fa-user"></i></Link></li>
                    ) : (
                        <li className="pink-button"><Link href="/login">Sign In</Link></li>
                    )}
                    {isLogin ? (
                        <li onClick={handleLogOut} className={`grey-button ${styles.logout}`}>Logout</li>
                    ) : (
                        <li className={`grey-button ${styles.logout}`}><Link href="/register">Sign Up</Link></li>
                    )}
                </ul>

                <div onClick={handleBurger} className={styles.burger}>
                    <span className={styles.bars}></span>
                    <span className={styles.bars}></span>
                    <span className={styles.bars}></span>
                </div>
            </div>
        </nav>
    );
}