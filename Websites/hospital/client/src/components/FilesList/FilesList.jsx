"use client";
import { useEffect, useState } from "react";
import styles from "./fileslist.module.css";
import { useUserDataContext } from "@/contexts/user_data";
import FileUploadButton from "@/components/FileUploadButton/FileUploadButton";
import statusNotification from "@/utils/statusNotification";
import userNotification from "@/utils/userNotification";
import Pagination_Btns from "../Pagination_Btns/Pagination_Btns";

export default function PatientFiles({onUploadFile,onDeleteFile , urls,files_meta , setFilesMeta }) {
  const [currtPage, setCurrPage] = useState(1);
  const filesPerPage = 5;
  const { user_data } = useUserDataContext();
  
  let [numOfPages , setNumOfPages] = useState(1);




  // ================================
  //    Initial meta data fetching
  // ================================
  useEffect(()=>{
    fetch(`${process.env.APIKEY}/${urls.initial_url}?pagination=${currtPage}&size=${filesPerPage}`, {
      mode: "cors",
      headers: {
        Authorization: `BEARER ${user_data.token}`,
        "Content-Type": "application/json",
      },
    })
    .then(res =>{
      statusNotification(res.status)
      return res.json()
    })
    .then(data =>{
      if(data?.success){
        setFilesMeta(data.files)
        setNumOfPages(data.numOfPages || 1)
      }
      userNotification(data?.success ? "success" : "error",data.message)
    })
    .catch(err =>{ 
      console.error(err)
      userNotification("error","Error Fetching Files")
    }
    )
  },[])

  // ================================
  //      Download All
  function onDownloadAll(){

  }
  // ================================
  //      Download File
  async function onDownloadFile(entry){
    try {
    const response = await fetch(`${process.env.APIKEY}/${urls.download_one_url}/${entry.file_id}/download`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user_data.token}` }, // if needed
    });

    if (!response.ok) throw new Error("Failed to fetch file");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = entry.file_name; // filename for client
    document.body.appendChild(a);
    a.click();

    // Cleanup
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading file:", err);
    userNotification("error", "Error downloading file");
  }

  }

  // ================================
  // Pagination
  // ================================
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
    <div className={styles["files-section"]}>
      <div className={styles["files-header"]}>
        <h2>Patient Files</h2>

        {files_meta && files_meta.length > 0 && (
          <button onClick={onDownloadAll} className="blue-button">
            Download All
          </button>
        )}
      </div>

      {/* ============================
          No files available
      ============================ */}
      {files_meta && files_meta.length === 0 ? (
        <p className={styles["no-files"]}>No files uploaded yet.</p>
      ) : (
        <>
          <ul className={styles["files-list"]}>
            {files_meta &&  files_meta.map((entry, idx) => {
              const meta = entry || {}; // safer access
              const fileName = meta.file_name || "Unknown file";
              const fileType = meta.file_type || "Unknown type";
              const createdAt = meta.createdAt || "N/A"

              return (
                <li
                  key={idx}
                  className={styles["file-item"]}
                  onClick={() => onDownloadFile(entry)} // send full metadata back to parent
                >
                    <span className={styles["file-name"]}>{fileName}</span>
                    <span className={styles["file-type"]}>{fileType}</span>
                    <span className={styles["file-date"]}>{createdAt}</span>
                 <button
                  className={styles["file-delete-btn"]}
                  onClick={(e) => onDeleteFile(e, entry)}
                >
                  🗑
                </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ============================
          File Buttons
      ============================ */}
      <div className={styles["file-actions"]}>
        <FileUploadButton onFileSelect={onUploadFile} />

      </div>

      {/* ============================
          Pagination
      ============================ */}
      
      <Pagination_Btns handlePagination={handlePagination} currPage={currtPage} numOfPages={numOfPages}/>
    </div>
  );
}
