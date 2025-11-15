import { openIndxDB } from "./openIndxDB.js";
// This replaces the entire array of objects with new data
export async function appendToIndexDB(storeName, newDataArray) {
  if (!Array.isArray(newDataArray)) {
    throw new Error("appendToIndexDB expects an array of objects");
  }

  const db = await openIndxDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);


      newDataArray.forEach((obj) => {
        store.add(obj);
      })

      transaction.oncomplete = () => {
        console.log(` Append ${storeName} with new data`);
        resolve(true);
      };

      transaction.onerror = () => {
        console.error(` Failed to append to ${storeName}:`, transaction.error);
        reject(transaction.error);
      }

  });
}