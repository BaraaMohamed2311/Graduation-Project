import {openIndxDB} from "./openIndxDB"
export async function getCachedUserImage(email) {
  const db = await openIndxDB();
  return new Promise((resolve) => {
    const tx = db.transaction("user_images", "readonly");
    const store = tx.objectStore("user_images");
    const req = store.get(email);

    req.onsuccess = () => resolve(req.result?.dataURL || null);
    req.onerror = () => resolve(null);
  });
}

export async function cacheUserImage(email, dataURL) {
  const db = await openIndxDB();
  return new Promise((resolve) => {
    const tx = db.transaction("user_images", "readwrite");
    const store = tx.objectStore("user_images");
    store.put({ email, dataURL });
    tx.oncomplete = () => resolve(true);
  });
}
