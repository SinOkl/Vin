// Enkel promise-basert IndexedDB-wrapper for vinkjeller-appen.
const DB_NAME = 'vinkjeller-db';
const DB_VERSION = 1;
const STORE = 'viner';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('navn', 'navn', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

export const VinDB = {
  async alle() {
    const store = await tx(STORE, 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async hent(id) {
    const store = await tx(STORE, 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async lagre(vin) {
    const store = await tx(STORE, 'readwrite');
    const now = Date.now();
    if (!vin.id) {
      vin.opprettet = now;
    }
    vin.oppdatert = now;
    return new Promise((resolve, reject) => {
      const req = store.put(vin);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async slett(id) {
    const store = await tx(STORE, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async slettAlt() {
    const store = await tx(STORE, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async importer(viner) {
    const store = await tx(STORE, 'readwrite');
    return new Promise((resolve, reject) => {
      let count = 0;
      for (const vin of viner) {
        const kopi = { ...vin };
        delete kopi.id; // unngå id-kollisjon, la autoincrement lage ny id
        store.put(kopi);
        count++;
      }
      store.transaction.oncomplete = () => resolve(count);
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  },
};
