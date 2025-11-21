// hooks/useBookingListCache.js
import { useState, useEffect } from "react";
import { getAllFromStore } from "@/utils/indexDB/getCacheMethods";
import { appendToIndexDB } from "@/utils/indexDB/appendToIndexDB";
import { clearStore } from "@/utils/indexDB/deleteCacheMethods";
import { globally_mapped_booking_stores } from "@/global_data";
// If you update this you have to update the IndexedDB stores names in openIndxDB.js to create them first
const MapTargetToStoreName = globally_mapped_booking_stores;

const InitialFetchedPages = {
  doctors: new Set(),
  surgeons: new Set()
};

export const useBookingListCache = () => {
  const initialBookingList = Object.keys(MapTargetToStoreName).reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});

  const [cached_booking_list, setCached_Booking_List] = useState(initialBookingList);
  const [fetched_booking_pages, setFetched_Booking_Pages] = useState(InitialFetchedPages);
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState(false);

   // Save specific target data to IndexedDB
  const saveSpecificToStore = async (bookingList, target) => {
    try {
      // get store name "booking-doctors" , "booking-surgeons"
      console.log("Saving booking list to store for target:", bookingList, target);
      const storeName = MapTargetToStoreName[target];
      if (!storeName) {
        throw new Error(`Invalid target: ${target}`);
      }

      if (Array.isArray(bookingList) && bookingList.length > 0) {
        await appendToIndexDB(storeName, bookingList);
      } else {
        await clearStore(storeName);
      }
    } catch (err) {
      console.error(`Failed to save cached booking list for ${target}:`, err);
      throw err;
    }
  };

  // Load all data from IndexedDB | We need to load it using this function as it's data in seperate stores `booking-doctors`, `booking-surgeons`
  const loadAllBookingsFromStore = async () => {
    try {
      const loadPromises = Object.entries(MapTargetToStoreName).map(async ([key, storeName]) => {
        const storedData = await getAllFromStore(storeName);
        return [key, Array.isArray(storedData) ? storedData : []];
      });
      const loadedData = await Promise.all(loadPromises);
      return Object.fromEntries(loadedData);
    } catch (err) {
      console.error("Failed to load all booking lists from IndexedDB:", err);
      return initialBookingList;
    }
  };

  

  // Load from IndexedDB
  useEffect(() => {
    (async () => {
      const loadedData = await loadAllBookingsFromStore();
      setCached_Booking_List(loadedData);
      // After we try loading, set the flag to true
      setIsIndexedDBLoaded(true);
    })();
  }, []);

  // Load fetched pages from localStorage
useEffect(() => {
  try {
    const storedPages = localStorage.getItem("fetched_booking_pages");
    if (storedPages && storedPages !== "undefined" && storedPages !== "null") {
      const parsedPages = JSON.parse(storedPages);
      
      // Handle both old format (array) and new format (object with Sets)
      if (typeof parsedPages === 'object' && parsedPages !== null) {
        // New format: { doctors: [...], surgeons: [...] }
        const restoredPages = {};
        Object.keys(InitialFetchedPages).forEach(target => {
          restoredPages[target] = new Set(parsedPages[target] || []);
        });
        setFetched_Booking_Pages(restoredPages);
      } else if (Array.isArray(parsedPages)) {
        // Old format: array - migrate to new format
        const migratedPages = {};
        Object.keys(InitialFetchedPages).forEach(target => {
          migratedPages[target] = new Set(parsedPages); // Put old array in all targets
        });
        setFetched_Booking_Pages(migratedPages);
        
        // Update localStorage with new format
        localStorage.setItem("fetched_booking_pages", JSON.stringify(
          Object.fromEntries(
            Object.entries(migratedPages).map(([key, set]) => [key, [...set]])
          )
        ));
      } else {
        localStorage.removeItem("fetched_booking_pages");
      }
    }
  } catch (err) {
    console.error("Failed to parse fetched_booking_pages:", err);
    localStorage.removeItem("fetched_booking_pages");
  }
}, []);

// Persist fetched pages
useEffect(() => {
  try {
    if (fetched_booking_pages && Object.keys(fetched_booking_pages).length > 0) {
      // Convert Sets to arrays for JSON serialization
      const serializablePages = {};
      Object.entries(fetched_booking_pages).forEach(([target, pageSet]) => {
        serializablePages[target] = pageSet && pageSet.size > 0 ? [...pageSet] : [];
      });
      
      localStorage.setItem(
        "fetched_booking_pages",
        JSON.stringify(serializablePages)
      );
    } else {
      localStorage.removeItem("fetched_booking_pages");
    }
  } catch (err) {
    console.error("Failed to save fetched_booking_pages:", err);
  }
}, [fetched_booking_pages]);

  return {
    cached_booking_list,
    setCached_Booking_List,
    fetched_booking_pages,
    setFetched_Booking_Pages,
    saveSpecificToStore,
    isIndexedDBLoaded, 
    setIsIndexedDBLoaded
  };
};

export { MapTargetToStoreName };