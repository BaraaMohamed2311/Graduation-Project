import { openIndxDB } from "./openIndxDB.js";
// ===================================
//        DELETE By Id 
// ===================================

export async function deleteRecordById(storeName, id) {
  const db = await openIndxDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
// ===================================
//        DELETE By Id 
// ===================================
export async function clearStore(storeName) {
  const db = await openIndxDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}