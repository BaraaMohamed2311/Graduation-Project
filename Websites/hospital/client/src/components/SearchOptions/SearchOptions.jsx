import styles from "./searchoptions.module.css"
import Select from "../Select/Select";
import {  useEffect } from "react";
import {MapToSearchOptionFields} from "./SearchOptions_Fields"

function SearchOptions({ target, clearBtn, handleFilterOption, currPage  , selectsElementsData,inputs_info , references,isFiltered}){

    const Fields = MapToSearchOptionFields[target] || MapToSearchOptionFields["users"];
    useEffect(()=>{
        // fetch with filtering
        if(isFiltered){
            handleFilterOption();
        }
    },[currPage])
    

    return(
        <div className={styles["table-search-options"]}>
            <Fields  styles={styles} selectsElementsData={selectsElementsData} inputs_info={inputs_info} references={references}  />
            <button onClick={handleFilterOption} className={`${styles["filter"]} `}>Filter</button>
            <button onClick={clearBtn} className={`${styles["filter"]} `}>Reset</button>
        </div>
    )
}


export default SearchOptions;