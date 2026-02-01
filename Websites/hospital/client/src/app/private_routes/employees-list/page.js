"use client"
import private_routes from "../page";
import { Suspense , lazy ,useState , useRef , useEffect} from "react";
import { useRouter } from "next/navigation";
import LoaderForComponents from "@/components/LoaderForComponents/LoaderForComponents";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import styles from "./list.module.css"
import {select_def , inputs_info} from "./data";
import userNotification from "@/utils/userNotification";
import stringifyFields from "@/utils/stringifyFields";
import statusNotification from "@/utils/statusNotification";
import { useUserDataContext } from "@/contexts/user_data";
import BasicTable from '@/components/BasicTable/BasicTable';
import { useEmployeesCache } from "@/hooks/useEmployeesCache";
import { getLastSync, setLastSync } from "@/utils/get_set_lastSync";

function EmployeesListPage() {
  
  const sizeOfPage = 12;
  const {user_data} = useUserDataContext()
  const {cached_employees,setCached_Employees,fetched_employee_pages,setFetched_Employee_Pages,saveEmployeesToStore,isIndexedDBLoaded , checkPageSync} = useEmployeesCache()
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  let [needsSync , setNeedsSync] = useState(false);



  // Refrences
  const inputsBoxsRef= useRef({});
  const selectBoxsRef= useRef({});
  const router = useRouter();

  // ===========================================
//         Sync Pages
// ===========================================
useEffect(() => {
  (async () => {
    const max_version = getLastSync("employees")
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
    console.log("isFiltered",isFiltered)
    if (isFiltered) return;
    if(!isIndexedDBLoaded) return; // wait till indexedDB is loaded to avoid overwriting cached data
  
    if (!fetched_employee_pages.has(currPage) || needsSync) {
      console.log("page not fetched")
      fetch(`${process.env.APIKEY}/list/employees?user_id=${user_data.user_id}&pagination=${currPage}&size=${sizeOfPage}`, {
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
            setCached_Employees((prev) => {
              const map = new Map(prev.map((emp) => [emp.user_id, emp])); 
              data.body.forEach((emp) => {
                map.set(emp.user_id, emp); // replaces existing or inserts new
              });
              return Array.from(map.values());
            });
            setFetched_Employee_Pages(prev => {
            const updated = new Set(prev);
            updated.add(currPage);
            return updated;
          });
          // save to indexedDB
          saveEmployeesToStore(data.body)
          
          } else if (data && !data.success) {
            userNotification("error", data.message);
          }
        });
    } 
  
    
  }, [currPage,isIndexedDBLoaded,needsSync]);

  // ===========================================
//        Table Buttons
// ===========================================

    function handleVisitBtn(employee){
      router.replace(`/private_routes/employee/${employee.user_id}?currPage=${currPage}`)
    }


// ===========================================
//        Clear Filters
// ===========================================
  function handleClearFilterOption(){
    const EMAIL_REF = inputsBoxsRef.current["Email"];
    const NAME_REF = inputsBoxsRef.current["user_name"];
    const ByTitleREF = selectBoxsRef.current["emp_title"];
    const ByspecialtyREF = selectBoxsRef.current["emp_specialty"];
    const ByRoleREF = selectBoxsRef.current["role_name"];
    const ByPermsREF = selectBoxsRef.current["emp_perms"];
    console.log("reset",selectBoxsRef.current["emp_specialty"].value);
    setIsFiltered(false) // set to false to render cached employees with no filters
    setFilteredResults([]); //to remove all
    setCurrPage(1);

    // reset select filters back to no filter
    EMAIL_REF.value = ""
    NAME_REF.value = ""
    ByTitleREF.value = ""
    ByspecialtyREF.value = ""
    ByRoleREF.value = ""
    ByPermsREF.value = ""
}
// ===========================================
//        Filter Data
// ===========================================
function handleFilterOption(e , cause){
    if(e) e.preventDefault();
    // get filter inputs 
    const EMAIL_REF = inputsBoxsRef.current["user_email"];
    const NAME_REF = inputsBoxsRef.current["user_name"];
    const ByTitleREF = selectBoxsRef.current["emp_title"];
    const ByspecialtyREF = selectBoxsRef.current["emp_specialty"];
    const ByRoleREF = selectBoxsRef.current["role_name"];
    const ByPermsREF = selectBoxsRef.current["emp_perms"];
    
    const user_email = EMAIL_REF.value === "" ? null : EMAIL_REF.value;
    const user_name = NAME_REF.value === "" ? null : NAME_REF.value;
    const role_name = ByRoleREF.value === "Role Filter" ? null : ByRoleREF.value;
    const emp_title = ByTitleREF.value === "Title Filter" ? null : ByTitleREF.value;
    const emp_specialty = ByspecialtyREF.value === "specialty Filter" ? null : ByspecialtyREF.value;
    const emp_perms = ByPermsREF.value === "Perms Filter" ? null : ByPermsREF.value;
    console.log("handleFilterOption: emp_perms", emp_perms);
    // making sure this checking is applied when only pressing btn 
    if(!user_name &&  !user_email && !role_name && !emp_title && !emp_specialty && !emp_perms && cause === "button"){
        userNotification("error","No Filters Entered");
        handleClearFilterOption(); // resets if no filtering specified
        return; // to escape rest of the function
    }

    // reset page to 1 when filtering
    if(  cause   === "button")
        setCurrPage(1)

    // we use stringifyFields function to exclude null values and do not add as query also join them
    const filter_queries = stringifyFields("anded",Object.entries({isFiltered,user_email,user_name , role_name:role_name , emp_title:emp_title, emp_specialty:emp_specialty, emp_perms: emp_perms}))
    
    // fetching data on filter 
    fetch(`${process.env.APIKEY}/list/employees?user_id=${user_data.user_id}&${filter_queries}&pagination=${currPage}&size=${sizeOfPage}`,{
        mode:"cors",
        headers:{
            Authorization: `BEARER ${user_data.token}`,
            'Content-Type': 'application/json'
      }
    })
    .then(res=>{
          statusNotification(res.status)  
          return res.json();
    })
    .then(data=>{
        if(data && data.success){
            setIsFiltered(true)
            setFilteredResults(data.body); //to remove previous cached and cache filtered users
        }
        else if(data && !data.success) {
            setIsFiltered(false); // if failed then we display regular cached_employees by setting back to false
            userNotification("error",data.message)
        }
    })
    .catch(err=>{
        setIsFiltered(false); // if failed then we display regular cached_employees by setting back to false
        userNotification("error",data.message)
    })
}



  
  return (
    <main className={`${styles["list"]} wrapper`}>
      <SearchOptions 
          references ={{ inputsBoxsRef: inputsBoxsRef ,selectBoxsRef: selectBoxsRef}}
          clearBtn = {handleClearFilterOption} 
          handleFilterOption={handleFilterOption} 
          setCurrPage={setCurrPage} 
          currPage={currPage} 
          sizeOfPage={sizeOfPage} 
          setIsFiltered= {setIsFiltered} 
          setFilteredResults={setFilteredResults} 
          fieldDefinitions={{select_def,inputs_info}}
          />
      <Suspense fallback={<LoaderForComponents  styling={styles.loader_for_components_wrapper}/>}>
         <BasicTable 
                  currPage={currPage} 
                  sizeOfPage={sizeOfPage}
                  setCurrPage={setCurrPage} 
                  data={cached_employees} 
                  isFiltered={isFiltered} 
                  filteredResults={filteredResults} 
                  handleActionBtn={handleVisitBtn}   
                  numOfPages={numOfPages} 
                  tableType="employees"
                />
      </Suspense>
    </main>
  );
}

export default  private_routes(EmployeesListPage)