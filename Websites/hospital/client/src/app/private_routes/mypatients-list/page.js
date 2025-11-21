"use client"
import private_routes from "../page";
import { Suspense , lazy ,useState , useRef , useEffect} from "react";
import LoaderForComponents from "@/components/LoaderForComponents/LoaderForComponents";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import styles from "./list.module.css"
import {selectsElementsData , inputs_info} from "./data";
import userNotification from "@/utils/userNotification";
import stringifyFields from "@/utils/stringifyFields";
import statusNotification from "@/utils/statusNotification";
import { useUserDataContext } from "@/contexts/user_data";
import {useMyPatientsCache} from "@/hooks/useMyPatientsCache"
import BasicTable from '@/components/BasicTable/BasicTable';
import { useRouter } from "next/navigation";
import { appendToIndexDB } from "@/utils/indexDB/appendToIndexDB";

function MyPatientsListPage() {
  

  // for filtering
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  const [filterTrigger, setFilterTrigger] = useState(0);
  const {user_data} = useUserDataContext();
  let {cached_my_patients, setCached_My_Patients , fetched_my_patient_pages, setFetched_My_Patient_Pages,saveMyPatientsToStore , isIndexedDBLoaded} = useMyPatientsCache();
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
  if(!isIndexedDBLoaded) return; // wait till indexedDB is loaded to avoid overwriting cached data
  console.log("fetched_my_patient_pages",fetched_my_patient_pages)
  if (!fetched_my_patient_pages.has(currPage)) {
    fetch(`${process.env.APIKEY}/list/my-patients?user_id=${user_data.user_id}&pagination=${currPage}&size=${sizeOfPage}`, {
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
          console.log("success")
          setNumOfPages(data.numOfPages || 1);
          setCached_My_Patients((prev) => [...prev, ...data.body]);
          setFetched_My_Patient_Pages(prev => {
          const updated = new Set(prev);
          updated.add(currPage);
          return updated;
        });
        // Append new my-patients to IndexedDB
      try {
          // save to indexedDB
            saveMyPatientsToStore(data.body);
                
      } catch (error) {
            console.error("Failed to append IndexDB:", error);
            }
        
        } else if (data && !data.success) {
          userNotification("error", data.message);
        }
      });

  } 

  
}, [currPage,isIndexedDBLoaded]);


useEffect(()=>{console.log("fetched_my_patient_pages",fetched_my_patient_pages)},[fetched_my_patient_pages])

// ===========================================
//        Table Buttons
// ===========================================

    function handleVisitBtn(mypatient){
      console.log("Visiting mypatient",mypatient)
      router.replace(`/private_routes/mypatient/${mypatient.user_id}?currPage=${currPage}`)
    }


  


// ===========================================
//        Clear Filters
// ===========================================
  function handleClearFilterOption(){
    const EMAIL_REF = inputsBoxsRef.current["Email"];
    const ByPhoneREF = inputsBoxsRef.current["Phone"];

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
    const EMAIL_REF = inputsBoxsRef.current["Email"];
    const Phone_REF = inputsBoxsRef.current["Phone"];

    
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

    const EMAIL_REF = inputsBoxsRef.current["Email"];
    const Phone_REF = inputsBoxsRef.current["Phone"];

    
    const patient_email = EMAIL_REF.value === "" ? null : EMAIL_REF.value;
    const patient_phone = Phone_REF.value === "" ? null : Phone_REF.value;

  const filter_queries = stringifyFields(
    "anded",
    Object.entries({ patient_email, patient_phone })
  );

  fetch(`${process.env.APIKEY}/list/my-patients?user_id=${user_data.user_id}&${filter_queries}&pagination=${currPage}&size=${sizeOfPage}`, {
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
    <main className={`${styles["list"]} wrapper`}>
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
          inputs_info={inputs_info}
          />
      <Suspense fallback={<LoaderForComponents  styling={styles.loader_for_components_wrapper}/>}>
        <BasicTable 
          currPage={currPage} 
          sizeOfPage={sizeOfPage}
          setCurrPage={setCurrPage} 
          data={cached_my_patients} 
          isFiltered={isFiltered} 
          filteredResults={filteredResults} 
          handleActionBtn={handleVisitBtn}   
          numOfPages={numOfPages} 
          tableType="patients"
        />
      </Suspense>
    </main>
  );
}

export default  private_routes(MyPatientsListPage)