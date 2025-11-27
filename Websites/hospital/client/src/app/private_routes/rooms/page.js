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
import Pagination_Btns from "@/components/Pagination_Btns/Pagination_Btns";

function EmployeesListPage() {
  
  const [rooms , setRooms] = useState([])
  let [isFiltered , setIsFiltered]  = useState(false);
  let [currPage , setCurrPage ] = useState(1);
    let [numOfPages , setNumOfPages] = useState(1);
  const selectBoxsRef= useRef({});
  const sizeOfPage = 5;


  // Refrences

  function handleClearFilterOption(){
    selectsElementsData.forEach((el) => {
      
    if (selectBoxsRef.current[el.name]) {
      
    }
  });

  setIsFiltered(false)

  fetch(`${process.env.APIKEY}/rooms/?pagination=${currPage}&size=${sizeOfPage}`,{
    mode: "cors",
    headers: {
      Authorization: `BEARER ${user_data.token}`,
      "Content-Type": "application/json",
    },
  })
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
  if(isFiltered) return;
  fetch(`${process.env.APIKEY}/rooms/?pagination=${currPage}&size=${sizeOfPage}`,{
    mode: "cors",
    headers: {
      Authorization: `BEARER ${user_data.token}`,
      "Content-Type": "application/json",
    },
  })
  .then(res=>{ 
            statusNotification(res.status)  
            return res.json();})
  .then(data=>{
    if(data.success){
      setRooms(data.rooms)
      setNumOfPages(data.numOfPages || 1);
      userNotification("success", data.message);
    }
    else{
      userNotification("error",data.message)
    }
  })


},[currPage])

function handleFilterOption(e, showNotif = true) {
  e && e.preventDefault();

  const roomValue = selectBoxsRef.current["room_number"]?.value;
  const floorValue = selectBoxsRef.current["floor_id"]?.value;
  const statusValue = selectBoxsRef.current["status"]?.value;
  console.log(roomValue,floorValue,statusValue)

  let endpoint = `${process.env.APIKEY}/rooms`;
  const queryParams = new URLSearchParams();

  // Add pagination parameters
  queryParams.append('pagination', currPage);
  queryParams.append('size', sizeOfPage);

    // For "all" status or no status, use main endpoint with filters
    if (roomValue) queryParams.append('room_number', roomValue);
    if (floorValue) queryParams.append('floor_number', floorValue);
    if(statusValue && statusValue === "empty"){ 
      queryParams.append('isOccupied', 0);
    }
    else if (statusValue && statusValue === "occupied"){
      queryParams.append('isOccupied', 1);
    }
    // For empty/occupied endpoints, still need pagination
    endpoint += `?${queryParams.toString()}`;
  

  fetch(endpoint,{
    mode: "cors",
    headers: {
      Authorization: `BEARER ${user_data.token}`,
      "Content-Type": "application/json",
    },
  })
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

function handleShowAllOccupiedRooms() {
  const endpoint = `${process.env.APIKEY}/rooms/occupied?pagination=${currPage}&size=${sizeOfPage}`;

  fetch(endpoint,{
    mode: "cors",
    headers: {
      Authorization: `BEARER ${user_data.token}`,
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      statusNotification(res.status);
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        setIsFiltered(true);
        setRooms(data.rooms);
        setNumOfPages(data.numOfPages || 1);
        userNotification("success", data.message || "Showing all occupied rooms");
      } else {
        userNotification("error", data.message);
      }
    })
    .catch(() => userNotification("error", "Failed to fetch occupied rooms"));
}

function handleShowAllEmptyRooms() {
  const endpoint = `${process.env.APIKEY}/rooms/empty?pagination=${currPage}&size=${sizeOfPage}`;

  fetch(endpoint,{
    mode: "cors",
    headers: {
      Authorization: `BEARER ${user_data.token}`,
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      statusNotification(res.status);
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        setIsFiltered(true);
        setRooms(data.rooms);
        setNumOfPages(data.numOfPages || 1);
        userNotification("success", data.message || "Showing all empty rooms");
      } else {
        userNotification("error", data.message);
      }
    })
    .catch(() => userNotification("error", "Failed to fetch empty rooms"));
}



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
      <SearchOptions 
          target={"rooms"}
          references ={{  selectBoxsRef , handleFilterOption}}
          clearBtn = {handleClearFilterOption} 
          handleFilterOption={handleFilterOption} 
          other_btns_actions ={{ handleShowAllEmptyRooms , handleShowAllOccupiedRooms}}
          setCurrPage={setCurrPage} 
          currPage={currPage} 
          sizeOfPage={sizeOfPage} 
          setIsFiltered= {setIsFiltered} 
          selectsElementsData={selectsElementsData}
          />
      <Suspense fallback={<LoaderForComponents  styling={styles.loader_for_components_wrapper}/>}>
      <div className={styles["wrapper"]}>
        
        { rooms && rooms.length > 0 ? rooms.map(room => (
          <RoomCard key={room.room_id} room={room} />
        )) : <></>}
      </div>
      </Suspense>

      <div className={styles.table_btn_wrapper}>
        <Pagination_Btns handlePagination={handlePagination} currPage={currPage} numOfPages={numOfPages} />
      </div>
    </main>
  );
}

export default  private_routes(EmployeesListPage)