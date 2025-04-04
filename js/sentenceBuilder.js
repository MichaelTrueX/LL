"use strict";

// Function to load and display the Sentence Builder game.
function loadSentenceBuilder() {
  // Clear the "content" container.
  clearContent();
  const container = document.getElementById("content");
  if (!container) {
    console.error("Container with id 'content' not found.");
    return;
  }

  // Retrieve user words from the userWordsStore.
  getUserWords().then(userWords => {
    console.log("User words retrieved:", userWords);
    if (!userWords || userWords.length === 0) {
      container.innerHTML = "<p>No words available. Please add words from the dictionary first.</p>";
      return;
    }

    // Select a random user word.
    const userWord = userWords[Math.floor(Math.random() * userWords.length)];
    let dictionaryKey = "";
    if (userWord.dictionaryRef && userWord.dictionaryRef.trim() !== "") {
      dictionaryKey = userWord.dictionaryRef.trim();
    } else if (userWord.tagalog && userWord.tagalog.trim() !== "") {
      dictionaryKey = userWord.tagalog.trim();
    }
    if (!dictionaryKey) {
      container.innerHTML = "<p>Error: no valid dictionary reference found.</p>";
      return;
    }

    // Retrieve the full dictionary entry.
    getDictionaryEntry(dictionaryKey)
      .then(dictEntry => {
        if (!dictEntry || !dictEntry.example) {
          container.innerHTML = `<p>Error: No example sentence available for "${dictionaryKey}".</p>`;
          return;
        }
        const originalSentence = dictEntry.example;
        const words = originalSentence.split(" ");
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);

        // Build the Sentence Builder UI.
        const sentenceDiv = document.createElement("div");
        sentenceDiv.id = "sentenceBuilder";
        sentenceDiv.innerHTML = `
          <h2>Arrange the words to form the correct Tagalog sentence</h2>
          <button class="speak-btn" data-text="${originalSentence}">🔊 Play Original Sentence</button>
          <div class="word-bank" id="wordBank"></div>
          <div class="drop-zone" id="dropZone">Drop words here</div>
          <button id="checkSentenceBtn">Check Sentence</button>
          <button id="nextSentenceBtn">Next Sentence</button>
          <div id="sentenceFeedback" class="feedback"></div>
        `;
        container.appendChild(sentenceDiv);

        // Populate the word bank with draggable words.
        const wordBank = document.getElementById("wordBank");
        shuffledWords.forEach((word, index) => {
          const span = document.createElement("span");
          span.textContent = word;
          span.className = "draggable-word";
          span.draggable = true;
          span.id = "word-" + index;
          wordBank.appendChild(span);
        });

        // Ensure drop-zone has sufficient spacing (if not set in CSS, you can do inline):
        const dropZone = document.getElementById("dropZone");
        dropZone.style.minHeight = "50px";
        dropZone.style.padding = "10px";
        dropZone.style.border = "2px dashed #ccc";
        dropZone.style.marginTop = "10px";

        // Improved Drag-and-Drop:
        dropZone.addEventListener("dragover", function(e) {
          e.preventDefault();
          dropZone.style.backgroundColor = "#eef";
        });
        dropZone.addEventListener("dragleave", function(e) {
          dropZone.style.backgroundColor = "";
        });
        dropZone.addEventListener("drop", function(e) {
          e.preventDefault();
          dropZone.style.backgroundColor = "";
          const wordId = e.dataTransfer.getData("text/plain");
          const wordElem = document.getElementById(wordId);
          if (wordElem) {
            // Calculate drop X relative to dropZone.
            const dropRect = dropZone.getBoundingClientRect();
            const dropX = e.clientX - dropRect.left;
            let inserted = false;
            // Insert word before the first child whose horizontal center is greater than dropX.
            const children = Array.from(dropZone.children);
            for (let child of children) {
              const childRect = child.getBoundingClientRect();
              const childCenterX = ((childRect.left + childRect.right) / 2) - dropRect.left;
              if (dropX < childCenterX) {
                dropZone.insertBefore(wordElem, child);
                inserted = true;
                break;
              }
            }
            if (!inserted) {
              dropZone.appendChild(wordElem);
            }
          }
        });

        // Make words draggable.
        document.querySelectorAll(".draggable-word").forEach(elem => {
          elem.addEventListener("dragstart", function(e) {
            e.dataTransfer.setData("text/plain", e.target.id);
          });
        });

        // Check Sentence button.
        document.getElementById("checkSentenceBtn").onclick = function() {
          let constructedSentence = Array.from(dropZone.children)
            .map(span => span.textContent)
            .join(" ");
          const feedback = document.getElementById("sentenceFeedback");
          if (constructedSentence.trim() === originalSentence.trim()) {
            feedback.textContent = "Correct! Great job!";
            feedback.classList.remove("error");
            feedback.classList.add("success");
          } else {
            feedback.textContent = "That's not quite right. Try again!";
            feedback.classList.remove("success");
            feedback.classList.add("error");
          }
        };

        // Next Sentence button.
        document.getElementById("nextSentenceBtn").onclick = function() {
          loadSentenceBuilder();
        };

        // Attach speak functionality.
        Array.from(document.getElementsByClassName("speak-btn")).forEach(btn => {
          btn.addEventListener("click", function() {
            speakText(btn.getAttribute("data-text"));
          });
        });
      })
      .catch(err => {
        container.innerHTML = `<p>Error retrieving dictionary entry: ${err.message}</p>`;
      });
  }).catch(err => {
    container.innerHTML = `<p>Error retrieving user words: ${err.message}</p>`;
  });
}
