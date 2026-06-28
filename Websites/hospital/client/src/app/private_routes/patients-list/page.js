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
import {usePatientsCache} from "@/hooks/usePatientsCache"
import BasicTable from '@/components/BasicTable/BasicTable';
import { useRouter } from "next/navigation";
import { appendToIndexDB } from "@/utils/indexDB/appendToIndexDB";
import { getLastSync, setLastSync } from "@/utils/get_set_lastSync";


function PatientsListPage() {
  

  // for filtering
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  let [needsSync , setNeedsSync] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState(0);
  const {user_data} = useUserDataContext();
  let {cached_patients , setCached_Patients , fetched_patient_pages, setFetched_Patient_Pages , savePatientsToStore,isIndexedDBLoaded , checkPageSync} = usePatientsCache();
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
    const max_version = getLastSync("patients");
    const needsSyncObj = await checkPageSync(max_version)
    setNeedsSync(needsSyncObj?.needsSync);
    if(max_version <  needsSyncObj.latest_version)
    setLastSync("employees",needsSyncObj.latest_version);
  })();
}, [currPage]);

// ===========================================
//         Fetch Pages
// ===========================================
useEffect(() => {

  if (isFiltered) return;
  if(!isIndexedDBLoaded) return; // wait till indexedDB is loaded to avoid overwriting cached data

  if (!fetched_patient_pages.has(currPage) || needsSync) {

    fetch(`${process.env.APIKEY}/list/patients?user_id=${user_data.user_id}&pagination=${currPage}&size=${sizeOfPage}`, {
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

          setNumOfPages(data.numOfPages || 1);
          // ─── FILTER CURRENT USER FROM THE INCOMING BATCH ───
          const filteredBatch = data.body.filter(emp => emp.user_id !== user_data.user_id);

          setCached_Patients((prev) => {
            const map = new Map(prev.map((emp) => [emp.user_id, emp])); 
              filteredBatch.forEach((emp) => {
                map.set(emp.user_id, emp); // replaces existing or inserts new
              });
              return Array.from(map.values());
          });
          setFetched_Patient_Pages(prev => {
          const updated = new Set(prev);
          updated.add(currPage);
          return updated;
        });
        // save to indexedDB
        savePatientsToStore(data.body);
        
        
        } else if (data && !data.success) {
          userNotification("error", data.message);
        }
      });
  } 

  
}, [currPage,isIndexedDBLoaded , needsSync]);



// ===========================================
//        Table Buttons
// ===========================================

    function handleVisitBtn(patient){

      router.replace(`/private_routes/patient/${patient.user_id}?currPage=${currPage}`)
    }


  


// ===========================================
//        Clear Filters
// ===========================================
  function handleClearFilterOption(){
    const EMAIL_REF = inputsBoxsRef.current["user_email"];
    const NAME_REF = inputsBoxsRef.current["user_name"];
    const ByPhoneREF = inputsBoxsRef.current["patient_phone"];

    setIsFiltered(false) // set to false to render cached employees with no filters
    setFilteredResults([]); //to remove all
    setCurrPage(1);

    // reset select filters back to no filter
    EMAIL_REF.value = ""
    NAME_REF.value = ""
    ByPhoneREF.value = ""
}

// ===========================================
//        Filter Data
// ===========================================

// 1. This Function Checks Inputs Then Update isFiltered state
function handleFilterOption(e){
    if(e) e.preventDefault();
    // get filter inputs 

    const EMAIL_REF = inputsBoxsRef.current["user_email"];
    const NAME_REF = inputsBoxsRef.current["user_name"];
    const Phone_REF = inputsBoxsRef.current["patient_phone"];

    
    const user_email = EMAIL_REF.value === "" ? null : EMAIL_REF.value;
    const user_name = NAME_REF.value === "" ? null : NAME_REF.value;
    const patient_phone = Phone_REF.value === "" ? null : Phone_REF.value;


    // making sure this checking is applied when only pressing btn 
    if(!user_email && !user_name &&  !patient_phone && isFiltered){
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

    const EMAIL_REF = inputsBoxsRef.current["user_email"];
    const NAME_REF = inputsBoxsRef.current["user_name"];
    const Phone_REF = inputsBoxsRef.current["patient_phone"];


    const user_email = EMAIL_REF.value === "" ? null : EMAIL_REF.value;
    const user_name = NAME_REF.value === "" ? null : NAME_REF.value;
    const patient_phone = Phone_REF.value === "" ? null : Phone_REF.value;

  const filter_queries = stringifyFields(
    "anded",
    Object.entries({ user_email, patient_phone , user_name })
  );

  fetch(`${process.env.APIKEY}/list/patients?user_id=${user_data.user_id}&${filter_queries}&pagination=${currPage}&size=${sizeOfPage}`, {
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
        setFilteredResults(data.body.filter(emp => emp.user_id !== user_data.user_id));
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
          fieldDefinitions={{selectsElementsData,inputs_info}}
          />
      <Suspense fallback={<LoaderForComponents  styling={styles.loader_for_components_wrapper}/>}>
        <BasicTable 
          currPage={currPage} 
          sizeOfPage={sizeOfPage}
          setCurrPage={setCurrPage} 
          data={cached_patients} 
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

export default  private_routes(PatientsListPage)