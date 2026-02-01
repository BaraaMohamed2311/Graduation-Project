"use client"
import private_routes from "../page";
import { Suspense , lazy ,useState , useRef , useEffect} from "react";
import styles from "./booksschedule.module.css"
import { useUserDataContext } from "@/contexts/user_data";
import ConsultationCard from "@/components/ConsultationCard/ConsultationCard";
import statusNotification from "@/utils/statusNotification";
import userNotification from "@/utils/userNotification";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import Pagination_Btns from "@/components/Pagination_Btns/Pagination_Btns";
import { useRouter } from "next/navigation";
import {select_def} from "./data"
import stringifyFields from "@/utils/stringifyFields";

function BooksSchedulePage() {
  let [isFiltered , setIsFiltered]  = useState(false);
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  let [ consultations, setConsultations] = useState([])
  const {user_data} = useUserDataContext();
  const router = useRouter()

   // Refrences
  const selectBoxsRef= useRef({});

  const sizeOfPage = 12;


// =========================
//    Initial Fetch
// =========================

  useEffect(() => {

    if(isFiltered) return;
    fetch(`${process.env.APIKEY}/booking/get-all-consultations?user_id=${user_data.user_id}&user_email=${user_data.user_email}&pagination=${currPage}&size=${sizeOfPage}`, {
      mode: "cors",
      headers: {
        Authorization: `BEARER ${user_data.token}`,
        "Content-Type": "application/json",
      },
    }).then(res=>{
      statusNotification(res.status)
      return res.json();
    })
    .then(data=>{
      if(data.success){
        setConsultations(data.body);
        setNumOfPages(data.numOfPages || 1)
      }
      userNotification(data.success ? "success":"error",data.message)
    })
    .catch(err=>{
      userNotification("error","Error fetching your schedule")
    })
  }, [currPage , isFiltered]);

  
  
  

  function handleViewConsultation(consultation_id){
    router.push(`/private_routes/consultation-details/${user_data.user_id}/${consultation_id}?currPage=${currPage}`)
  }

// =========================
//    handleClearFilterOption
// =========================

  function handleClearFilterOption(){
    const ConType_REF = selectBoxsRef.current["consultation_type"];
    const ConStat_REF = selectBoxsRef.current["consultation_status"];
    const ConDate_REF = selectBoxsRef.current["consultation_date"];

    setIsFiltered(false) // set to false to render cached employees with no filters
    setConsultations([]); //to remove all
    setCurrPage(1);

    // reset select filters back to no filter
    ConType_REF.value = "";
    ConStat_REF.value = "";
    ConDate_REF.value = "";

}


// =========================
//    handleFilterOption
// =========================

function handleFilterOption(e, showNotif = true) {
  e && e.preventDefault();

  const consultation_type = selectBoxsRef.current["consultation_type"]?.value;
  const consultation_status = selectBoxsRef.current["consultation_status"]?.value;
  const consultation_date = selectBoxsRef.current["consultation_date"]?.value;
  let filterEntries = {consultation_type,consultation_status}
  if (consultation_date) filterEntries["orderBy_consultation_date"] = consultation_date;
  console.log(filterEntries);

  // we use stringifyFields function to exclude null values and do not add as query also join them
    const filter_queries = stringifyFields("anded",Object.entries(filterEntries))
console.log("filter_queries",filter_queries)
  let endpoint = `${process.env.APIKEY}/booking/get-all-consultations?user_id=${user_data.user_id}&user_email=${user_data.user_email}&pagination=${currPage}&size=${sizeOfPage}&${filter_queries}`;
 

  fetch(endpoint, {
      mode: "cors",
      headers: {
        Authorization: `BEARER ${user_data.token}`,
        "Content-Type": "application/json",
      }})
    .then((res) => {
      statusNotification(res.status);
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        setIsFiltered(true);
        setConsultations(data.body);
        setNumOfPages(data.numOfPages || 1);
        if (showNotif) {
          userNotification("success", data.message || "Filters applied successfully");
        }
      } else {
        if (showNotif) {
          userNotification("error", data.message);
        }
      }
    })
    .catch((err) => {
      if (showNotif) {
        userNotification("error", "Failed to fetch filtered consultations schedule");
      }
      console.log("err",err)
    });
}

// =========================
//    handlePagination
// =========================

function handlePagination(e){
    if(e.target.id === 'prev'){
      if(currPage > 1)
        setCurrPage(prev => prev - 1);
    }
    else if(e.target.id === 'next'){
      setCurrPage(prev => prev + 1);
    }
  }

  
  return (
    <main className={`${styles["list"]} wrapper`}>
      <h1>Your Appointments</h1>
      <SearchOptions 
        references={{selectBoxsRef}}
        isFiltered={isFiltered}
        clearBtn = {handleClearFilterOption} 
        handleFilterOption={handleFilterOption} 
        setCurrPage={setCurrPage} 
        currPage={currPage} 
        sizeOfPage={sizeOfPage}
        fieldDefinitions={{select_def}}
      />
      <div className={styles["consultation_cards_wrapper"]}>
        {(!consultations || consultations.length == 0) && <p>No Consultations Scheduled</p> }
        {consultations && consultations.length > 0 && consultations.map((consultation_data)=>{
          return (
            <ConsultationCard 
            handleViewConsultation={handleViewConsultation}
            consultation_data={consultation_data}
            setConsultations={setConsultations}
        />
          )
        })}
      </div>
      
      <div className={styles.table_btn_wrapper}>
        <Pagination_Btns handlePagination={handlePagination} currPage={currPage} numOfPages={numOfPages} />
      </div>
    </main>
  );
}

export default  private_routes(BooksSchedulePage)