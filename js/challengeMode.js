"use strict";

import { filterUserWords } from "./utils.js"; // ✅ if in same folder

// Global Variables
let savedFilters = null;
let savedPlayers = null;
let savedReverseModeValue = false;
let savedTimerSeconds = 15;
let savedNumberOfRounds = 10;
let scoreHistory = JSON.parse(localStorage.getItem("scoreHistory")) || [];

function clearContent() {
  const container = document.getElementById("content");
  if (container) container.innerHTML = "";
}

function sanitize(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function weightedRandomChoice(array, weightFunc) {
  let total = 0;
  const weights = array.map(item => {
    const weight = weightFunc(item);
    total += weight;
    return weight;
  });
  const rand = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < array.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return array[i];
  }
  return array[array.length - 1];
}

function recordScoreboardEntry(name, lang, score, rounds) {
  scoreHistory.push({
    name,
    lang,
    score,
    rounds,
    date: new Date().toLocaleDateString()
  });
  localStorage.setItem("scoreHistory", JSON.stringify(scoreHistory));
}

function showScoreboard() {
  clearContent();
  const container = document.getElementById("content");
  const header = document.createElement("h2");
  header.textContent = "Scoreboard";
  header.style.textAlign = "center";
  header.style.marginBottom = "20px";
  container.appendChild(header);

  container.appendChild(renderScoreTable(scoreHistory));

  const backBtn = document.createElement("button");
  backBtn.textContent = "🔙 Back to Game Setup";
  backBtn.className = "back-button";
  backBtn.addEventListener("click", loadChallengeMode);
  container.appendChild(backBtn);
}

function renderScoreTable(scores) {
  const table = document.createElement("table");
  table.className = "scoreboard-table";

  const headerRow = document.createElement("tr");
  ["Date", "Name", "Language", "Rounds", "Score"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  const sortedScores = [...scores].sort((a, b) => b.score - a.score);
  sortedScores.forEach(entry => {
    const row = document.createElement("tr");
    [entry.date, entry.name, entry.lang, entry.rounds, entry.score].forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  return table;
}

function createCheckboxGroup(name, values, labels) {
  return values.map((val, i) => `
    <label>
      <input type="checkbox" name="${name}" value="${val}" checked> ${labels ? labels[i] : val}
    </label>
  `).join("");
}

function createPlayerInputs(count = 6) {
  let html = "";
  for (let i = 1; i <= count; i++) {
    html += `Player ${i} Name: <input id="playerName${i}" type="text"> Learning: <select id="playerLang${i}"><option value="tagalog">Tagalog</option><option value="english">English</option></select><br/>`;
  }
  return html;
}

function loadChallengeMode() {
  clearContent();

  const container = document.getElementById("content");
  const layout = document.createElement("div");
  layout.className = "challenge-layout";

  const filterUI = document.createElement("div");
  filterUI.className = "filter-panel";
  filterUI.innerHTML = `
    <fieldset>
      <legend>🎯 Difficulty (Knowledge Level)</legend>
      ${createCheckboxGroup("knowledge", [1, 2, 3, 4, 5])}
    </fieldset>
    <fieldset>
      <legend>🧠 Part of Speech</legend>
      ${createCheckboxGroup("pos", ["noun", "verb", "adj", "adv", "expression"])}
    </fieldset>
    <fieldset>
      <legend>📘 Word Difficulty</legend>
      ${createCheckboxGroup("icon", ["🟢", "🔵", "🟡", "🟠", "🔴", "🟣✨"])}
    </fieldset>
    <label><input type="checkbox" id="reverseMode"> 🔄 Reverse Mode</label><br>
    <label>⏱️ Seconds per Round: <input type="number" id="timerSeconds" min="5" max="60" value="15"></label><br>
    <label>🎳 Number of Rounds: <input type="number" id="roundCount" min="1" max="99" value="10"></label><br>
    <label><input type="checkbox" id="multiPlayerToggle"> 👥 Multiplayer Mode</label>
    <div id="playerInputs" style="display:none;"></div>
    <div id="matchCount"></div>
    <button id="showScoreboardBtn">📊 View Scoreboard</button>
    <button id="startGameBtn">Start Game</button>
  `;

  layout.appendChild(filterUI);
  container.appendChild(layout);

  const gameArea = document.createElement("div");
  gameArea.id = "challengeGameArea";
  gameArea.className = "game-panel";

  document.getElementById("showScoreboardBtn").addEventListener("click", showScoreboard);
  document.getElementById("startGameBtn").addEventListener("click", () => {
    saveCurrentFilters();
    container.innerHTML = "";
    layout.innerHTML = "";
    layout.appendChild(gameArea);
    container.appendChild(layout);
    startGameWithCurrentFilters();
  });

  const multiToggle = document.getElementById("multiPlayerToggle");
  multiToggle.addEventListener("change", e => {
    const inputArea = document.getElementById("playerInputs");
    inputArea.innerHTML = "";
    inputArea.style.display = e.target.checked ? "block" : "none";
    if (e.target.checked) inputArea.innerHTML = createPlayerInputs();
  });

  const checkBoxes = filterUI.querySelectorAll('input[type="checkbox"]');
  checkBoxes.forEach(cb => cb.addEventListener("change", updateMatchCount));
  updateMatchCount();

  function updateMatchCount() {
    const filterKnowledge = Array.from(filterUI.querySelectorAll('input[name="knowledge"]:checked')).map(cb => parseInt(cb.value));
    const filterPOS = Array.from(filterUI.querySelectorAll('input[name="pos"]:checked')).map(cb => cb.value.toLowerCase());
    const filterIcon = Array.from(filterUI.querySelectorAll('input[name="icon"]:checked')).map(cb => cb.value);

    Promise.all([getUserWords(), getDictionaryEntries()])
      .then(([userWords, dict]) => {
        const matches = filterUserWords(userWords, dict, filterKnowledge, filterPOS, filterIcon);
        document.getElementById("matchCount").textContent = `${matches.length} matching words.`;
      })
      .catch(err => {
        console.error("Error fetching word data:", err);
        document.getElementById("matchCount").textContent = `⚠️ Error loading data.`;
      });
  }
}
