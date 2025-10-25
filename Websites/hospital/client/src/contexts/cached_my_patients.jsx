"use client";
import { createContext, useContext, useState, useEffect } from "react";

let cached_my_patients_context = createContext();

let useCachedMyPatientsContext = function() {
  return useContext(cached_my_patients_context);
};

function CachedMyPatientsProvider({ children }) {
  // Initialize with empty array
    const [cached_my_patients, setCached_My_Patients] = useState([]);
    const [fetched_my_patient_pages, setFetched_My_Patient_Pages] = useState(new Set());
    // Load from localStorage once on mount
     // ===============================
  // Load from localStorage once on mount
  // ===============================
  useEffect(() => {
    try {
      // Load patients
      const storedPatients = localStorage.getItem("cached_my_patients");
      if (storedPatients && storedPatients !== "undefined" && storedPatients !== "null") {
        const parsedPatients = JSON.parse(storedPatients);
        if (Array.isArray(parsedPatients)) {
          setCached_My_Patients(parsedPatients);
        } else {
          localStorage.removeItem("cached_my_patients");
        }
      }

      // Load fetched pages
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
  // Persist cached patients when updated
  // ===============================
  useEffect(() => {
    try {
      if (Array.isArray(cached_my_patients) && cached_my_patients.length > 0) {
        localStorage.setItem("cached_my_patients", JSON.stringify(cached_my_patients));
      } else {
        localStorage.removeItem("cached_my_patients");
      }
    } catch (err) {
      console.error("Failed to save cached_my_patients:", err);
    }
  }, [cached_my_patients]);
  
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
