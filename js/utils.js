"use strict";

function clearContent() {
  document.getElementById('Content').innerHTML = "";
}

function speakText(text, lang = "tl-PH") {
  if ('speechSynthesis' in window) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  } else {
    alert("Text-to-speech is not supported in this browser.");
  }
}

function sanitize(text) {
  return String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Returns a randomly selected item from the array using the provided weight function.
function weightedRandomChoice(items, weightFunc) {
  if (!Array.isArray(items) || items.length === 0) return null;
  let totalWeight = items.reduce((sum, item) => {
    let weight = weightFunc(item);
    if (typeof weight !== "number" || isNaN(weight) || weight <= 0) {
      weight = 1;
    }
    return sum + weight;
  }, 0);
  let rand = Math.random() * totalWeight;
  for (const item of items) {
    let weight = weightFunc(item);
    if (typeof weight !== "number" || isNaN(weight) || weight <= 0) {
      weight = 1;
    }
    rand -= weight;
    if (rand <= 0) return item;
  }
  return items[items.length - 1];
}

// Filter function start:
/**
 * Filters user words based on selected knowledge levels, parts of speech, and difficulty icons.
 * @param {Array} userWords - The array of user word objects (from CSV).
 * @param {Array} dictionary - The full dictionary entries with metadata.
 * @param {Array<number>} knowledgeLevels - Selected knowledge levels (1–5).
 * @param {Array<string>} partsOfSpeech - Selected parts of speech (noun, verb, etc.).
 * @param {Array<string>} icons - Selected difficulty icons (🟢, 🔴, etc.).
 * @returns {Array} Filtered array of user words.
 */
export function filterUserWords(userWords, dictionary, knowledgeLevels, partsOfSpeech, icons) {
  if (!userWords || !dictionary || !Array.isArray(userWords) || !Array.isArray(dictionary)) {
    console.warn("filterUserWords received invalid inputs");
    return [];
  }

  const dictMap = {};
  dictionary.forEach(entry => {
    if (entry.tagalog) {
      dictMap[entry.tagalog.toLowerCase()] = entry;
    }
  });

  return userWords.filter(word => {
    const refKey = (word.dictionaryRef || word.tagalog || "").toLowerCase();
    const dictEntry = dictMap[refKey];
    if (!dictEntry) return false;

    return (
      knowledgeLevels.includes(dictEntry.knowledge) &&
      partsOfSpeech.includes(dictEntry.pos?.toLowerCase()) &&
      icons.includes(dictEntry.icon)
    );
  });
}
// Filter function End