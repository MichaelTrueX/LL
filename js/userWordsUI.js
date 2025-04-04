"use strict";

function loadUserWordsUI() {
  clearContent();
  const container = document.getElementById('gameContent');
  container.innerHTML = `
    <h2>User Words</h2>
    <input type="text" id="searchUserWords" placeholder="Search your words..." style="margin-bottom:10px; padding:5px; width:50%;"/>
    <button id="addWordBtn">Add New Word</button>
    <div id="userWordsList"></div>
  `;
  
  function refreshUserWordsList(filter = "") {
    Promise.all([getUserWords(), getDictionaryEntries()]).then(([userWords, dictEntries]) => {
      // Build a lookup map for dictionary entries by their normalized tagalog value.
      const dictLookup = {};
      dictEntries.forEach(entry => {
        // Normalize the key: trim and convert to lower case.
        dictLookup[entry.tagalog.trim().toLowerCase()] = entry;
      });
      
      console.log("Dictionary Lookup:", dictLookup);  // Debug log
      
      let html = "";
      if (!userWords || userWords.length === 0) {
        html = "<p>You haven't added any words yet.</p>";
      } else {
        if (filter) {
          userWords = userWords.filter(entry => {
            // Normalize the user word reference before comparing.
            const key = entry.dictionaryRef ? entry.dictionaryRef.trim().toLowerCase() : "";
            const dictEntry = dictLookup[key] || {};
            return (dictEntry.tagalog && dictEntry.tagalog.toLowerCase().includes(filter.toLowerCase())) ||
                   (dictEntry.english && dictEntry.english.toLowerCase().includes(filter.toLowerCase()));
          });
        }
        html = "<table style='width:100%; border-collapse:collapse;'>";
        html += "<tr><th>Tagalog</th><th>English</th><th>Example</th><th>Example (English)</th><th>Knowledge Level</th><th>Added By</th><th>Actions</th></tr>";
        userWords.forEach(entry => {
          // Normalize the dictionary reference.
          const key = entry.dictionaryRef ? entry.dictionaryRef.trim().toLowerCase() : "";
          const dictEntry = dictLookup[key] || {};
          html += `<tr>
                    <td>${dictEntry.tagalog || entry.dictionaryRef}</td>
                    <td>${dictEntry.english || ""}</td>
                    <td>${dictEntry.example || ""}</td>
                    <td>${dictEntry.exampleEnglish || ""}</td>
                    <td>${entry.knowledge}</td>
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
    showEditUserWordForm(); // Open form for manually adding a new user word.
  });
}

function editUserWord(id) {
  initDB().then(db => {
    const transaction = db.transaction(["userWordsStore"], "readonly");
    const store = transaction.objectStore("userWordsStore");
    const request = store.get(id);
    request.onsuccess = function(e) {
      const entry = e.target.result;
      if (entry) {
        showEditUserWordForm(entry);
      } else {
        alert("Word not found.");
      }
    };
    request.onerror = function(e) {
      console.error("Error retrieving word:", e.target.error);
    };
  });
}

function deleteUserWord(id) {
  initDB().then(db => {
    const transaction = db.transaction([STORE_NAME_USER_WORDS], "readwrite");
    const store = transaction.objectStore("userWordsStore");
    const req = store.delete(id);
    req.onsuccess = function() {
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






function showEditUserWordForm(entry) {
  clearContent();
  const container = document.getElementById('gameContent');
  container.innerHTML = `
    <h2>Edit Word</h2>
    <form id="editUserWordForm">
      <label>Tagalog: <input type="text" name="tagalog" value="${entry.tagalog}" readonly></label><br>
      <label>English: <input type="text" name="english" value="${entry.english}" required></label><br>
      <label>Example: <input type="text" name="example" value="${entry.example}" required></label><br>
      <label>Example (English): <input type="text" name="exampleEnglish" value="${entry.exampleEnglish || ""}" required></label><br>
      <button type="submit">Update</button>
      <button type="button" id="cancelEditBtn">Cancel</button>
    </form>
  `;
  document.getElementById("editUserWordForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedEntry = {
      id: entry.id,
      tagalog: entry.tagalog,
      english: formData.get("english").trim(),
      example: formData.get("example").trim(),
      exampleEnglish: formData.get("exampleEnglish").trim(),
      username: entry.username
    };
    initDB().then(db => {
      const transaction = db.transaction(["userWordsStore"], "readwrite");
      const store = transaction.objectStore("userWordsStore");
      store.put(updatedEntry);
      transaction.oncomplete = function() {
        alert("Word updated.");
        loadUserWordsUI();
      };
      transaction.onerror = function(e) {
        console.error("Error updating word:", e.target.error);
      };
    });
  });
  document.getElementById("cancelEditBtn").addEventListener("click", function() {
    loadUserWordsUI();
  });
}

// Assume getUserWords() is defined in db.js:
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

