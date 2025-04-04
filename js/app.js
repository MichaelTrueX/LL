"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // Training module buttons
  const flashcardsBtn = document.getElementById("flashcardsBtn");
  const sentenceBuilderBtn = document.getElementById("sentenceBuilderBtn");
  const translationQuizBtn = document.getElementById("translationQuizBtn");
  const grammarExplorationsBtn = document.getElementById("grammarExplorationsBtn");
  const challengeModeBtn = document.getElementById("challengeModeBtn");
  const progressGraphBtn = document.getElementById("progressGraphBtn");

  if (flashcardsBtn) {
    flashcardsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      loadFlashcards();
    });
  }

  if (sentenceBuilderBtn) {
    sentenceBuilderBtn.addEventListener("click", function (e) {
      e.preventDefault();
      loadSentenceBuilder();
    });
  }

  if (translationQuizBtn) {
    translationQuizBtn.addEventListener("click", function (e) {
      e.preventDefault();
      loadTranslationQuiz();
    });
  }

  if (grammarExplorationsBtn) {
    grammarExplorationsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      loadGrammarExplorations();
    });
  }

  if (challengeModeBtn) {
    challengeModeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const filterUI = document.createElement("div");
      // filtering
      filterUI.innerHTML = `
        <fieldset>
          <legend>🎯 Difficulty (Knowledge Level)</legend>
          ${[1, 2, 3, 4, 5].map(i => `
            <label><input type="checkbox" name="knowledge" value="${i}" checked> ${i}</label>
          `).join(' ')}
        </fieldset>
        <fieldset>
          <legend>🧠 Part of Speech</legend>
          ${["noun", "verb", "adj", "adv", "expression"].map(part => `
            <label><input type="checkbox" name="pos" value="${part}" checked> ${part}</label>
          `).join(' ')}
        </fieldset>
        <fieldset>
          <legend>🎨 Icon</legend>
          ${["🟢", "🔵", "🟡", "🟠", "🔴", "🟣✨"].map(icon => `
            <label><input type="checkbox" name="icon" value="${icon}" checked> ${icon}</label>
          `).join(' ')}
        </fieldset>
        <button id="startChallengeBtn">Start Challenge</button>
        <div id="matchCount" style="margin-top: 10px;"></div>
      `;
      document.getElementById("content").appendChild(filterUI);
      // End filtering
      loadChallengeMode();
    });
  }

  if (progressGraphBtn) {
    progressGraphBtn.addEventListener("click", function (e) {
      e.preventDefault();
      loadProgressGraph();
    });
  }

  // Navigation + Configuration
  const userWordsBtn = document.getElementById("userWordsBtn");
  if (userWordsBtn) {
    userWordsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      loadUserWordsUI();
    });
  }

  const dictUploadBtn = document.getElementById("dictUploadBtn");
  if (dictUploadBtn) {
    dictUploadBtn.addEventListener("click", function (e) {
      e.preventDefault();
      uploadDictionaryCSV(); // Manual trigger only
    });
  }

  const dictionaryBtn = document.getElementById("dictionaryBtn");
  if (dictionaryBtn) {
    dictionaryBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showDictionary();
    });
  }

  // Auth setup
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showLocalLoginForm();
    });
  }

  // Initial header status
  updateAuthStatus();
  updateUserWordsStatus();
  updateDictionaryStatus();
});
