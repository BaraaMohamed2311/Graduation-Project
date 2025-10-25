"use client"
import private_routes from "../page";
import { Suspense , lazy ,useState , useRef, useEffect} from "react";
import LoaderForComponents from "@/components/LoaderForComponents/LoaderForComponents";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import styles from "./list.module.css"
import {selectsElementsData} from "./data";
import userNotification from "@/utils/userNotification";
import statusNotification from "@/utils/statusNotification";
import RoomCard from "@/components/RoomCard/RoomCard";


function EmployeesListPage() {
  
  const [rooms , setRooms] = useState([])
  let [isFiltered , setIsFiltered]  = useState(false);
  let [currPage , setCurrPage ] = useState(1);
  const selectBoxsRef= useRef({});
  const sizeOfPage = 5;


  // Refrences
  

  function handleClearFilterOption(){
    Object.keys(selectBoxsRef.current).forEach((key) => {
    const selectEl = selectBoxsRef.current[key];
    if (selectEl) {
      selectEl.value = "all"; // or "" depending on how you represent "no filter"
    }
  });

  setIsFiltered(false)

  fetch(`${process.env.APIKEY}/rooms/?pagination=${currPage}&size=${sizeOfPage}`)
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



useEffect(()=>{

  fetch(`${process.env.APIKEY}/rooms/?pagination=${currPage}&size=${sizeOfPage}`)
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


},[])

function handleFilterOption(e, showNotif = true) {
  e && e.preventDefault();

  const roomValue = selectBoxsRef.current["room_number"]?.value;
  const floorValue = selectBoxsRef.current["floor_id"]?.value;
  const statusValue = selectBoxsRef.current["status"]?.value;

  let endpoint = `${process.env.APIKEY}/rooms`;

  // Handle button clicks first
  if (statusValue && statusValue.toLowerCase() === "empty") {
    endpoint += "/empty";
  } else if (statusValue && statusValue.toLowerCase() === "occupied") {
    endpoint += "/occupied";
  } else if (floorValue && floorValue !== "all") {
    endpoint += `/floor/floor_number/${floorValue}`;
  } else if (roomValue && roomValue !== "all") {
    endpoint += `/room/room_number/${roomValue}`;
  } 


  if (statusValue && statusValue !== "all"){
    endpoint += `?pagination=${currPage}&size=${sizeOfPage}&status=${statusValue}`;
  }

  else if (currPage > 0 && sizeOfPage > 0) {
    endpoint += `?pagination=${currPage}&size=${sizeOfPage}`;
  }

  fetch(endpoint)
    .then((res) => {
      statusNotification(res.status);
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        setIsFiltered();
        setRooms(data.rooms);
        showNotif && userNotification("success", "Rooms fetched successfully");
      } else {
        userNotification("error", data.message);
      }
    })
    .catch(() => userNotification("error", "Failed to fetch filtered rooms"));
}



  
  return (
    <main className={`${styles["list"]} wrapper`}>
      <SearchOptions 
          target={"rooms"}
          references ={{  selectBoxsRef , handleFilterOption}}
          clearBtn = {handleClearFilterOption} 
          handleFilterOption={handleFilterOption} 
          setCurrPage={setCurrPage} 
          currPage={currPage} 
          sizeOfPage={sizeOfPage} 
          setIsFiltered= {setIsFiltered} 
          selectsElementsData={selectsElementsData}/>
      <Suspense fallback={<LoaderForComponents  styling={styles.loader_for_components_wrapper}/>}>
      <div className={styles["wrapper"]}>
        
        { rooms && rooms.length > 0 ? rooms.map(room => (
          <RoomCard key={room.room_id} room={room} />
        )) : <></>}
      </div>
      </Suspense>
    </main>
  );
}

export default  private_routes(EmployeesListPage)