// ===================================
//        Update By Id 
// ===================================
export async function updateRecordById(storeName, updatedRecord) {
  const db = await openIndxDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(updatedRecord);
    req.onsuccess = () => resolve(updatedRecord.id || null); // returns id of updated record to be synced
    req.onerror = () => reject(req.error);
  });
}

// ===================================
//        Update By Field 
// ===================================
export async function updateRecordByField(storeName, field, value, updatedFields) {
  const db = await openIndxDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.openCursor();


    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value[field] === value) {
          const updatedRecord = { ...cursor.value, ...updatedFields };
          cursor.update(updatedRecord);

        }
        cursor.continue();
      } else {
        resolve(updatedRecord.id || null); // returns id of updated record to be synced
      }
    };

    request.onerror = () => reject(request.error);
  });
}