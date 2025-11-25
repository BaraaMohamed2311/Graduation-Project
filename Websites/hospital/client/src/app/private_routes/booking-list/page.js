"use client";
import { useRouter } from "next/navigation";
import styles from "./bookinglistpage.module.css";
import private_routes from "../page";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import BookingCard from "@/components/BookingCard/BookingCard";
import { selectsElementsData} from "./data"
import { useRef ,useState,useEffect} from "react";
import { useUserDataContext } from "@/contexts/user_data";
import { useBookingListCache } from "@/hooks/useBookingListCache";
import userNotification from "@/utils/userNotification";
import stringifyFields from "@/utils/stringifyFields";
import statusNotification from "@/utils/statusNotification";
import Pagination_Btns from "@/components/Pagination_Btns/Pagination_Btns";

function BookingListPage() {

  // for filtering
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  let [targetedBooking , setTargetedBooking] = useState("doctors"); // default is booking a doctor appointment
  const [filterTrigger, setFilterTrigger] = useState(0);
  const {user_data} = useUserDataContext();
  const {cached_booking_list, setCached_Booking_List,fetched_booking_pages, setFetched_Booking_Pages,saveSpecificToStore,isIndexedDBLoaded} = useBookingListCache();
   // Refrences
  const inputsBoxsRef= useRef({});
  const selectBoxsRef= useRef({});
  const router = useRouter()
  const sizeOfPage = 12;


// ===========================================
//        Initial Fetch
// ===========================================
useEffect(() => {

  if (isFiltered) return;
  if(!isIndexedDBLoaded) return; // wait till indexedDB is loaded to avoid overwriting cached data
  // Check if we already fetched this page for this target to avoid refetching
  console.log("fetched_booking_pages",fetched_booking_pages , !fetched_booking_pages[targetedBooking]?.has(currPage))
  if (!(fetched_booking_pages[targetedBooking]?.has(currPage))) {
    fetch(`${process.env.APIKEY}/list/${targetedBooking}?pagination=${currPage}&size=${sizeOfPage}`, {
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
        if (data?.success) {
          setCached_Booking_List((prev) => {
            const updated = { ...prev };
            updated[targetedBooking] = data.body;
            return updated;
          });
          setNumOfPages(data.numOfPages || 1);
          setFetched_Booking_Pages(prev => {
            const currentPages = prev[targetedBooking] || new Set();
            const updatedPages = new Set([...currentPages, currPage]);
            
            return {
              ...prev,
              [targetedBooking]: updatedPages
            };
          });
          // save to indexedDB
          console.log("Saving specific to store" , data.body,targetedBooking)
          saveSpecificToStore(data.body,targetedBooking)

        } else if (data && !data.success) {
          userNotification("error", data.message);
        }
      });
  
    } 

  
}, [currPage,isIndexedDBLoaded]);



// ===========================================
//        Table Buttons
// ===========================================

    function handleBookBtn(employee){
      router.push(`/private_routes/book-consultation/${employee.user_id}`);
    }


  


// ===========================================
//        Clear Filters
// ===========================================
  function handleClearFilterOption(){
    const EMAIL_REF = inputsBoxsRef.current[""];
    const ByPhoneREF = inputsBoxsRef.current[""];

    setIsFiltered(false) // set to false to render cached employees with no filters
    setFilteredResults([]); //to remove all
    setCurrPage(1);

    // reset select filters back to no filter
    EMAIL_REF.value = ""
    ByPhoneREF.value = ""
}

// ===========================================
//        Filter Data
// ===========================================

// 1. This Function Checks Inputs Then Update isFiltered state
function handleFilterOption(e){
    if(e) e.preventDefault();
    // get filter inputs 
    const EMAIL_REF = inputsBoxsRef.current[""];
    const Phone_REF = inputsBoxsRef.current[""];

    
    const patient_email = EMAIL_REF.value === "" ? null : EMAIL_REF.value;
    const patient_phone = Phone_REF.value === "" ? null : Phone_REF.value;


    // making sure this checking is applied when only pressing btn 
    if(!patient_email && !patient_phone && isFiltered){
        userNotification("error","No Filters Entered");
        handleClearFilterOption(); // resets if no filtering specified
        return; 
    }


    // save filters for useEffect to pick up
  setIsFiltered(true);
  setFilterTrigger(prev => prev + 1)

}

// 2. Then this useEffect gets triggered on isFiltered and currPage to fetch new filtered data
useEffect(() => {
  if (!isFiltered) return;

    const EMAIL_REF = inputsBoxsRef.current[""];
    const Phone_REF = inputsBoxsRef.current[""];

    
    const patient_email = EMAIL_REF.value === "" ? null : EMAIL_REF.value;
    const patient_phone = Phone_REF.value === "" ? null : Phone_REF.value;

  const filter_queries = stringifyFields(
    "anded",
    Object.entries({ patient_email, patient_phone })
  );

  fetch(`${process.env.APIKEY}/list/`, {
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
      if (data?.success) {
        setFilteredResults(data.body);
        setNumOfPages(data.numOfPages || 1);
      } else {
        userNotification("error", data.message);
      }
    })
    .catch(() => userNotification("error", "Network error"));
}, [currPage, isFiltered,filterTrigger]);


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
        <div>
            <SearchOptions 
                target={"users"}
                isFiltered={isFiltered}
                references ={{ inputsBoxsRef: inputsBoxsRef ,selectBoxsRef: selectBoxsRef}}
                clearBtn = {handleClearFilterOption} 
                handleFilterOption={handleFilterOption} 
                setCurrPage={setCurrPage} 
                currPage={currPage} 
                sizeOfPage={sizeOfPage} 
                setFilteredResults={setFilteredResults} 
                selectsElementsData={selectsElementsData}

          />
            <div className={styles["booking-card-wrapper"]}>
              {cached_booking_list && Object.keys(cached_booking_list).length > 0 && cached_booking_list[targetedBooking]  && cached_booking_list[targetedBooking].slice((currPage - 1) * sizeOfPage, currPage * sizeOfPage).map((booking , index)=>{
                return <BookingCard 
                key={booking._id || index}
                userType={targetedBooking} 
                bookingData={booking} 
                handleBookBtn={handleBookBtn}
                />
            })}
            </div>
            

            <div className={styles.table_btn_wrapper}>
              <Pagination_Btns handlePagination={handlePagination} currPage={currPage} numOfPages={numOfPages} />
            </div>
        </div>
    )
}


export default private_routes(BookingListPage)