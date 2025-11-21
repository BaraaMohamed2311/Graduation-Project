import SearchOptions from "@/components/SearchOptions/SearchOptions";
import SelectUserCard from "../UserCard/SelectUserCard";
import Inputs from "../Inputs/Inputs";
import Select from "../Select/Select";
import userNotification from "@/utils/userNotification";
import  statusNotification  from "@/utils/statusNotification";
import { useUserDataContext } from "@/contexts/user_data";
import { Suspense, useState } from "react";
import LoaderForComponents from "@/components/LoaderForComponents/LoaderForComponents";
import styles from "./selectuser.module.css";

function SelectUser({ list_url,handleConfirmBtn,inputs_info,selectsElementsData, references ,selectedUser , setSelectedUser}) {
    

  
  const {user_data} = useUserDataContext();
  

  console.log("references in SelectUser:", references,inputs_info);

function fetchUser(e)  {
  if(e) e.preventDefault();


      // Build individual parameter sets first to check if any filters exist
      console.log("chheee",inputs_info, references?.inputsBoxsRef)
      const inputParams = buildQueryParams(inputs_info, references?.inputsBoxsRef);
      const selectParams = buildQueryParams(selectsElementsData, references?.selectsBoxsRef);

      // Check if any filters were actually provided
      const hasInputFilters = Array.from(inputParams.entries()).length > 0;
      const hasSelectFilters = Array.from(selectParams.entries()).length > 0;
      console.log(inputParams.entries(),selectParams.entries())
      if (!hasInputFilters && !hasSelectFilters) {
          return userNotification("error", "Please provide at least one filter option");
      }

      // Only build the full query if we have filters
      let queryParams = new URLSearchParams();

      inputParams.forEach((value, key) => queryParams.append(key, value));
      selectParams.forEach((value, key) => queryParams.append(key, value));

      // Append Current Logged In user Data
      queryParams.append("user_id",user_data.user_id)
      const queryString = queryParams.toString();

      


  //        Fetch Filtered Data
  fetch(`${process.env.APIKEY}/list${list_url}${queryString ? `?${queryString}` : ''}`, {
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
      console.log("data from fetch",data)
      if (data?.success) {
        console.log("setSelectedUser",data.body)
        setSelectedUser(data.body);
        setNumOfPages(data.numOfPages || 1);
      } else {
        userNotification("error", data.message);
        setSelectedUser(null);
      }
    })
    .catch((err) => {userNotification("error", "Network error");console.log("err",err)});
};


  //============================================
  // buildQueryParams helper function
  //============================================
    const buildQueryParams = (array,reference) => {

      // Check if array exists and is not empty
    if (!array || !Array.isArray(array) || array.length === 0) {
      return new URLSearchParams();
    }
    
    // Check if reference exists
    if (!reference || !reference.current) {
      return new URLSearchParams();
    }


      let queryParams = new URLSearchParams();

      // Iterate through array to get all configured fields
      array.forEach(fieldConfig => {
        const inputRef = reference.current[fieldConfig.name]; // Use label as ref key
        if (inputRef && inputRef.value !== "" && inputRef.value != null) {
          // Use the 'name' property from array as the query parameter name
          queryParams.append(fieldConfig.name, inputRef.value);
        }
      });
      
      return queryParams;
    };

  //============================================
  // handleClearFilterOption
  //============================================
  function handleClearFilterOption(e) {
    if (e) e.preventDefault();

    // Clear all input fields
    if (references?.inputsBoxsRef?.current) {
      Object.values(references.inputsBoxsRef.current).forEach(inputRef => {
        if (inputRef && typeof inputRef.value !== 'undefined') {
          inputRef.value = "";
        }
      });
    }

    // Reset all select fields to their default value (usually the first option)
    if (references?.selectsBoxsRef?.current) {
      Object.values(references.selectsBoxsRef.current).forEach(selectRef => {
        if (selectRef && selectRef.options && selectRef.options.length > 0) {
          selectRef.selectedIndex = 0; // Reset to first option
        }
      });
    }

    // Also clear any selected user and reset pagination if needed
    setSelectedUser(null);
    userNotification("success", "All filters cleared successfully");
  }


  return (
    <>  
        <div className={styles["table-search-options"]}>
            {inputs_info && <Inputs 
              styles={styles}
              inputs_info={inputs_info}
              type="normal_input"
              references={references.inputsBoxsRef}
              formKind={"row_inputs"}
            />}
            {selectsElementsData &&
        selectsElementsData.map((selectData) => (
            <Select 
              key={selectData.key}
              styles={styles}
              isLabeld={false}
              select_options={selectData}
              reference={references.selectBoxsRef}
            />))}
            <button onClick={fetchUser} className={`${styles["filter"]} `}>Get User</button>
            <button onClick={handleClearFilterOption} className={`${styles["filter"]} ${styles["clear-filter"]}`}>Clear Filters</button>
        </div>
        
                    
                    
        <Suspense fallback={<LoaderForComponents  styling={styles.loader_for_components_wrapper}/>}>
            <SelectUserCard selectedUser={selectedUser} />
        </Suspense>
        {selectedUser && <button className={styles.select_btn} onClick={handleConfirmBtn}>Confirm</button>}
    </>
  );
}

export default SelectUser;