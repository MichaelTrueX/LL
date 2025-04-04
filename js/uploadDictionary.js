"use strict";

const STORE_NAME_DICTIONARY = "dictionaryStore";

// const STORE_NAME_DICTIONARY = "dictionaryStore";
// A basic harmful-word checker. Expand as needed.
function isHarmful(text) {
  const lower = text.toLowerCase();
  return lower.includes("badword");
}

/* function loadDictionaryCSVFromParent() {
  Papa.parse("../tagalog_words_loader1.csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      if (results.data && results.data.length > 0) {
        const dictionaryData = results.data.map(row => ({
          tagalog: row["Filippino Word"]?.trim() || "",
          english: row["English Word"]?.trim() || "",
          example: row["Example Context"]?.trim() || "",
          exampleEnglish: row["Example (English)"]?.trim() || "",
          pronunciation: row["Pronuncation"]?.trim() || "",
          difficulty: parseInt(row["Difficulty Level"]),
          icon: row["Icon"]?.trim() || "",
          realAudio: row["Real Audio"]?.trim() || "",
          partOfSpeech: row["Part of Speech"]?.trim() || ""
        })).filter(item => item.tagalog !== "");

        initDB().then(db => {
          const tx = db.transaction([STORE_NAME_DICTIONARY], "readwrite");
          const store = tx.objectStore(STORE_NAME_DICTIONARY);
          dictionaryData.forEach(item => store.put(item));
          tx.oncomplete = () => {
            alert("Dictionary loaded successfully from CSV.");
            updateDictionaryStatus();
          };
          tx.onerror = e => {
            console.error("Error storing dictionary data:", e.target.error);
            alert("Error storing dictionary data.");
          };
        });
      } else {
        alert("CSV file appears to be empty or invalid.");
      }
    },
    error: function(err) {
      console.error("Error parsing CSV:", err);
      alert("Error loading CSV file automatically. Please upload manually.");
      showCSVUploadPrompt();
    }
  });
}


function showCSVUploadPrompt() {
  // Show a file input prompt for manual CSV upload.
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Upload Dictionary CSV Manually</h2>
    <p>Please select your CSV file.</p>
    <input type="file" id="csvFileInput" accept=".csv">
  `;
  document.getElementById("csvFileInput").addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      loadDictionaryCSVFile(file);
    }
  });
}

*/

function loadDictionaryCSVFile(file) {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      const headers = results.meta.fields.map(h => h.trim());
      console.log("Parsed Headers:", headers);

      if (results.data && results.data.length > 0) {
        let successCount = 0;
        let failureCount = 0;
        let harmfulCount = 0;
        let emptyTagalogCount = 0;

        const cleanedData = results.data.map(row => {
          const cleanRow = {};
          headers.forEach(h => {
            cleanRow[h] = row[h] !== undefined ? String(row[h]).trim() : "";
          });
          return cleanRow;
        }).filter(row => row["Filippino Word"]);

        const dictionaryData = cleanedData.map(row => {
          const tagalog = row["Filippino Word"];
          const english = row["English Word"];
          const example = row["Example Context"];
          const exampleEnglish = row["Example English"];

          if (!tagalog) {
            emptyTagalogCount++;
            failureCount++;
            return null;
          }

          if (!english || !example || !exampleEnglish) {
            failureCount++;
            return null;
          }

          if (isHarmful(tagalog) || isHarmful(english) || isHarmful(example) || isHarmful(exampleEnglish)) {
            harmfulCount++;
            failureCount++;
            return null;
          }

          successCount++;
          return {
            tagalog,
            english,
            example,
            exampleEnglish,
            pronunciation: row["Pronunciation"] || "",
            difficulty: parseInt(row["Difficulty Level"]) || 0,
            icon: row["Icon"] || "",
            realAudio: row["Real Audio"] || "",
            partOfSpeech: row["Part of Speech"] || ""
          };
        }).filter(entry => entry);

        initDB().then(db => {
          const tx = db.transaction([STORE_NAME_DICTIONARY], "readwrite");
          const store = tx.objectStore(STORE_NAME_DICTIONARY);
          dictionaryData.forEach(item => store.put(item));
          tx.oncomplete = () => {
            const resultDiv = document.getElementById("uploadResult");
            if (resultDiv) {
              resultDiv.innerHTML =
                `<p>✅ Upload complete:<br>
                  ${successCount} entries added/updated<br>
                  ${failureCount} skipped<br>
                  &nbsp;&nbsp;&bull; ${emptyTagalogCount} rows missing Tagalog word<br>
                  &nbsp;&nbsp;&bull; ${harmfulCount} rows flagged as harmful
                </p>`;
            }
            updateDictionaryStatus();
          };
          tx.onerror = e => {
            console.error("DB Error:", e.target.error);
            alert("Failed to store dictionary data.");
          };
        }).catch(err => {
          console.error("DB Init Error:", err);
          alert("Failed to open database.");
        });
      } else {
        alert("❌ CSV appears to be empty or invalid.");
      }
    },
    error: function(err) {
      console.error("CSV Parse Error:", err);
      alert("Error reading CSV file.");
    }
  });
}

function uploadDictionaryCSV() {
  clearContent();
  const container = document.getElementById("gameContent") || document.getElementById("content");
  container.innerHTML = `
    <h2>Upload Dictionary CSV</h2>
    <p>Select your CSV file below to load the dictionary.</p>
    <input type="file" id="dictCSVFileInput" accept=".csv" />
    <div id="uploadResult"></div>
  `;

  // Only load on manual file select — not automatically
  const inputEl = document.getElementById("dictCSVFileInput");
  inputEl.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
      loadDictionaryCSVFile(file);
    }
  });
}

function deleteEntireDictionary() {
  if (!confirm("Are you sure you want to delete all dictionary entries? This cannot be undone.")) return;

  initDB().then(db => {
    const tx = db.transaction([STORE_NAME_DICTIONARY], "readwrite");
    const store = tx.objectStore(STORE_NAME_DICTIONARY);
    const clearRequest = store.clear();
    clearRequest.onsuccess = function() {
      alert("🗑️ All dictionary entries deleted.");
      updateDictionaryStatus();
    };
    clearRequest.onerror = function(e) {
      console.error("Error clearing dictionary store:", e.target.error);
      alert("Failed to delete dictionary.");
    };
  });
}

window.deleteEntireDictionary = deleteEntireDictionary;