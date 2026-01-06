const DB_NAME = "vessel_vectors";
const STORE = "embeddings";

function openDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "url" });
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function saveEmbedding(url, vector) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put({ url, vector });
}

export async function getEmbedding(url) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  return tx.objectStore(STORE).get(url);
}
