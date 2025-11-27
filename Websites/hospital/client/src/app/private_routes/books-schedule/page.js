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

function BooksSchedulePage() {
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  let [ consultations, setConsultations] = useState([])
  const [filterTrigger, setFilterTrigger] = useState(0);
  const {user_data} = useUserDataContext();

   // Refrences
  const inputsBoxsRef= useRef({});
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
  }, [currPage]);

  
  
  

  

// =========================
//    handleClearFilterOption
// =========================

  function handleClearFilterOption(){
    selectsElementsData.forEach((el) => {
      
    if (selectBoxsRef.current[el.name]) {
      
    }
  });

  setIsFiltered(false)

  fetch(`${process.env.APIKEY}/  /?pagination=${currPage}&size=${sizeOfPage}`)
  .then(res=>{ 
            statusNotification(res.status)  
            return res.json();})
  .then(data=>{
    if(data.success){
      setRooms(data.rooms)
    }
    else{
      userNotification("error",data.message)
    }
  })
}


// =========================
//    handleFilterOption
// =========================

function handleFilterOption(e, showNotif = true) {
  e && e.preventDefault();

  const roomValue = selectBoxsRef.current["room_number"]?.value;
  const floorValue = selectBoxsRef.current["floor_id"]?.value;
  const statusValue = selectBoxsRef.current["status"]?.value;
  console.log(roomValue,floorValue,statusValue)

  let endpoint = `${process.env.APIKEY}/`;
 

  fetch(endpoint)
    .then((res) => {
      statusNotification(res.status);
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        setIsFiltered(true);
        setRooms(data.rooms);
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
    .catch(() => {
      if (showNotif) {
        userNotification("error", "Failed to fetch filtered rooms");
      }
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
      <SearchOptions />
      {(!consultations || consultations.length == 0) && <p>No Consultations Scheduled</p> }
      {consultations && consultations.length > 0 && consultations.map((consultation_data)=>{
        return (
          <ConsultationCard 
          consultation_data={consultation_data}
      />
        )
      })}
      
      <div className={styles.table_btn_wrapper}>
        <Pagination_Btns handlePagination={handlePagination} currPage={currPage} numOfPages={numOfPages} />
      </div>
    </main>
  );
}

export default  private_routes(BooksSchedulePage)