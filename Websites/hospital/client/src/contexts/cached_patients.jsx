"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { appendToIndexDB } from "@/utils/indexDB/appendToIndexDB";
import { clearStore } from "@/utils/indexDB/deleteCacheMethods";

let cached_patients_context = createContext();

 function useCachedPatientsContext() {
  return useContext(cached_patients_context);
}

 function CachedPatientsProvider({ children }) {
  // Initialize with empty array
  const [cached_patients, setCached_Patients] = useState([]);
  const [fetched_patient_pages, setFetched_Patient_Pages] = useState(new Set());


  // ===============================
  // Load cached patients (from IndexedDB)
  // ===============================
  useEffect(() => {
    (async () => {
      try {
        const storedPatients = await getAllFromStore("patients");

        if (Array.isArray(storedPatients)) {
          setCached_Patients(storedPatients);
        }
      } catch (err) {
        console.error("Failed to load patients from IndexedDB:", err);
      }
    })();
  }, []);

  // ===============================
  // Load fetched pages (from localStorage)
  // ===============================
  useEffect(() => {
    try {
      const storedPages = localStorage.getItem("fetched_patient_pages");
      if (storedPages && storedPages !== "undefined" && storedPages !== "null") {
        const parsedPages = JSON.parse(storedPages);
        if (Array.isArray(parsedPages)) {
          setFetched_Patient_Pages(new Set(parsedPages));
        } else {
          localStorage.removeItem("fetched_patient_pages");
        }
      }
    } catch (err) {
      console.error("Failed to parse cached_patients or fetched pages:", err);
      localStorage.removeItem("cached_patients");
      localStorage.removeItem("fetched_patient_pages");
    }
  }, []);


  // ===============================
  // Persist fetched pages
  // ===============================
  useEffect(() => {
    try {
      if (fetched_patient_pages && fetched_patient_pages.size > 0) {
        localStorage.setItem(
          "fetched_patient_pages",
          JSON.stringify([...fetched_patient_pages])
        );
      } else {
        localStorage.removeItem("fetched_patient_pages");
      }
    } catch (err) {
      console.error("Failed to save fetched_patient_pages:", err);
    }
  }, [fetched_patient_pages]);

  return (
    <cached_patients_context.Provider value={{ cached_patients, setCached_Patients , fetched_patient_pages, setFetched_Patient_Pages }}>
      {children}
    </cached_patients_context.Provider>
  );
}


export { useCachedPatientsContext, CachedPatientsProvider };
