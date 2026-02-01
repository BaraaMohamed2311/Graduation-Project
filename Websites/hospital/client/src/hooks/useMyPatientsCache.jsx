// hooks/useMyPatientsCache.js
import { useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { putIndexDB } from "@/utils/indexDB/updateCacheMethods";
import { clearStore , deleteRecordById} from "@/utils/indexDB/deleteCacheMethods";

export const useMyPatientsCache = () => {
  const [cached_my_patients, setCached_My_Patients] = useState([]);
  const [fetched_my_patient_pages, setFetched_My_Patient_Pages] = useState(new Set());
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState(false);

  // Load from IndexedDB
  useEffect(() => {
    (async () => {
      try {
        const storedPatients = await getAllFromStore("mypatients");
        if (Array.isArray(storedPatients)) {
          setCached_My_Patients(storedPatients);
        }
        // After we try loading, set the flag to true. this fixes 
        setIsIndexedDBLoaded(true);
      } catch (err) {
        console.error("❌ Failed to load mypatients from IndexedDB:", err);
      }
    })();
  }, []);

  // Load fetched pages from localStorage
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
      console.error("Failed to parse fetched_my_patient_pages:", err);
      localStorage.removeItem("fetched_my_patient_pages");
    }
  }, []);

  // Persist fetched pages
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

  // Save my patients to IndexedDB
  const saveMyPatientsToStore = async (patients) => {
    try {
      if (Array.isArray(patients) && patients.length > 0) {
        await putIndexDB("mypatients", patients);
      } else {
        await clearStore("mypatients");
      }
    } catch (err) {
      console.error("Failed to save my patients to IndexedDB:", err);
      throw err;
    }
  };

  // Check if a specific page needs sync
  const checkPageSync = async ( max_version) => {

    try {
      const response = await fetch(`${process.env.APIKEY}/sync/mypatients?max_version=${max_version}`);
      const data = await response.json();
      console.log(data.needsSync);

      return {needsSync : data.needsSync , latest_version:data.latest_version}; 
    } catch (err) {
      console.error("Failed to check page sync:", err);
      return {needsSync : true , latest_version:0}; 
    }
  };

  // Save mypatients to IndexedDB
  const deleteMyPatientFromStore = async (patient_id) => {
    try {
      // delete specific employee by id from IndexedDB and from state
        await deleteRecordById("mypatients", patient_id);
        setCached_My_Patients((prev) => prev.filter(mp => mp.user_id !== patient_id));

    } catch (err) {
      console.error("Failed to delete my patient to IndexedDB:", err);
      throw err;
    }
  };

  return {
    cached_my_patients,
    setCached_My_Patients,
    fetched_my_patient_pages,
    setFetched_My_Patient_Pages,
    saveMyPatientsToStore,
    isIndexedDBLoaded,
    setIsIndexedDBLoaded,
    checkPageSync,
    deleteMyPatientFromStore
  };
};