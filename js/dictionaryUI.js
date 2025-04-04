"use strict";

/**
 * Updates the header element "dictStatus" to show the count of Dictionary entries.
 */
function updateDictionaryStatus() {
  getDictionaryEntries().then(entries => {
    const dictStatusEl = document.getElementById("dictStatus");
    dictStatusEl.textContent = "Words in Dictionary: " + (entries ? entries.length : 0);
  }).catch(err => {
    console.error("Error updating dictionary status:", err);
  });
}

/**
 * Updates the header element "wordStatus" to show the count of User Words.
 */
function updateUserWordsStatus() {
  getUserWords().then(entries => {
    const userWordsStatusEl = document.getElementById("wordStatus");
    userWordsStatusEl.textContent = "User Words: " + (entries ? entries.length : 0);
  }).catch(err => {
    console.error("Error updating user words status:", err);
  });
}

/**
 * Retrieves a single dictionary entry from the dictionaryStore by its Tagalog word.
 */
function getDictionaryEntry(tagalog) {
  return new Promise((resolve, reject) => {
    if (!tagalog || typeof tagalog !== "string" || tagalog.trim() === "") {
      reject(new Error("Invalid dictionary reference key"));
      return;
    }
    initDB().then(db => {
      const transaction = db.transaction([STORE_NAME_DICTIONARY], "readonly");
      const store = transaction.objectStore(STORE_NAME_DICTIONARY);
      const request = store.get(tagalog.trim());
      request.onsuccess = function(e) {
        resolve(e.target.result);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(err => reject(err));
  });
}

/**
 * Loads the "Dictionary" view.
 * Displays all dictionary entries in a table with one line per word.
 * Each row includes an "Add to My Words" button.
 */
function loadDictionary() {
  clearContent();
  // const content = document.getElementById("content");

  content.innerHTML = `

    <h2>Dictionary</h2>
      <select id="filterDifficulty">
      <option value="">All Levels</option>
      <option value="1">🟢 Beginner</option>
      <option value="2">🔵 Elementary</option>
      <option value="3">🟡 Intermediate</option>
      <option value="4">🟠 Upper-Intermediate</option>
      <option value="5">🔴 Advanced</option>
      <option value="6">🟣✨ Native/Idiomatic</option>
    </select>
    <input type="text" id="searchDictionary" placeholder="Search dictionary..." style="margin-bottom:10px; padding:5px; width:50%;">
    <div id="dictionaryList" style="overflow-x:auto;"></div>
    <input type="text" id="searchDictionary" placeholder="Search dictionary..." style="margin-bottom:10px; padding:5px; width:50%;">
    <button onclick="deleteEntireDictionary()" style="margin-bottom: 10px;">🗑️ Delete Dictionary</button>


    <div id="dictionaryList" style="overflow-x:auto;"></div>
  `;
  
  refreshDictionaryList();

  document.getElementById("searchDictionary").addEventListener("input", function() {
    refreshDictionaryList(this.value, document.getElementById("filterDifficulty").value);
  });
  document.getElementById("filterDifficulty").addEventListener("change", function() {
    refreshDictionaryList(document.getElementById("searchDictionary").value, this.value);
  });
}

function playAudio(src) {
  const audio = new Audio(src);
  audio.play();
}

  function refreshDictionaryList(filter = "", difficulty = "") {
    getDictionaryEntries().then(entries => {
      let html = "";
      if (!entries || entries.length === 0) {
        html = "<p>No dictionary entries found.</p>";
      } else {
        if (filter || difficulty) {
          entries = entries.filter(entry => {
            const match = entry.tagalog.toLowerCase().includes(filter.toLowerCase()) ||
                          entry.english.toLowerCase().includes(filter.toLowerCase());
            const levelMatch = !difficulty || String(entry.difficulty) === difficulty;
            return match && levelMatch;
          });
        }
        html = `<table style="width:100%; border-collapse:collapse; font-size:0.9em;">
        <tr>
          <th>Icon</th>
          <th>Tagalog</th>
          <th>English</th>
          <th>Example</th>
          <th>Example English</th>
          <th>Part of Speech</th>
          <th>Play</th>
        </tr>`;
        entries.forEach(entry => {
          html += `<tr>
  <td style="text-align:center;">
    <button onclick="handleAddWord('${encodeURIComponent(entry.tagalog)}')">Add</button>
  </td>
          <td>${entry.tagalog}</td>
          <td>${entry.english}</td>
          <td>${entry.example}</td>
          <td>${entry.exampleEnglish || ""}</td>
          <td>${entry.partOfSpeech || ""}</td>
          <td>
            ${entry.realAudio ? `<button onclick="playAudio('${entry.realAudio}')">🔊</button>` : ""}
          </td>
        </tr>`;
        });
        html += "</table>";
      }
      document.getElementById("dictionaryList").innerHTML = html;
    }).catch(err => {
      console.error("Error retrieving dictionary entries:", err);
      document.getElementById("dictionaryList").innerHTML = "<p>Error loading dictionary.</p>";
    });
  }

// Adds a dictionary word to the user's collection (userWordsStore) silently.
// Logs the process without user confirmation.
function addWordSilently(encodedTagalog) {
  const tagalogWord = decodeURIComponent(encodedTagalog).trim();
  console.log("Attempting to add word:", tagalogWord);
  
  getDictionaryEntries().then(entries => {
    // Case-insensitive match.
    const entry = entries.find(e => e.tagalog && e.tagalog.trim().toLowerCase() === tagalogWord.toLowerCase());
    if (entry) {
      let user = localStorage.getItem("currentUser");
      if (user) {
        user = JSON.parse(user);
        const userWordEntry = {
          dictionaryRef: entry.tagalog,
          knowledge: 1,
          username: user.username
        };
        addUserWord(userWordEntry).then(() => {
          updateUserWordsStatus();
          console.log("Word successfully added:", entry.tagalog);
        }).catch(err => {
          console.error("Error adding word:", err);
        });
      } else {
        alert("Please log in first.");
      }
    } else {
      console.error("Word not found in dictionary for:", tagalogWord);
    }
  }).catch(err => {
    console.error("Error retrieving dictionary entries:", err);
  });
}

/**
 * Called when the user clicks "Add to My Words" in the Dictionary view.
 * Creates a new record in the userWordsStore containing:
 *   - dictionaryRef: the Tagalog word (reference to the dictionary entry)
 *   - knowledge: a default value (1)
 *   - username: the current user's username.
 */
function handleAddWord(encodedTagalog) {
  const tagalogWord = decodeURIComponent(encodedTagalog);
  getDictionaryEntries().then(entries => {
    const entry = entries.find(e => e.tagalog === tagalogWord);
    if (entry) {
      let user = localStorage.getItem("currentUser");
      if (user) {
        user = JSON.parse(user);
        const userWordEntry = {
          dictionaryRef: entry.tagalog, // store only the reference
          knowledge: 1,                 // default knowledge level
          username: user.username
        };
        addUserWord(userWordEntry).then(id => {
          alert("Word added to your collection!");
          updateUserWordsStatus();
        }).catch(err => {
          console.error("Error adding word:", err);
          alert("Failed to add word.");
        });
      } else {
        alert("Please log in first.");
      }
    } else {
      alert("Word not found in dictionary.");
    }
  }).catch(err => {
    console.error("Error retrieving dictionary entries:", err);
    alert("Error retrieving dictionary entries.");
  });
}

/**
 * Loads the "User Words" view.
 * Displays the user's added words from userWordsStore in a table.
 * The table shows only Tagalog (dictionary reference), Knowledge Level, and Added By.
 */
function loadUserWordsUI() {
  clearContent();
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>User Words</h2>
    <input type="text" id="searchUserWords" placeholder="Search your words..." style="margin-bottom:10px; padding:5px; width:50%;"/>
    <button id="addWordBtn">Add New Word</button>
    <div id="userWordsList"></div>
  `;
  
  function refreshUserWordsList(filter = "") {
    Promise.all([getUserWords(), getDictionaryEntries()]).then(([userWords, dictEntries]) => {
      const dictLookup = {};
      dictEntries.forEach(entry => {
        dictLookup[entry.tagalog.trim().toLowerCase()] = entry;
      });
      
      let html = "";
      if (!userWords || userWords.length === 0) {
        html = "<p>You haven't added any words yet.</p>";
      } else {
        if (filter) {
          userWords = userWords.filter(entry => {
            const key = entry.dictionaryRef ? entry.dictionaryRef.trim().toLowerCase() : "";
            const dictEntry = dictLookup[key] || {};
            return (dictEntry.tagalog && dictEntry.tagalog.toLowerCase().includes(filter.toLowerCase()));
          });
        }
        // Build table without "Remove Props" column and with inline knowledge update.
        html = "<table style='width:100%; border-collapse:collapse;'>";
        html += "<tr><th>Tagalog</th><th>Knowledge Level</th><th>Added By</th><th>Actions</th></tr>";
        userWords.forEach(entry => {
          const key = entry.dictionaryRef ? entry.dictionaryRef.trim().toLowerCase() : "";
          const dictEntry = dictLookup[key] || {};
          html += `<tr>
                    <td>${dictEntry.tagalog || entry.dictionaryRef}</td>
                    <td>
                      <input type="number" value="${entry.knowledge}" min="1" max="5" data-id="${entry.id}" class="knowledgeInput" style="width:50px;">
                    </td>
                    <td>${entry.username}</td>
                    <td>
                      <button onclick="editUserWord(${entry.id})" style="padding:4px 8px;">Edit</button>
                      <button onclick="deleteUserWord(${entry.id})" style="padding:4px 8px;">Delete</button>
                    </td>
                  </tr>`;
        });
        html += "</table>";
      }
      document.getElementById("userWordsList").innerHTML = html;
      
      // Attach event listeners for inline knowledge level updates.
      document.querySelectorAll(".knowledgeInput").forEach(input => {
        input.addEventListener("change", function() {
          const newLevel = parseInt(this.value);
          const id = parseInt(this.getAttribute("data-id"));
          updateKnowledgeLevel(id, newLevel);
        });
      });
    }).catch(err => {
      console.error("Error retrieving user words:", err);
      document.getElementById("userWordsList").innerHTML = "<p>Error loading your words.</p>";
    });
  }
  
  refreshUserWordsList();
  document.getElementById("searchUserWords").addEventListener("input", function() {
    refreshUserWordsList(this.value);
  });
  document.getElementById("addWordBtn").addEventListener("click", function() {
    showEditUserWordForm();
  });
}

function updateKnowledgeLevel(id, newLevel) {
  initDB().then(db => {
    const transaction = db.transaction(["userWordsStore"], "readwrite");
    const store = transaction.objectStore("userWordsStore");
    const req = store.get(id);
    req.onsuccess = function(e) {
      const entry = e.target.result;
      if (entry) {
        entry.knowledge = newLevel;
        const updateReq = store.put(entry);
        updateReq.onsuccess = function() {
          console.log("Updated knowledge level for id " + id + " to " + newLevel);
          updateUserWordsStatus();
        };
        updateReq.onerror = function(e) {
          console.error("Error updating knowledge level:", e.target.error);
        };
      }
    };
    req.onerror = function(e) {
      console.error("Error retrieving record for knowledge update:", e.target.error);
    };
  }).catch(err => {
    console.error("Error initializing DB for knowledge update:", err);
  });
}


/**
 * Loads an edit form for a user word.
 * Allows editing of the dictionary reference and the knowledge level.
 */
function showEditUserWordForm(existingEntry) {
  clearContent();
  const content = document.getElementById("content");
  const isNew = !existingEntry;
  content.innerHTML = `
    <h2>${isNew ? "Add New Word" : "Edit Word"}</h2>
    <form id="userWordForm">
      <label>Dictionary Reference (Tagalog): 
        <input type="text" name="dictionaryRef" value="${existingEntry ? existingEntry.dictionaryRef : ""}" ${isNew ? "" : "readonly"}/>
      </label><br>
      <label>Knowledge Level (1-5): 
        <input type="number" name="knowledge" value="${existingEntry ? existingEntry.knowledge : "1"}" min="1" max="5" required/>
      </label><br>
      <button type="submit">${isNew ? "Add" : "Update"}</button>
      <button type="button" id="cancelBtn">Cancel</button>
    </form>
  `;
  
  document.getElementById("userWordForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newEntry = {
      dictionaryRef: isNew ? formData.get("dictionaryRef").trim() : existingEntry.dictionaryRef,
      knowledge: parseInt(formData.get("knowledge")),
      username: existingEntry ? existingEntry.username : (localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")).username : "Unknown")
    };
    if (isNew) {
      addUserWord(newEntry).then(id => {
        alert("Word added.");
        loadUserWordsUI();
        updateUserWordsStatus();
      }).catch(err => {
        console.error("Error adding word:", err);
        alert("Failed to add word.");
      });
    } else {
      newEntry.id = existingEntry.id;
      initDB().then(db => {
        const transaction = db.transaction(["userWordsStore"], "readwrite");
        const store = transaction.objectStore("userWordsStore");
        store.put(newEntry);
        transaction.oncomplete = function() {
          alert("Word updated.");
          loadUserWordsUI();
          updateUserWordsStatus();
        };
        transaction.onerror = function(e) {
          console.error("Error updating word:", e.target.error);
          alert("Failed to update word.");
        };
      });
    }
  });
  
  document.getElementById("cancelBtn").addEventListener("click", function() {
    loadUserWordsUI();
  });
}

/**
 * Deletes unwanted properties from a user word record.
 */
function removePropertiesFromUserWord(id) {
  initDB().then(db => {
    const transaction = db.transaction(["userWordsStore"], "readwrite");
    const store = transaction.objectStore("userWordsStore");
    const req = store.get(id);
    req.onsuccess = function(e) {
      const record = e.target.result;
      if (record) {
        // Remove unwanted properties
        delete record.english;
        delete record.example;
        delete record.exampleEnglish;
        // Update the record in the database
        const updateReq = store.put(record);
        updateReq.onsuccess = function() {
          alert("Extra properties removed from record " + id);
          loadUserWordsUI();
          updateUserWordsStatus();
        };
        updateReq.onerror = function(e) {
          console.error("Error updating record:", e.target.error);
          alert("Failed to update record.");
        };
      } else {
        alert("Record not found.");
      }
    };
    req.onerror = function(e) {
      console.error("Error retrieving record:", e.target.error);
      alert("Failed to retrieve record.");
    };
  }).catch(err => {
    console.error("Error initializing DB:", err);
    alert("Database initialization error: " + err);
  });
}

// Expose edit, delete, and remove properties functions globally.
window.editUserWord = editUserWord;
window.deleteUserWord = deleteUserWord;
window.removePropertiesFromUserWord = removePropertiesFromUserWord;

/**
 * Retrieves user words from the userWordsStore.
 */
function getUserWords() {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(["userWordsStore"], "readonly");
      const store = transaction.objectStore("userWordsStore");
      const req = store.getAll();
      req.onsuccess = function(e) {
        resolve(e.target.result);
      };
      req.onerror = function(e) {
        reject(e.target.error);
      };
    }).catch(err => reject(err));
  });
}

// Define editUserWord if not already defined
function editUserWord(id) {
  initDB().then(db => {
    const transaction = db.transaction(["userWordsStore"], "readonly");
    const store = transaction.objectStore("userWordsStore");
    const req = store.get(id);
    req.onsuccess = function(e) {
      const entry = e.target.result;
      if (entry) {
        showEditUserWordForm(entry);
      } else {
        alert("Word not found.");
      }
    };
    req.onerror = function(e) {
      console.error("Error retrieving word:", e.target.error);
    };
  }).catch(err => {
    console.error("Error initializing DB:", err);
  });
}

// Deletes a word from the userWordsStore silently.
function deleteUserWord(id) {
  initDB().then(db => {
    const transaction = db.transaction(["userWordsStore"], "readwrite");
    const store = transaction.objectStore("userWordsStore");
    const req = store.delete(id);
    req.onsuccess = function() {
      // No confirmation or alert; just refresh the view.
      loadUserWordsUI();
      updateUserWordsStatus();
    };
    req.onerror = function(e) {
      console.error("Error deleting word:", e.target.error);
    };
  }).catch(err => {
    console.error("Error initializing DB for deletion:", err);
  });
}


// Removes extra properties from a user word record silently.
function removePropertiesFromUserWord(id) {
  initDB().then(db => {
    const transaction = db.transaction(["userWordsStore"], "readwrite");
    const store = transaction.objectStore("userWordsStore");
    const req = store.get(id);
    req.onsuccess = function(e) {
      const record = e.target.result;
      if (record) {
        // Remove unwanted properties.
        delete record.english;
        delete record.example;
        delete record.exampleEnglish;
        const updateReq = store.put(record);
        updateReq.onsuccess = function() {
          // Refresh view without any popup.
          loadUserWordsUI();
          updateUserWordsStatus();
        };
        updateReq.onerror = function(e) {
          console.error("Error updating record:", e.target.error);
        };
      }
    };
    req.onerror = function(e) {
      console.error("Error retrieving record:", e.target.error);
    };
  }).catch(err => {
    console.error("Error initializing DB:", err);
  });
}


function showDictionary() {
  loadDictionary();
}
window.showDictionary = showDictionary; // Expose it globally


// Attach functions to the global object so that inline onclick handlers can find them:
window.editUserWord = editUserWord;
window.deleteUserWord = deleteUserWord;
window.removePropertiesFromUserWord = removePropertiesFromUserWord;


/**
 * Helper function to clear the content of the "content" section.
 */
function clearContent() {
  document.getElementById("content").innerHTML = "";
}

window.loadDictionary = loadDictionary;
window.updateDictionaryStatus = updateDictionaryStatus;
window.updateUserWordsStatus = updateUserWordsStatus;
window.addWordSilently = addWordSilently;

// Optionally, expose these functions globally (if needed)
window.editUserWord = editUserWord;
window.deleteUserWord = deleteUserWord;
window.removePropertiesFromUserWord = removePropertiesFromUserWord;
window.deleteEntireDictionary = deleteEntireDictionary;