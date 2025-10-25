// filters/userFilters.js
import Select from "@/components/Select/Select";
import Inputs from "../Inputs/Inputs";
function renderUserFilters({ styles,inputs_info, selectsElementsData, references }) {
  return (
    <>{inputs_info && 
       <Inputs
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
          />
        ))}
    </>
  );
}




 function renderRoomFilters({ styles, selectsElementsData, references }) {
  return (
    <>

      {selectsElementsData &&
        selectsElementsData.map((selectData) => (
          <Select
            key={selectData.key}
            styles={styles}
            isLabeld={false}
            select_options={selectData}
            reference={references.selectBoxsRef}
          />
        ))}
        {/* New buttons for occupied and empty rooms */}

        <button
          type="button"
          className={`${styles["filter"]} ${styles["occupied-btn"]}`}
          onClick={(e) => references.handleFilterOption(e)}
        >
          Show All Occupied
        </button>

        <button
          type="button"
          className={`${styles["filter"]} ${styles["empty-btn"]}`}
          onClick={(e) => references.handleFilterOption(e)}
        >
          Show All Empty
        </button>
    
    </>
  );
}


function renderPatientFilters({ styles,inputs_info, selectsElementsData, references }) {
  return (
    <>
      {inputs_info && 
       <Inputs
        styles={styles}
        inputs_info={inputs_info}
        type="normal_input"
        references={references.inputsBoxsRef}
        formKind={"row_inputs"}
      />}
    </>
  );
}


const MapToSearchOptionFields ={
    "users":renderUserFilters,
    "rooms":renderRoomFilters,
    "patients":renderPatientFilters
}

export {MapToSearchOptionFields}

