"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { updateStoreData } from "@/utils/indexDB/updateCacheMethods";
import { clearStore } from "@/utils/indexDB/deleteCacheMethods";

let cached_my_patients_context = createContext();

let useCachedMyPatientsContext = function() {
  return useContext(cached_my_patients_context);
};

function CachedMyPatientsProvider({ children }) {
  // Initialize with empty array
    const [cached_my_patients, setCached_My_Patients] = useState([]);
    const [fetched_my_patient_pages, setFetched_My_Patient_Pages] = useState(new Set());
    

  // ===============================
  // Load cached_my_patients (from IndexedDB)
  // ===============================
  useEffect(() => {
    (async () => {
      try {
        const storedPatients = await getAllFromStore("mypatients");
        if (Array.isArray(storedPatients)) {
          setCached_My_Patients(storedPatients);
        }
      } catch (err) {
        console.error("❌ Failed to load mypatients from IndexedDB:", err);
      }
    })();
  }, []);

  // ===============================
  // Load fetched_my_patient_pages (from localStorage)
  // ===============================
  useEffect(() => {
    try {
      const storedPages = localStorage.getItem("fetched_my_patient_pages");
      if (storedPages && storedPages !== "undefined" && storedPages !== "null") {
        const parsedPages = JSON.parse(storedPages);
        if (Array.isArray(parsedPages)) {
          setFetched_My_Patient_Pages(new Set(parsedPages));
        } else {
          localStorage.removeItem("fetched_my_patient_pages");
        }
      }
    } catch (err) {
      console.error("Failed to parse cached_my_patients or fetched pages:", err);
      localStorage.removeItem("cached_my_patients");
      localStorage.removeItem("fetched_my_patient_pages");
    }
  }, []);

  
// ===============================
  // Persist fetched pages when updated
  // ===============================
  useEffect(() => {
    try {
      if (fetched_my_patient_pages && fetched_my_patient_pages.size > 0) {
        localStorage.setItem(
          "fetched_my_patient_pages",
          JSON.stringify([...fetched_my_patient_pages])
        );
      } else {
        localStorage.removeItem("fetched_my_patient_pages");
      }
    } catch (err) {
      console.error("Failed to save fetched_my_patient_pages:", err);
    }
  }, [fetched_my_patient_pages]);
  
    return (
      <cached_my_patients_context.Provider value={{ cached_my_patients, setCached_My_Patients ,fetched_my_patient_pages, setFetched_My_Patient_Pages}}>
        {children}
      </cached_my_patients_context.Provider>
    );
}

export { useCachedMyPatientsContext, CachedMyPatientsProvider };
