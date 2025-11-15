import SearchOptions from "@/components/SearchOptions/SearchOptions";
import BasicTable from "@/components/BasicTable/BasicTable";
import { inputs_info } from "./data";
import { useRouter } from "next/navigation";
function SelectUser({ list_url,handleSelectBtn,handleClearFilterOption,handleFilterOption}) {
    
  // for filtering
  let [isFiltered , setIsFiltered]  = useState(false);
  let [filteredResults , setFilteredResults] = useState([]); // as array not Map cuz we will not cache "pageNum":[{},{},...] like we did with cachedContext
  let [currPage , setCurrPage ] = useState(1);
  let [numOfPages , setNumOfPages] = useState(1);
  const [filterTrigger, setFilterTrigger] = useState(0);
  const {user_data} = useUserDataContext();
  let {cached_my_patients, setCached_My_Patients , fetched_my_patient_pages, setFetched_My_Patient_Pages} = useCachedMyPatientsContext();
   // Refrences
  const inputsBoxsRef= useRef({});
  const router = useRouter()
  const sizeOfPage = 12;


// ===========================================
//        Initial Fetch
// ===========================================
useEffect(() => {
  console.log("isFiltered",isFiltered)
  if (isFiltered) return;

  if (!fetched_my_patient_pages.has(currPage)) {
    fetch(`${process.env.APIKEY}/list/${list_url}`, {
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
        
        } else if (data && !data.success) {
          userNotification("error", data.message);
        }
      });
  } 

  
}, [currPage]);


useEffect(()=>{console.log("fetched_my_patient_pages",fetched_my_patient_pages)},[fetched_my_patient_pages])


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

  fetch(`${process.env.APIKEY}/list/${list_url}`, {
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
    <>
        <SearchOptions 
                  
                    target={"patients"}
                    isFiltered={isFiltered}
                    references ={{ inputsBoxsRef: inputsBoxsRef }}
                    clearBtn = {handleClearFilterOption} 
                    handleFilterOption={handleFilterOption} 
                    setCurrPage={setCurrPage} 
                    currPage={currPage} 
                    sizeOfPage={sizeOfPage} 
                    setFilteredResults={setFilteredResults} 
                    inputs_info={inputs_info}
                  />
                    
                    
                        <BasicTable 
                                  currPage={currPage} 
                                  sizeOfPage={sizeOfPage}
                                  setCurrPage={setCurrPage} 
                                  data={cached_patients} 
                                  isFiltered={isFiltered} 
                                  filteredResults={filteredResults} 
                                  handleActionBtn={handleSelectBtn}   
                                  numOfPages={numOfPages} 
                                  tableType="patients"
                                />
    </>
  );
}

export default SelectUser;