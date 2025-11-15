"use client";
import { useRouter } from "next/navigation";
import styles from "./bookinglistpage.module.css";
import private_routes from "../page";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import BookingCard from "@/components/BookingCard/BookingCard";
import { selectsElementsData} from "./data"
import { useRef ,useState,useEffect} from "react";
import { useUserDataContext } from "@/contexts/user_data";
import userNotification from "@/utils/userNotification";
import stringifyFields from "@/utils/stringifyFields";
import statusNotification from "@/utils/statusNotification";

function BookingListPage() {

  // for filtering
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  let [targetedBooking , setTargetedBooking] = useState("doctors"); // default is booking a doctor appointment
  const [filterTrigger, setFilterTrigger] = useState(0);
  const {user_data} = useUserDataContext();
  const {cached_booking_list, setCached_Booking_List,fetched_booking_pages, setFetched_Booking_Pages} = useCachedBookingListContext();
   // Refrences
  const inputsBoxsRef= useRef({});
  const selectBoxsRef= useRef({});
  const router = useRouter()
  const sizeOfPage = 12;


// ===========================================
//        Initial Fetch
// ===========================================
useEffect(() => {
  console.log("isFiltered",isFiltered)
  if (isFiltered) return;
  // This needs to be changed
  if (!false) {
    fetch(`${process.env.APIKEY}/list/${targetedBooking}`, {
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
                    setFetched_Patient_Pages(prev => {
                    const updated = new Set(prev);
                    updated.add(currPage);
                    return updated;
                  });
                    appendToIndexDB(`booking-${targetedBooking}`, data.body).then(() => {
                            console.log(`Successfully appended new booking-${targetedBooking} to IndexDB`);
                           }) 
                           .catch((err) => {
                            console.error(`Failed to append new booking-${targetedBooking} to IndexDB:`, err);
                          });
        } else if (data && !data.success) {
          userNotification("error", data.message);
        }
      });
  } 

  
}, [currPage]);



// ===========================================
//        Table Buttons
// ===========================================

    function handleBookBtn(employee){

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


    return (
        <div>
            <SearchOptions 
                target={"patients"}
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
            
            {cached_booking_list && Object.keys(cached_booking_list).length > 0 && cached_booking_list[targetedBooking].map((booking , index)=>{
                return <BookingCard 
                userType={targetedBooking} 
                bookingData={booking} 
                handleBookBtn={handleBookBtn}
                />
            })}

            
        </div>
    )
}


export default private_routes(BookingListPage)