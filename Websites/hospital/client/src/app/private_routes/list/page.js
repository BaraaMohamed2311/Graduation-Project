"use client";
import { useRouter } from "next/navigation";
import styles from "./listpage.module.css";
import private_routes from "../page";

function ListPage() {
  const router = useRouter();

  function goToAllPatients() {
    router.push("/private_routes/patients-list");
  }

  function goToMyPatients() {
    router.push("/private_routes/mypatients-list");
  }

  return (
    <main className={`${styles["list-page"]} wrapper`}>
      <h1 className={styles["title"]}>Patients Management</h1>

      <div className={styles["cards-container"]}>
        <div
          className={styles["nav-card"]}
          onClick={goToAllPatients}
        >
          <h2>All Patients</h2>
          <p>View and manage all hospital patients</p>
        </div>

        <div
          className={styles["nav-card"]}
          onClick={goToMyPatients}
        >
          <h2>My Patients</h2>
          <p>See only patients assigned to you</p>
        </div>
      </div>
    </main>
  );
}

export default private_routes(ListPage);
