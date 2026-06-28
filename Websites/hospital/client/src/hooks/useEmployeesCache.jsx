// hooks/useEmployeesCache.js
import { useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { putIndexDB } from "@/utils/indexDB/updateCacheMethods";
import { clearStore } from "@/utils/indexDB/deleteCacheMethods";

export const useEmployeesCache = () => {
  const [cached_employees, setCached_Employees] = useState([]);
  const [fetched_employee_pages, setFetched_Employee_Pages] = useState(new Set());
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState(false);

  // Load from IndexedDB
  useEffect(() => {
    (async () => {
      try {
        const storedEmployees = await getAllFromStore("employees");
        if (Array.isArray(storedEmployees)) {
          setCached_Employees(storedEmployees);
        }
        setIsIndexedDBLoaded(true);
      } catch (err) {
        console.error("Failed to load employees from IndexedDB:", err);
        setIsIndexedDBLoaded(true); // still unblock the app on error
      }
    })();
  }, []);

  // Load fetched pages from localStorage
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
      console.error("Failed to parse fetched_employee_pages:", err);
      localStorage.removeItem("fetched_employee_pages");
    }
  }, []);

  // Persist fetched pages
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

  // FIX: Merge new employees into IndexedDB instead of replacing
  const saveEmployeesToStore = async (newEmployees) => {
    try {
      if (!Array.isArray(newEmployees) || newEmployees.length === 0) {
        await clearStore("employees");
        return;
      }
      // Merge with whatever is already in IndexedDB
      const existing = await getAllFromStore("employees");
      const map = new Map(
        Array.isArray(existing) ? existing.map((e) => [e.user_id, e]) : []
      );
      newEmployees.forEach((e) => map.set(e.user_id, e));
      await putIndexDB("employees", Array.from(map.values()));
    } catch (err) {
      console.error("Failed to save employees to IndexedDB:", err);
      throw err;
    }
  };

  const checkPageSync = async (max_version) => {
    try {
      const response = await fetch(
        `${process.env.APIKEY}/sync/employees?max_version=${max_version}`
      );
      const data = await response.json();
      return { needsSync: data.needsSync, latest_version: data.latest_version };
    } catch (err) {
      console.error("Failed to check page sync:", err);
      return { needsSync: true, latest_version: 0 };
    }
  };

  return {
    cached_employees,
    setCached_Employees,
    fetched_employee_pages,
    setFetched_Employee_Pages,
    saveEmployeesToStore,
    isIndexedDBLoaded,
    setIsIndexedDBLoaded,
    checkPageSync,
  };
};