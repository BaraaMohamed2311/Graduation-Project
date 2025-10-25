"use client"
import * as React from 'react';
import Table from '@mui/joy/Table';
import { useEffect  , useState} from "react";
import {useCachedEmployeesContext} from "../../contexts/cached_employees"
import styles from "./table.module.css"
import userNotification from '@/utils/userNotification';
import { useRouter } from 'next/navigation';
import stringifyFields from '@/utils/stringifyFields';
import statusNotification from "@/utils/statusNotification"
import { useUserDataContext } from '@/contexts/user_data';
import {TableColumnsMap } from "./Table_Fields"
export default function BasicTable({currPage,sizeOfPage , setCurrPage ,numOfPages , isFiltered,filteredResults,handleActionBtn  ,data , tableType}) {

  let [ isSmallScreen , setIsSmallScreen ] = useState(false);
  const TableColumns = TableColumnsMap[tableType] ||  <p>❌ Unknown table type: {tableType}</p>;

 useEffect(()=>{
    // check responsibility on first render
    ResponsiveTable()
    window.addEventListener("resize",ResponsiveTable );

    function ResponsiveTable(){
      if( window.innerWidth <= 1200){
        setIsSmallScreen(true)
      }
      else{
        setIsSmallScreen(false)
      }
  }

    

    return ()=>{
      window.removeEventListener("resize",ResponsiveTable )
    }
  },[])


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
    <div className={styles.table_wrapper}>
      <Table
        className={styles.table}
        aria-label="basic table"
        sx={{ "& td, & th": { userSelect: "all" } }}
      >
        <thead>
          <tr className={styles.table_row}>
            <TableColumns type="headers" isSmallScreen={isSmallScreen} />
          </tr>
        </thead>
        <tbody>
          {(!isFiltered && data.length > 0) && data.slice((currPage - 1) * sizeOfPage, currPage * sizeOfPage).map((row, idx) => {return (
            <tr key={idx} className={styles.table_row}>
              <TableColumns
                type="row"
                isSmallScreen={isSmallScreen}
                row={row}
                handleActionBtn={handleActionBtn}
              />
            </tr>
          )})}

          {(isFiltered && filteredResults.length > 0) && filteredResults.slice((currPage - 1) * sizeOfPage, currPage * sizeOfPage).map((row, idx) => (
            <tr key={idx} className={styles.table_row}>
              <TableColumns
                type="row"
                isSmallScreen={isSmallScreen}
                row={row}
                handleActionBtn={handleActionBtn}
              />
            </tr>
          ))}
        </tbody>
      </Table>

      <div className={styles.table_btn_wrapper}>
        <button id="prev" onClick={handlePagination} className="table-btn">
          <ion-icon name="chevron-back-outline"></ion-icon>
        </button>
        <span className="currpage">{currPage} - {numOfPages}</span>
        <button id="next" onClick={handlePagination} className="table-btn">
          <ion-icon name="chevron-forward-outline"></ion-icon>
        </button>
      </div>
    </div>
  );
}
