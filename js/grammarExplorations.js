"use strict";

function loadGrammarExplorations() {
  clearContent();
  const container = document.getElementById("content");
  const grammarDiv = document.createElement("div");
  grammarDiv.id = "grammarExplorations";
  grammarDiv.innerHTML = `
    <h2>Grammar Explorations</h2>
    <p>Explore key differences between Tagalog and English sentence structures. Click on a rule to see more details.</p>
    <ul>
      <li data-rule="wordOrder" title="Tagalog can use a verb-first order."><strong>Word Order:</strong> Tagalog can start with the verb.</li>
      <li data-rule="focusSystem" title="Tagalog uses a focus system to indicate noun roles."><strong>Focus System:</strong> Roles are marked by focus particles.</li>
      <li data-rule="pronounUsage" title="Pronouns are often omitted."><strong>Pronoun Usage:</strong> Frequently omitted in casual conversation.</li>
    </ul>
    <div id="grammarDetail"><em>Click on a grammar rule above to see more details.</em></div>
  `;
  container.appendChild(grammarDiv);
  const items = grammarDiv.getElementsByTagName("li");
  for (let item of items) {
    item.onclick = function() {
      const ruleKey = item.getAttribute("data-rule");
      document.getElementById("grammarDetail").innerHTML = `<strong>${item.textContent}</strong><br>${getGrammarExplanation(ruleKey)}`;
      for (let other of items) {
        other.style.backgroundColor = "";
      }
      item.style.backgroundColor = "#eef";
    };
    item.onmouseout = function() {
      item.style.backgroundColor = "";
    };
  }
}

function getGrammarExplanation(ruleKey) {
  const grammarDetails = {
    wordOrder: "In Tagalog, the verb typically comes first, which can change the emphasis compared to English.",
    focusSystem: "Tagalog uses a focus system to indicate the role of a noun, which differs from the fixed roles in English.",
    pronounUsage: "In casual Tagalog, pronouns are often omitted when context makes the subject clear."
  };
  return grammarDetails[ruleKey] || "No details available.";
}
