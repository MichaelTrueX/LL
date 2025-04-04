"use strict";

const DB_NAME = "WordsLogDB";
const DB_VERSION = 4; // bumped version to add userWordsStore
const STORE_NAME_LOG = "logStore";
// const STORE_NAME_DICTIONARY = "dictionaryStore";
const STORE_NAME_USERS = "usersStore";
const STORE_NAME_USER_WORDS = "userWordsStore";

// Initialize (or open) the IndexedDB database.
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!store.indexNames.contains("difficulty")) {
        store.createIndex("difficulty", "difficulty", { unique: false });
      }
      // Create log store if not exists.
      if (!db.objectStoreNames.contains(STORE_NAME_LOG)) {
        db.createObjectStore(STORE_NAME_LOG, { keyPath: "date" });
      }
      // Create dictionary store if not exists.
      if (!db.objectStoreNames.contains(STORE_NAME_DICTIONARY)) {
        db.createObjectStore(STORE_NAME_DICTIONARY, { keyPath: "tagalog" });
      }
      // Create users store if not exists.
      if (!db.objectStoreNames.contains(STORE_NAME_USERS)) {
        db.createObjectStore(STORE_NAME_USERS, { keyPath: "email" });
      }
      // Create user words store if not exists.
      if (!db.objectStoreNames.contains(STORE_NAME_USER_WORDS)) {
        // Use an auto-incrementing key for user words.
        db.createObjectStore(STORE_NAME_USER_WORDS, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = function(e) {
      resolve(e.target.result);
    };
    request.onerror = function(e) {
      reject(e.target.error);
    };
  });
}

// Function to add a word from the dictionary to the user's collection.
function addUserWord(userWordEntry) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(["userWordsStore"], "readwrite");
      const store = transaction.objectStore("userWordsStore");
      const req = store.add(userWordEntry);
      req.onsuccess = function(e) {
        resolve(e.target.result);
      };
      req.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(reject);
  });
}


// (Other functions remain unchanged…)
function getUserWords() {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(["userWordsStore"], "readonly");
      const store = transaction.objectStore("userWordsStore");
      const request = store.getAll();
      request.onsuccess = function(e) {
        resolve(e.target.result);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(err => reject(err));
  });
}

function getDictionaryEntries() {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(["dictionaryStore"], "readonly");
      const store = transaction.objectStore("dictionaryStore");
      const request = store.getAll();
      request.onsuccess = function(e) {
        resolve(e.target.result);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(err => reject(err));
  });
}


// ... (The rest of your DB functions for dictionary and logging remain the same.)


/* Initialize (or open) the IndexedDB database.
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      // Create log store if not exists
      if (!db.objectStoreNames.contains(STORE_NAME_LOG)) {
        db.createObjectStore(STORE_NAME_LOG, { keyPath: "date" });
      }
      // Create dictionary store if not exists.
      if (!db.objectStoreNames.contains(STORE_NAME_DICTIONARY)) {
        db.createObjectStore(STORE_NAME_DICTIONARY, { keyPath: "tagalog" });
      }
    };
    request.onsuccess = function(e) {
      resolve(e.target.result);
    };
    request.onerror = function(e) {
      reject(e.target.error);
    };
  });
}
*/

// Add a dictionary entry if it does not already exist.
function addDictionaryEntryIfNotExists(entry) {
  initDB().then(db => {
    const transaction = db.transaction([STORE_NAME_DICTIONARY], "readwrite");
    const store = transaction.objectStore(STORE_NAME_DICTIONARY);
    const request = store.get(entry.tagalog);
    request.onsuccess = function(e) {
      if (!e.target.result) {
        // No duplicate, add entry.
        const addRequest = store.add(entry);
        addRequest.onsuccess = function() {
          console.log("Added entry:", entry);
        };
        addRequest.onerror = function(e) {
          console.error("Error adding entry:", e.target.error);
        };
      } else {
        console.log("Duplicate found, skipping:", entry.tagalog);
      }
    };
    request.onerror = function(e) {
      console.error("Error checking for duplicate:", e.target.error);
    };
  }).catch(err => console.error("DB initialization error:", err));
}

// Update an existing dictionary entry.
function updateDictionaryEntry(entry) {
  initDB().then(db => {
    const transaction = db.transaction([STORE_NAME_DICTIONARY], "readwrite");
    const store = transaction.objectStore(STORE_NAME_DICTIONARY);
    store.put(entry);
    transaction.oncomplete = function() {
      console.log("Updated entry:", entry);
    };
    transaction.onerror = function(e) {
      console.error("Error updating entry:", e.target.error);
    };
  }).catch(err => console.error("DB initialization error:", err));
}

// Remove a dictionary entry by Tagalog word.
function removeDictionaryEntry(tagalogWord) {
  initDB().then(db => {
    const transaction = db.transaction([STORE_NAME_DICTIONARY], "readwrite");
    const store = transaction.objectStore(STORE_NAME_DICTIONARY);
    const request = store.delete(tagalogWord);
    request.onsuccess = function() {
      console.log("Deleted entry:", tagalogWord);
    };
    request.onerror = function(e) {
      console.error("Error deleting entry:", e.target.error);
    };
  }).catch(err => console.error("DB initialization error:", err));
}

// Retrieve all dictionary entries.
function getDictionaryEntries() {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([STORE_NAME_DICTIONARY], "readonly");
      const store = transaction.objectStore(STORE_NAME_DICTIONARY);
      const request = store.getAll();
      request.onsuccess = function(e) {
        resolve(e.target.result);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(err => {
      reject(err);
    });
  });
}

// Log the CSV load count for today (if not already logged).
function logCSVLoadIndexedDB(count) {
  const today = new Date().toISOString().slice(0, 10);
  initDB().then(db => {
    const transaction = db.transaction([STORE_NAME_LOG], "readwrite");
    const store = transaction.objectStore(STORE_NAME_LOG);
    const getRequest = store.get(today);
    getRequest.onsuccess = function(e) {
      if (!e.target.result) {
        // No record for today; add a new log entry.
        store.add({ date: today, count: count });
      }
    };
    getRequest.onerror = function(e) {
      console.error("Error checking log entry:", e.target.error);
    };
  }).catch(err => {
    console.error("Error initializing DB:", err);
  });
}

// Retrieve log data between two dates (YYYY-MM-DD strings).
function getLogDataIndexedDB(startDate, endDate) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([STORE_NAME_LOG], "readonly");
      const store = transaction.objectStore(STORE_NAME_LOG);
      const logData = [];
      const request = store.openCursor();
      request.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
          const record = cursor.value;
          if (record.date >= startDate && record.date <= endDate) {
            logData.push(record);
          }
          cursor.continue();
        } else {
          // Sort entries by date ascending.
          logData.sort((a, b) => a.date.localeCompare(b.date));
          resolve(logData);
        }
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(err => reject(err));
  });
}

// Helper to get log data for a given period ("week", "month", or "year").
function getLogDataForPeriod(period) {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  let startDate = new Date(today);
  if (period === "week") {
    startDate.setDate(today.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(today.getMonth() - 1);
  } else if (period === "year") {
    startDate.setFullYear(today.getFullYear() - 1);
  }
  const startDateStr = startDate.toISOString().slice(0, 10);
  return getLogDataIndexedDB(startDateStr, endDate);
}

function getDictionaryEntry(tagalog) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([STORE_NAME_DICTIONARY], "readonly");
      const store = transaction.objectStore(STORE_NAME_DICTIONARY);
      const request = store.get(tagalog);
      request.onsuccess = function(e) {
        resolve(e.target.result);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(err => reject(err));
  });
}
