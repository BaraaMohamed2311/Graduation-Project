"use client";
import Image from "next/image";
import styles from "./home.module.css";
import Footer from "@/components/Footer/Footer";
import { useEffect } from "react";

export default function Home() {
  // useClosure to create debouncer to limit number of executions
    function debounce(callback, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                callback.apply(this, args);
            }, delay);
        };
    }

    useEffect(() => {
        const roles_cards = document.querySelectorAll(".role-cards");
        const debouncedHandleMouseMoveGlow = debounce(handleMouseMoveCircle, 200);

        roles_cards.forEach((role_card) => {
            role_card.addEventListener("pointermove", debouncedHandleMouseMoveGlow);
        });

        return () => {
            roles_cards.forEach((role_card) => {
                role_card.removeEventListener("pointermove", debouncedHandleMouseMoveGlow);
            });
        };
    }, []);

    function handleMouseMoveCircle(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.target.style.setProperty("--x", `${x}px`);
        e.target.style.setProperty("--y", `${y}px`);
    }

    return (
        <>
    <main className={styles["home-main"]}>
        <div className={styles["wrapper"]}>
            <div className={styles["left-box"]}>
                <h2 className="home-main-h1">Hospital Management System</h2>
                <p className="home-main-p">
                    A centralized platform designed to manage hospital operations securely and efficiently.
                </p>
                <p className="home-main-p">
                    The system allows patients, employees, and administrators to interact based on clearly defined roles,
                    <br /> while ensuring all actions and data modifications are fully audited.
                </p>
            </div>
            <div className={styles["right-box"]}>
                <Image
                    className="home-main-img"
                    priority={true}
                    src={"/busunessman2.png"}
                    width={500}
                    height={500}
                    alt="Main Section Home Page Image"
                />
            </div>
        </div>
    </main>



            <Footer />
        </>
    );
}
