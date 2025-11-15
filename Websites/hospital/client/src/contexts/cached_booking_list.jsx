"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { updateStoreData } from "@/utils/indexDB/updateCacheMethods";
import { clearStore } from "@/utils/indexDB/deleteCacheMethods";

const cached_booking_list_context = createContext();

const useCachedBookingListContext = function() {
  return useContext(cached_booking_list_context);
};

// Configuration for all supported object types
const OBJECT_TYPES = {
  doctors: "doctors",
  surgeons: "surgeons"

};

function CachedBookingListProvider({ children }) {
  // Initialize with all object types as empty arrays
  const initialBookingList = Object.keys(OBJECT_TYPES).reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});

  const [cached_booking_list, setCached_Booking_List] = useState(initialBookingList);
  const [fetched_booking_pages, setFetched_Booking_Pages] = useState(new Set());

  // ===============================
  // Generic function to save object types to IndexedDB
  // ===============================
  const saveObjectTypesToStore = async (bookingList) => {
    try {
      // Process all object types in parallel
      const savePromises = Object.entries(OBJECT_TYPES).map(async ([key, storeName]) => {
        const dataArray = bookingList[key];
        
        if (Array.isArray(dataArray) && dataArray.length > 0) {
          await updateStoreData(storeName, dataArray);
        } else {
          await clearStore(storeName);
        }
      });

      await Promise.all(savePromises);
    } catch (err) {
      console.error("Failed to save cached booking lists:", err);
      throw err; // Re-throw to handle in calling code if needed
    }
  };

  // ===============================
  // Generic function to load object types from IndexedDB
  // ===============================
  const loadObjectTypesFromStore = async () => {
    try {
      const loadPromises = Object.entries(OBJECT_TYPES).map(async ([key, storeName]) => {
        const storedData = await getAllFromStore(storeName);
        return [key, Array.isArray(storedData) ? storedData : []];
      });

      const loadedData = await Promise.all(loadPromises);
      return Object.fromEntries(loadedData);
    } catch (err) {
      console.error("Failed to load booking lists from IndexedDB:", err);
      return initialBookingList;
    }
  };

  // ===============================
  // Load cached_booking_list (from IndexedDB)
  // ===============================
  useEffect(() => {
    (async () => {
      const loadedData = await loadObjectTypesFromStore();
      setCached_Booking_List(loadedData);
    })();
  }, []);

  // ===============================
  // Load fetched_booking_pages (from localStorage)
  // ===============================
  useEffect(() => {
    try {
      const storedPages = localStorage.getItem("fetched_booking_pages");
      if (storedPages && storedPages !== "undefined" && storedPages !== "null") {
        const parsedPages = JSON.parse(storedPages);
        if (Array.isArray(parsedPages)) {
          setFetched_Booking_Pages(new Set(parsedPages));
        } else {
          localStorage.removeItem("fetched_booking_pages");
        }
      }
    } catch (err) {
      console.error("Failed to parse fetched_booking_pages:", err);
      localStorage.removeItem("fetched_booking_pages");
    }
  }, []);

  // ===============================
  // Persist fetched pages when updated
  // ===============================
  useEffect(() => {
    try {
      if (fetched_booking_pages && fetched_booking_pages.size > 0) {
        localStorage.setItem(
          "fetched_booking_pages",
          JSON.stringify([...fetched_booking_pages])
        );
      } else {
        localStorage.removeItem("fetched_booking_pages");
      }
    } catch (err) {
      console.error("Failed to save fetched_booking_pages:", err);
    }
  }, [fetched_booking_pages]);

  return (
    <cached_booking_list_context.Provider 
      value={{ 
        cached_booking_list, 
        setCached_Booking_List,
        fetched_booking_pages, 
        setFetched_Booking_Pages,
        saveObjectTypesToStore // Export if needed elsewhere
      }}
    >
      {children}
    </cached_booking_list_context.Provider>
  );
}

export { useCachedBookingListContext, CachedBookingListProvider, OBJECT_TYPES };