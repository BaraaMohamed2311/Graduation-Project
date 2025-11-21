"use client"
import private_routes from "../page";
import { Suspense , lazy ,useState , useRef , useEffect} from "react";
import styles from "./booksschedule.module.css"
import { useUserDataContext } from "@/contexts/user_data";

function BooksSchedulePage() {
  
  const {user_data} = useUserDataContext()
  useEffect(() => {
    fetch(`${process.env.APIKEY}/booking/get-all-appointments?user_id=${user_data.user_id}&user_email=${user_data.user_email}`, {
      mode: "cors",
    })
  }, []);
  
  return (
    <main className={`${styles["list"]} wrapper`}>
      <h1>Employees Schedule</h1>
    </main>
  );
}

export default  private_routes(BooksSchedulePage)