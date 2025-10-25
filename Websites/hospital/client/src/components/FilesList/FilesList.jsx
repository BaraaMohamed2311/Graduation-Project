"use client";
import { useState } from "react";
import styles from "./fileslist.module.css";

export default function PatientFiles({ files = [], onDownloadFile, onDownloadAll }) {
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5; // adjust per your layout

  // Pagination logic
  const totalPages = Math.ceil(files.length / filesPerPage);
  const startIdx = (currentPage - 1) * filesPerPage;
  const visibleFiles = files.slice(startIdx, startIdx + filesPerPage);

  return (
    <div className={styles["files-section"]}>
      <div className={styles["files-header"]}>
        <h2>Patient Files</h2>
        {files.length > 0 && (
          <button onClick={onDownloadAll} className="blue-button">
            Download All
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <p className={styles["no-files"]}>No files uploaded yet.</p>
      ) : (
        <>
          <ul className={styles["files-list"]}>
            {visibleFiles.map((file, idx) => (
              <li
                key={idx}
                className={styles["file-item"]}
                onClick={() => onDownloadFile(file)}
              >
                <div className={styles["file-info"]}>
                  <span className={styles["file-name"]}>{file.name}</span>
                  <span className={styles["file-type"]}>{file.type}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination Controls */}
          <div className={styles["pagination"]}>
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
