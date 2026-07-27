import { Hymn } from "../types";

const DB_NAME = "ChoirVoiceMixerDB";
const DB_VERSION = 3;
const STORE_NAME = "hymns";
const AUDIO_STORE = "audio";

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      dbInstance = db;

      try {
        await migrateIfNeeded(db);
      } catch (err) {
        console.warn("[DB] Audio migration skipped:", err);
      }

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE);
        }
      }

      if (oldVersion < 3) {
        if (db.objectStoreNames.contains(AUDIO_STORE)) {
          db.deleteObjectStore(AUDIO_STORE);
        }
        db.createObjectStore(AUDIO_STORE);
      }
    };
  });
}

async function migrateIfNeeded(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const hymns = req.result as Hymn[];
      const needsMigration = hymns.some((h) =>
        h.voices?.some((v) => v.audioData)
      );

      if (!needsMigration) {
        resolve();
        return;
      }

      const tx2 = db.transaction([STORE_NAME, AUDIO_STORE], "readwrite");
      const hymnStore = tx2.objectStore(STORE_NAME);
      const audioStore = tx2.objectStore(AUDIO_STORE);

      for (const hymn of hymns) {
        if (!hymn.voices) continue;

        for (const voice of hymn.voices) {
          if (voice.audioData) {
            audioStore.put(abToB64(voice.audioData), `${hymn.id}_${voice.id}`);
          }
        }

        hymnStore.put({
          ...hymn,
          voices: hymn.voices.map((v) => ({ ...v, audioData: undefined })),
          sheetData: undefined,
        });
      }

      tx2.oncomplete = () => resolve();
      tx2.onerror = () => reject(tx2.error);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function getAllHymns(): Promise<Hymn[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as Hymn[]);
    };

    request.onerror = () => {
      reject(new Error("Failed to fetch hymns from database"));
    };
  });
}

function abToB64(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToAb(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function saveHymn(hymn: Hymn): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_NAME, AUDIO_STORE],
      "readwrite"
    );
    const store = transaction.objectStore(STORE_NAME);
    const audioStore = transaction.objectStore(AUDIO_STORE);

      if (hymn.voices) {
        for (const voice of hymn.voices) {
          if (voice.audioData) {
            audioStore.put(abToB64(voice.audioData), `${hymn.id}_${voice.id}`);
          }
        }
      }

      const hymnCopy = {
        ...hymn,
        voices: hymn.voices?.map((v) => ({ ...v, audioData: undefined })),
        sheetData: undefined,
      };

    const request = store.put(hymnCopy);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save hymn: ${hymn.name}`));
    };
  });
}

export async function saveHymnMeta(hymn: Hymn): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const hymnCopy = {
      ...hymn,
      voices: hymn.voices?.map((v) => ({ ...v, audioData: undefined })),
      sheetData: undefined,
    };

    const request = store.put(hymnCopy);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save hymn metadata: ${hymn.name}`));
    };
  });
}

export async function loadVoiceAudio(
  hymnId: string,
  voiceId: string
): Promise<ArrayBuffer | undefined> {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(AUDIO_STORE, "readonly");
    const store = tx.objectStore(AUDIO_STORE);
    const req = store.get(`${hymnId}_${voiceId}`);
    req.onsuccess = () => {
      const val = req.result;
      if (typeof val === "string") resolve(b64ToAb(val));
      else resolve(val);
    };
    req.onerror = () => resolve(undefined);
  });
}

export async function deleteHymn(id: string): Promise<void> {
  const db = await initDB();

  const existing = await new Promise<any>((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_NAME, AUDIO_STORE],
      "readwrite"
    );
    const store = transaction.objectStore(STORE_NAME);
    const audioStore = transaction.objectStore(AUDIO_STORE);

    if (existing?.voices) {
      for (const voice of existing.voices) {
        audioStore.delete(`${id}_${voice.id}`);
      }
    }

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete hymn with id: ${id}`));
    };
  });
}
