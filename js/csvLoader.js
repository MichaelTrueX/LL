"use strict";
window.data = [];

// Helper function to update the status in the header.
function updateWordStatus() {
  const statusEl = document.getElementById("wordStatus");
  if (statusEl) {
    statusEl.textContent = "Words loaded: " + window.data.length;
  }
}

function showCSVUploadPrompt() {
  clearContent();
  const container = document.getElementById('gameContent');
  container.innerHTML = `
    <h2>CSV File Not Found / Upload New CSV File</h2>
    <p>Please upload your 'Tagalog Learner.csv' file.</p>
    <input type="file" id="csvFileInput" accept=".csv" />
  `;
  document.getElementById("csvFileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
      loadCSVFile(file);
    }
  });
}

function loadCSVFile(fileOrPath) {
  Papa.parse(fileOrPath, {
    download: (typeof fileOrPath === "string"),
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      if (results.data && results.data.length > 0) {
        // Filter out rows with missing or "null" values.
        let filteredData = results.data.filter(row => {
          const filWord = row["Filippino Word"] ? row["Filippino Word"].toString().trim() : "";
          const knowLevel = row["Knowledge Level"] ? row["Knowledge Level"].toString().trim() : "";
          const engWord = row["English Word"] ? row["English Word"].toString().trim() : "";
          const exContext = row["Example Context"] ? row["Example Context"].toString().trim() : "";
          const pronunc = row["Pronuncation"] ? row["Pronuncation"].toString().trim() : "";
          return filWord !== "" && filWord.toLowerCase() !== "null" &&
                 knowLevel !== "" && knowLevel.toLowerCase() !== "null" &&
                 engWord !== "" && engWord.toLowerCase() !== "null" &&
                 exContext !== "" && exContext.toLowerCase() !== "null" &&
                 pronunc !== "" && pronunc.toLowerCase() !== "null";
        });
        window.data = filteredData.map(row => ({
          tagalog: row["Filippino Word"].toString().trim(),
          knowledge: row["Knowledge Level"],
          english: row["English Word"].toString().trim(),
          example: row["Example Context"].toString().trim(),
          pronunciation: row["Pronuncation"].toString().trim()
        }));
        alert("CSV file loaded successfully! " + window.data.length + " valid words found.");
        updateWordStatus();
        loadFlashcards(); // Launch default mode
      } else {
        alert("CSV file appears to be empty or invalid.");
      }
    },
    error: function(err) {
      console.error("Error parsing CSV file: ", err);
      alert("Error loading CSV file. Please try uploading manually.");
      showCSVUploadPrompt();
    }
  });
}

function loadCSVFromPath() {
  Papa.parse("Tagalog Learner.csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      if (results.data && results.data.length > 0) {
        let filteredData = results.data.filter(row => {
          const filWord = row["Filippino Word"] ? row["Filippino Word"].toString().trim() : "";
          const knowLevel = row["Knowledge Level"] ? row["Knowledge Level"].toString().trim() : "";
          const engWord = row["English Word"] ? row["English Word"].toString().trim() : "";
          const exContext = row["Example Context"] ? row["Example Context"].toString().trim() : "";
          const pronunc = row["Pronuncation"] ? row["Pronuncation"].toString().trim() : "";
          return filWord !== "" && filWord.toLowerCase() !== "null" &&
                 knowLevel !== "" && knowLevel.toLowerCase() !== "null" &&
                 engWord !== "" && engWord.toLowerCase() !== "null" &&
                 exContext !== "" && exContext.toLowerCase() !== "null" &&
                 pronunc !== "" && pronunc.toLowerCase() !== "null";
        });
        window.data = filteredData.map(row => ({
          tagalog: row["Filippino Word"].toString().trim(),
          knowledge: row["Knowledge Level"],
          english: row["English Word"].toString().trim(),
          example: row["Example Context"].toString().trim(),
          pronunciation: row["Pronuncation"].toString().trim()
        }));
        alert("CSV file loaded successfully! " + window.data.length + " valid words found.");
        updateWordStatus();
        loadFlashcards(); // Launch default mode after CSV loads
      } else {
        alert("CSV file appears to be empty or invalid.");
      }
    },
    error: function(err) {
      console.error("Error loading CSV file: ", err);
      alert("Error loading CSV file. Please try uploading manually.");
    }
  });
}
