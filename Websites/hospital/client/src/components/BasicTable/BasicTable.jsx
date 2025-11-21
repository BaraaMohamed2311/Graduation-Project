"use client"
import * as React from 'react';
import Table from '@mui/joy/Table';
import { useEffect  , useState} from "react";
import styles from "./table.module.css"
import {TableColumnsMap } from "./Table_Fields"
import Pagination_Btns from "../Pagination_Btns/Pagination_Btns";
export default function BasicTable({currPage,sizeOfPage , setCurrPage ,numOfPages , isFiltered,filteredResults,handleActionBtn  ,data=[] , tableType}) {

  let [ isSmallScreen , setIsSmallScreen ] = useState(false);
  const TableColumns = TableColumnsMap[tableType] ||  ((props) => <p>❌ Unknown table type: {tableType}</p>); // Fallback component (Must be a function component, otherwise React will throw an error since it is a .jsx file)

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
          {/* We have to pass row to each  handleActionBtn to act on targeted user*/}
          {(!isFiltered && data.length > 0) && data.slice((currPage - 1) * sizeOfPage, currPage * sizeOfPage).map((row, idx) => {return (
            <tr key={idx} className={styles.table_row}>
              <TableColumns
                type="row"
                isSmallScreen={isSmallScreen}
                row={row}
                handleActionBtn={(e)=>handleActionBtn(row)}
              />
            </tr>
          )})}

          {(isFiltered && filteredResults.length > 0) && filteredResults.slice((currPage - 1) * sizeOfPage, currPage * sizeOfPage).map((row, idx) => (
            <tr key={idx} className={styles.table_row}>
              <TableColumns
                type="row"
                isSmallScreen={isSmallScreen}
                row={row}
                handleActionBtn={(e)=>handleActionBtn(row)}
              />
            </tr>
          ))}
        </tbody>
      </Table>

      <div className={styles.table_btn_wrapper}>
        <Pagination_Btns handlePagination={handlePagination} currPage={currPage} numOfPages={numOfPages} />
      </div>
    </div>
  );
}
