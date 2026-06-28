"use client";
import { useRouter } from "next/navigation";
import styles from "./listpage.module.css";
import private_routes from "../page";
import { useUserDataContext } from "@/contexts/user_data";
function ListPage() {
  const router = useRouter();
  const {user_data} = useUserDataContext();
  const Access = user_data?.emp_title?.toLowerCase() == "manager" || user_data?.emp_title?.toLowerCase() == "nurse"

  return (
    <main className={`${styles["list-page"]} wrapper`}>
      <h1 className={styles["title"]}>
        Patients Management
      </h1>

      <div className={styles["cards-container"]}>
        {Access && <div
          className={styles["nav-card"]}
          onClick={() => router.push("/private_routes/patients-list")}
        >
          <i className={`fa-solid fa-users ${styles["card-icon"]}`}></i>
          <h2>All Patients</h2>
          <p>View and manage all hospital patients</p>
        </div>}

        <div
          className={styles["nav-card"]}
          onClick={() => router.push("/private_routes/mypatients-list")}
        >
          <i className={`fa-solid fa-user-doctor ${styles["card-icon"]}`}></i>
          <h2>My Patients</h2>
          <p>See only patients assigned to you</p>
        </div>
      </div>
    </main>
  );
}

export default private_routes(ListPage);
