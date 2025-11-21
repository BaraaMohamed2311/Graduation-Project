// hooks/usePatientsCache.js
import { useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { clearStore } from "@/utils/indexDB/deleteCacheMethods";
import { appendToIndexDB } from "@/utils/indexDB/appendToIndexDB";

export const usePatientsCache = () => {
  const [cached_patients, setCached_Patients] = useState([]);
  const [fetched_patient_pages, setFetched_Patient_Pages] = useState(new Set());
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState(false);

  // Load from IndexedDB
  useEffect(() => {
    (async () => {
      try {
        const storedPatients = await getAllFromStore("patients");
        if (Array.isArray(storedPatients)) {
          setCached_Patients(storedPatients);
        }
        // After we try loading, set the flag to true
        setIsIndexedDBLoaded(true);
      } catch (err) {
        console.error("Failed to load patients from IndexedDB:", err);
      }
    })();
  }, []);

  // Load fetched pages from localStorage
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
      console.error("Failed to parse fetched_patient_pages:", err);
      localStorage.removeItem("fetched_patient_pages");
    }
  }, []);

  // Persist fetched pages
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

  // Save patients to IndexedDB
  const savePatientsToStore = async (patients) => {
    try {
      if (Array.isArray(patients) && patients.length > 0) {
        await appendToIndexDB("patients", patients);
      } else {
        await clearStore("patients");
      }
    } catch (err) {
      console.error("Failed to save patients to IndexedDB:", err);
      throw err;
    }
  };

  return {
    cached_patients,
    setCached_Patients,
    fetched_patient_pages,
    setFetched_Patient_Pages,
    savePatientsToStore,
    isIndexedDBLoaded, 
    setIsIndexedDBLoaded
  };
};