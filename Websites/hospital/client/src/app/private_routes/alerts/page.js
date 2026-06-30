"use client";
import { useEffect, useState } from "react";
import { useAlerts } from "@/contexts/alert"; // was wrongly imported from "../layout"
import styles from "./alerts.module.css";
import private_routes from "../page";
import { useUserDataContext } from "@/contexts/user_data";

const LIMIT = 10;

function AlertPage() {
  const { clearUnread } = useAlerts();

  const [medication,    setMedication]    = useState([]);
  const [critical,      setCritical]      = useState([]);
  const [consultation,  setConsultation]  = useState([]);

  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newCount,   setNewCount]   = useState(0);
  const {user_data} = useUserDataContext()

  // NOTE: assuming emp_title also carries "patient" for non-staff accounts.
  // If patients are tracked on a different field, swap this out accordingly.
  const role = user_data?.emp_title?.toLowerCase();
  const isPatient = !(user_data?.emp_title);
  const notNurse = role !== "nurse";
  const canSeeConsultations = isPatient || role === "doctor" || role === "surgeon";
  const canSeeCritical = role === "doctor"  || role === "nurse";
  const isFirstPage = page === 1;

  // Clear bell badge when nurse opens the alerts page
  useEffect(() => { clearUnread(); }, []);

  // Fetch paginated history from MongoDB whenever page changes
  useEffect(() => {
    fetch(`${process.env.APIKEY}/alerts?page=${page}&user_id=${user_data.user_id}&limit=${LIMIT}`)
      .then((r) => r.json())
      .then(({ alerts, totalPages: tp }) => {
        setTotalPages(tp);
        setMedication(alerts.filter((a) => a.alert_type === "medication"));
        setCritical(alerts.filter((a) => a.alert_type === "critical"));
        setConsultation(alerts.filter((a) => a.alert_type === "consultation"));
        if (page !== 1) setNewCount(0);
      });
  }, [page]);

  // SSE — prepend to correct column if on page 1, otherwise just bump banner count
  useEffect(() => {
    const es = new EventSource(`${process.env.APIKEY}/alerts/stream`);

    es.onmessage = (e) => {
      const alert = JSON.parse(e.data);
      if (isFirstPage) {
        if (alert.alert_type === "medication")
          setMedication((prev) => [{ ...alert, isNew: true }, ...prev]);
        else if (alert.alert_type === "consultation")
          setConsultation((prev) => [{ ...alert, isNew: true }, ...prev]);
        else
          setCritical((prev) => [{ ...alert, isNew: true }, ...prev]);
      }
      setNewCount((prev) => prev + 1);
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, [isFirstPage]);

  const renderCard = (alert) => {
    const status = alert.alert_status?.toLowerCase() || "";
    return (
      <div
        key={alert._id}
        className={`${styles["alert-card"]} ${styles[`alert-card--${alert.alert_type}`] || ""} ${styles[`alert-card--status-${status}`] || ""} ${alert.isNew ? styles["alert-card--new"] : ""}`}
      >
        {alert.isNew && <span className={styles["new-badge"]}>NEW</span>}
        <h3>{alert.alert_name}</h3>
        <p><strong>Details:</strong> {alert.alert_details}</p>
        <p><strong>Status:</strong> <span className={styles["status-pill"]}>{alert.alert_status}</span></p>
        <p><strong>Time:</strong> {new Date(alert.alert_time).toLocaleString()}</p>
      </div>
    );
  };

  return (
    <main className={`${styles["alerts-page"]} wrapper`}>

      {/* Banner shown when new alerts arrive while user is on page 2+ */}
      {newCount > 0 && page !== 1 && (
        <div className={styles["new-banner"]} onClick={() => { setPage(1); setNewCount(0); }}>
          ↑ {newCount} new alert{newCount > 1 ? "s" : ""} — click to go to latest
        </div>
      )}

      <div className={styles["columns"]}>
        {/* Medication Reminders column */}
        {!notNurse && <section className={styles["column"]}>
          <h2 className={styles["column-title"]}>
            <i className="fa-solid fa-pills"></i> Medication Reminders
          </h2>
          {medication.length === 0
            ? <p className={styles["empty"]}>No medication alerts</p>
            : medication.map(renderCard)
          }
        </section>}

        {/* Critical Conditions column */}
        {canSeeCritical && <section className={styles["column"]}>
          <h2 className={styles["column-title"]}>
            <i className="fa-solid fa-triangle-exclamation"></i> Critical Conditions
          </h2>
          {critical.length === 0
            ? <p className={styles["empty"]}>No critical alerts</p>
            : critical.map(renderCard)
          }
        </section>}

        {/* Consultation Alerts column — patients, doctors, and surgeons */}
        {canSeeConsultations && <section className={styles["column"]}>
          <h2 className={styles["column-title"]}>
            <i className="fa-solid fa-stethoscope"></i> Consultation Alerts
          </h2>
          {consultation.length === 0
            ? <p className={styles["empty"]}>No consultation alerts</p>
            : consultation.map(renderCard)
          }
        </section>}
      </div>

      {/* Pagination controls */}
      <div className={styles["pagination"]}>
        <button disabled={page === 1}          onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>

    </main>
  );
}

export default private_routes(AlertPage);