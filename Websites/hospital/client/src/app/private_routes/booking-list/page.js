"use client";
import { useRouter } from "next/navigation";
import styles from "./bookinglistpage.module.css";
import private_routes from "../page";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import BookingCard from "@/components/BookingCard/BookingCard";
import { select_def} from "./data"
import { useRef ,useState,useEffect} from "react";
import { useUserDataContext } from "@/contexts/user_data";
import { useBookingListCache } from "@/hooks/useBookingListCache";
import userNotification from "@/utils/userNotification";
import stringifyFields from "@/utils/stringifyFields";
import statusNotification from "@/utils/statusNotification";
import Pagination_Btns from "@/components/Pagination_Btns/Pagination_Btns";
import {getLastSync , setLastSync} from "@/utils/get_set_lastSync"

function BookingListPage() {

  // for filtering
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  // The “default booking type” / what the user is currently browsing
  const [selectedBookingType, setSelectedBookingType] = useState("doctors");
  // The endpoint actually used for fetch (updated only after confirmed)
  const [activeBookingType, setActiveBookingType] = useState("doctors");

  const [filterTrigger, setFilterTrigger] = useState(0);
    const [needsSync, setNeedsSync] = useState(false);
  const {user_data} = useUserDataContext();
  const {cached_booking_list, setCached_Booking_List,fetched_booking_pages, setFetched_Booking_Pages,saveSpecificToStore,isIndexedDBLoaded, checkPageSync} = useBookingListCache();
   // Refrences
  const inputsBoxsRef= useRef({});
  const selectBoxsRef= useRef({});
  const router = useRouter()
  const sizeOfPage = 12;

  // ===========================================
//         Sync Pages
// ===========================================
useEffect(() => {
  (async () => {
    const since = getLastSync(`booking-${selectedBookingType}`)
    const needsSyncObj = await checkPageSync(since)
    setNeedsSync(needsSyncObj?.needsSync);
    setLastSync(`booking-${selectedBookingType}`,needsSyncObj.latest_version);
  })();
}, [currPage]);
// ===========================================
//         Fetch
// ===========================================
useEffect(() => {
  if (!isIndexedDBLoaded) return;

  let endpoint = selectedBookingType; // default
  const filterEntries = {};

  if (isFiltered) {
    const titleRef = selectBoxsRef.current["emp_title"];
    const initialPriceRef = selectBoxsRef.current["initial_consultation_price"];
    const surgeryPriceRef = selectBoxsRef.current["surgery_price"];
    const yearsExpRef = selectBoxsRef.current["years_of_exp"];

    const emp_title = titleRef?.value || null;
    const initial_consultation_price = initialPriceRef?.value || null;
    const surgery_price = surgeryPriceRef?.value || null;
    const years_of_exp = yearsExpRef?.value || null;

    if (emp_title) {
      endpoint = emp_title.toLowerCase();
      setSelectedBookingType(emp_title.toLowerCase());
    }

    if (initial_consultation_price) filterEntries["orderBy_initial_consultation_price"] = initial_consultation_price;
    if (surgery_price) filterEntries["orderBy_surgery_price"] = surgery_price;
    if (years_of_exp) filterEntries["orderBy_years_of_exp"] = years_of_exp;
  }

  const pageFetched = fetched_booking_pages[endpoint]?.has(currPage);
const shouldSkipFetch = pageFetched && !isFiltered && !needsSync;

if (shouldSkipFetch) return;


  const queryString = stringifyFields("anded", Object.entries(filterEntries));

  fetch(`${process.env.APIKEY}/list/${endpoint}?pagination=${currPage}&size=${sizeOfPage}&${queryString}`, {
    mode: "cors",
    headers: {
      Authorization: `BEARER ${user_data.token}`,
      "Content-Type": "application/json",
    },
  })
    .then(res => {
      statusNotification(res.status);
      return res.json();
    })
    .then(data => {
      if (!data?.success) return userNotification("error", data.message || "Fetch failed");

      // Update cache
      
      setCached_Booking_List(prev => ({ ...prev, [endpoint]: data.body }));
      setNumOfPages(data.numOfPages || 1);
      setFetched_Booking_Pages(prev => {
        const currentPages = prev[endpoint] || new Set();
        return { ...prev, [endpoint]: new Set([...currentPages, currPage]) };
      });
      saveSpecificToStore(data.body, endpoint);
    })
    .catch(() => userNotification("error", "Network error"));

}, [currPage, isFiltered, selectedBookingType, isIndexedDBLoaded, filterTrigger,needsSync]);




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
    const Title_REF = selectBoxsRef.current["emp_title"];
    const initial_consultation_price_REF = selectBoxsRef.current["initial_consultation_price"];
    const Surgery_price_REF = selectBoxsRef.current["surgery_price"];
    const Years_Of_Exp_REF = selectBoxsRef.current["years_of_exp"];


    setIsFiltered(false) // set to false to render cached employees with no filters
    setFilteredResults([]); //to remove all
    setCurrPage(1);

    // reset select filters back to no filter
    Title_REF.value = ""
    initial_consultation_price_REF.value = ""
    Surgery_price_REF.value = ""
    Years_Of_Exp_REF.value = ""
}

// ===========================================
//        Filter Data
// ===========================================

// 1. This Function Checks Inputs Then Update isFiltered state
function handleFilterOption(e){
    if(e) e.preventDefault();
    // get filter inputs 
    const Title_REF = selectBoxsRef.current["emp_title"];
    const initial_consultation_price_REF = selectBoxsRef.current["initial_consultation_price"];
    const Surgery_price_REF = selectBoxsRef.current["surgery_price"];
    const Years_Of_Exp_REF = selectBoxsRef.current["years_of_exp"];

    
    const emp_title = Title_REF.value === "" ? null : Title_REF.value;
    const initial_consultation_price = initial_consultation_price_REF.value === "" ? null : initial_consultation_price_REF.value;
    const surgery_price = Surgery_price_REF.value === "" ? null : Surgery_price_REF.value;
    const years_of_exp = Years_Of_Exp_REF.value === "" ? null : Years_Of_Exp_REF.value;


    // making sure this checking is applied when only pressing btn 
    if(!emp_title && !initial_consultation_price&& !surgery_price && !years_of_exp){
        userNotification("error","No Filters Entered");
        handleClearFilterOption(); // resets if no filtering specified
        return; 
    }


    // save filters for useEffect to pick up
  setIsFiltered(true);
  setFilterTrigger(prev => prev + 1);
  

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
                target={"users"}
                isFiltered={isFiltered}
                references ={{ inputsBoxsRef: inputsBoxsRef ,selectBoxsRef: selectBoxsRef}}
                clearBtn = {handleClearFilterOption} 
                handleFilterOption={handleFilterOption} 
                setCurrPage={setCurrPage} 
                currPage={currPage} 
                sizeOfPage={sizeOfPage} 
                setFilteredResults={setFilteredResults} 
                fieldDefinitions={{select_def}}
          />
            <div className={styles["booking-card-wrapper"]}>
              {cached_booking_list && Object.keys(cached_booking_list).length > 0 && cached_booking_list[selectedBookingType]  && cached_booking_list[selectedBookingType].slice((currPage - 1) * sizeOfPage, currPage * sizeOfPage).map((booking , index)=>{
                return <BookingCard 
                key={booking._id || booking.user_email}
                userType={selectedBookingType} 
                bookingData={booking} 
                handleBookBtn={handleBookBtn}
                userToken={user_data.token}
                />
            })}
            </div>
            

            <div className={styles.table_btn_wrapper}>
              <Pagination_Btns handlePagination={handlePagination} currPage={currPage} numOfPages={numOfPages} />
            </div>
        </main>
    )
}


export default private_routes(BookingListPage)