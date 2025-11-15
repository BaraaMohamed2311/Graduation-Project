"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { updateStoreData } from "@/utils/indexDB/updateCacheMethods";
import { clearStore } from "@/utils/indexDB/deleteCacheMethods";

const cached_employees_context = createContext();

const useCachedEmployeesContext = function() {
  return useContext(cached_employees_context);
};

function CachedEmployeesProvider({ children }) {
  // Initialize with empty array
  const [cached_employees, setCached_Employees] = useState([]);
  const [fetched_employee_pages, setFetched_Employee_Pages] = useState(new Set());

  // ===============================
  // Load cached_employees (from IndexedDB)
  // ===============================
  useEffect(() => {
    (async () => {
      try {
        const storedEmployees = await getAllFromStore("employees");
        if (Array.isArray(storedEmployees)) {
          setCached_Employees(storedEmployees);
        }
      } catch (err) {
        console.error("Failed to load employees from IndexedDB:", err);
      }
    })();
  }, []);

  // ===============================
  // Load fetched_employee_pages (from localStorage)
  // ===============================
  useEffect(() => {
    try {
      const storedPages = localStorage.getItem("fetched_employee_pages");
      if (storedPages && storedPages !== "undefined" && storedPages !== "null") {
        const parsedPages = JSON.parse(storedPages);
        if (Array.isArray(parsedPages)) {
          setFetched_Employee_Pages(new Set(parsedPages));
        } else {
          localStorage.removeItem("fetched_employee_pages");
        }
      }
    } catch (err) {
      console.error("Failed to parse cached_employees or fetched pages:", err);
      localStorage.removeItem("fetched_employee_pages");
    }
  }, []);

  // ===============================
  // Persist fetched pages when updated
  // ===============================
  useEffect(() => {
    try {
      if (fetched_employee_pages && fetched_employee_pages.size > 0) {
        localStorage.setItem(
          "fetched_employee_pages",
          JSON.stringify([...fetched_employee_pages])
        );
      } else {
        localStorage.removeItem("fetched_employee_pages");
      }
    } catch (err) {
      console.error("Failed to save fetched_employee_pages:", err);
    }
  }, [fetched_employee_pages]);

  return (
    <cached_employees_context.Provider 
      value={{ 
        cached_employees, 
        setCached_Employees,
        fetched_employee_pages, 
        setFetched_Employee_Pages 
      }}
    >
      {children}
    </cached_employees_context.Provider>
  );
}

export { useCachedEmployeesContext, CachedEmployeesProvider };