"use strict";

function sanitize(text) {
  return String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loadFlashcards() {
  clearContent();
  const container = document.getElementById("content");
  if (!container) {
    console.error("Container with id 'content' not found.");
    return;
  }
  getUserWords().then(userWords => {
    console.log("User words retrieved:", userWords);
    if (!userWords || userWords.length === 0) {
      container.innerHTML = "<p>No words in your collection. Please add words from the dictionary first.</p>";
      return;
    }
    const flashcardDiv = document.createElement("div");
    flashcardDiv.className = "card";
    const wordDisplay = document.createElement("div");
    wordDisplay.id = "wordDisplay";
    flashcardDiv.appendChild(wordDisplay);
    container.appendChild(flashcardDiv);

    function showCard() {
      const userWord = weightedRandomChoice(userWords, item => {
        let w = 6 - item.knowledge;
        return (typeof w === "number" && w > 0) ? w : 1;
      });
      console.log("Selected user word:", userWord);
      let dictionaryKey = "";
      if (userWord.dictionaryRef && userWord.dictionaryRef.trim() !== "") {
        dictionaryKey = userWord.dictionaryRef.trim();
      } else if (userWord.tagalog && userWord.tagalog.trim() !== "") {
        dictionaryKey = userWord.tagalog.trim();
      }
      console.log("Using dictionary key:", dictionaryKey);
      if (!dictionaryKey) {
        wordDisplay.innerHTML = "<p>Error: no valid word selected.</p>";
        return;
      }
      getDictionaryEntry(dictionaryKey)
        .then(dictEntry => {
          if (!dictEntry) {
            wordDisplay.innerHTML = `<p>Error: dictionary entry not found for "${dictionaryKey}".</p>`;
            return;
          }
          const card = {
            tagalog: dictEntry.tagalog,
            english: dictEntry.english,
            example: dictEntry.example,
            pronunciation: dictEntry.pronunciation || "",
            knowledge: userWord.knowledge
          };
          wordDisplay.innerHTML = `
            <h2>${sanitize(card.tagalog)}</h2>
            <button onclick="speakText('${sanitize(card.tagalog)}')">🔊 Play Word</button>
            <p><strong>Pronunciation:</strong> ${sanitize(card.pronunciation)}</p>
            <p><strong>Example:</strong> ${sanitize(card.example)}</p>
            <button onclick="speakText('${sanitize(card.example)}', 'tl-PH')">🔊 Play Sentence</button>
            <br>
            <button id="revealEnglishBtn">Reveal English</button>
            <p id="englishTranslation" style="display:none;"><strong>English:</strong> ${sanitize(card.english)}</p>
            <br>
            <button id="nextCardBtn">Next</button>
            <button id="explainBtn">Explain Grammar</button>
          `;
          document.getElementById("revealEnglishBtn").onclick = function() {
            document.getElementById("englishTranslation").style.display = "block";
          };
          document.getElementById("nextCardBtn").onclick = showCard;
          document.getElementById("explainBtn").onclick = function() {
            let explanation = card.example.includes("Magandang")
              ? "Notice how adjectives like 'Magandang' appear before the noun."
              : "Tagalog sentence structure differs from English.";
            alert(explanation);
          };
        })
        .catch(err => {
          console.error("Error fetching dictionary entry:", err);
          wordDisplay.innerHTML = "<p>Error fetching dictionary entry.</p>";
        });
    }
    showCard();
  })
  .catch(err => {
    console.error("Error retrieving user words:", err);
    container.innerHTML = "<p>Error loading your words.</p>";
  });
}
