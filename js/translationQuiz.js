"use strict";

function loadTranslationQuiz() {
  clearContent();
  const container = document.getElementById("content");

  getUserWords().then(userWords => {
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

    getDictionaryEntry(dictionaryKey).then(dictEntry => {
      if (!dictEntry) {
        container.innerHTML = `<p>Error: dictionary entry not found for "${dictionaryKey}".</p>`;
        return;
      }
      const card = {
        tagalog: dictEntry.tagalog,
        english: dictEntry.english,
        knowledge: userWord.knowledge
      };

      // Build quiz options: include the correct Tagalog word.
      let options = [card.tagalog];
      getDictionaryEntries().then(dictEntries => {
        while (options.length < 4) {
          let randomEntry = dictEntries[Math.floor(Math.random() * dictEntries.length)];
          if (randomEntry && !options.includes(randomEntry.tagalog)) {
            options.push(randomEntry.tagalog);
          }
        }
        options.sort(() => Math.random() - 0.5);

        // Build the quiz UI.
        const quizDiv = document.createElement("div");
        quizDiv.className = "quiz-card";
        quizDiv.innerHTML = `
          <h2>Translation Quiz</h2>
          <p>What is the Tagalog translation for:</p>
          <p><strong>${sanitize(card.english)}</strong></p>
          <div id="quizOptions"></div>
          <div id="quizFeedback" class="feedback"></div>
        `;
        container.appendChild(quizDiv);

        const quizOptions = document.getElementById("quizOptions");
        options.forEach(option => {
          const btn = document.createElement("button");
          btn.textContent = sanitize(option);
          btn.style.display = "block";
          btn.style.margin = "10px auto";
          btn.onclick = function() {
            const feedback = document.getElementById("quizFeedback");
            if (option === card.tagalog) {
              feedback.textContent = "Correct! Great job!";
              feedback.classList.remove("error");
              feedback.classList.add("success");
            } else {
              feedback.textContent = "That's not right. Try again!";
              feedback.classList.remove("success");
              feedback.classList.add("error");
            }
          };
          quizOptions.appendChild(btn);
        });

        // Add a Next Quiz button.
        const nextQuizBtn = document.createElement("button");
        nextQuizBtn.id = "nextQuizBtn";
        nextQuizBtn.textContent = "Next Quiz";
        nextQuizBtn.style.display = "block";
        nextQuizBtn.style.margin = "10px auto";
        nextQuizBtn.addEventListener("click", function() {
          loadTranslationQuiz();
        });
        quizDiv.appendChild(nextQuizBtn);
      }).catch(err => {
        container.innerHTML = `<p>Error retrieving dictionary entries for quiz: ${err.message}</p>`;
      });
    }).catch(err => {
      container.innerHTML = `<p>Error fetching dictionary entry: ${err.message}</p>`;
    });
  }).catch(err => {
    container.innerHTML = `<p>Error retrieving user words: ${err.message}</p>`;
  });
}
