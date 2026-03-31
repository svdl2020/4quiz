const API_URL =
  "https://restcountries.com/v3.1/all?fields=name,flags,cca2,independent,region";

const flagsGrid = document.getElementById("flagsGrid");
const answersGrid = document.getElementById("answersGrid");
const nextButton = document.getElementById("nextButton");
const questionText = document.getElementById("questionText");
const scoreText = document.getElementById("scoreText");

let countries = [];
let round = null;
let selectedFlag = null;
let selectedAnswer = null;
let score = 0;
let totalQuestions = 0;

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function chooseFourCountries() {
  return shuffle(countries).slice(0, 4);
}

function setStatus(message) {
  questionText.textContent = message;
}

function updateScore() {
  scoreText.textContent = `Score: ${score} / ${totalQuestions}`;
}

function clearRoundUI() {
  flagsGrid.innerHTML = "";
  answersGrid.innerHTML = "";
  nextButton.disabled = true;
  selectedFlag = null;
  selectedAnswer = null;
}

function renderRound() {
  clearRoundUI();
  setStatus("Match all 4 pairs: choose one flag and one country name.");

  round.flags.forEach((country) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "flag-card";
    btn.dataset.countryCode = country.cca2;

    const img = document.createElement("img");
    img.src = country.flags.png || country.flags.svg;
    img.alt = `Flag of ${country.name.common}`;
    img.loading = "lazy";

    btn.appendChild(img);
    btn.addEventListener("click", () => onSelectFlag(country.cca2));
    flagsGrid.appendChild(btn);
  });

  round.answers.forEach((country) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.dataset.countryCode = country.cca2;
    btn.textContent = country.name.common;
    btn.addEventListener("click", () => onSelectAnswer(country.cca2));
    answersGrid.appendChild(btn);
  });
}

function highlightSelected(selector, selectedCode, className) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    if (el.dataset.countryCode === selectedCode) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  });
}

function onSelectFlag(code) {
  if (round.matchedCodes.has(code)) {
    return;
  }
  selectedFlag = code;
  highlightSelected(".flag-card", code, "selected");
  evaluateIfReady();
}

function onSelectAnswer(code) {
  if (round.matchedCodes.has(code)) {
    return;
  }
  selectedAnswer = code;
  highlightSelected(".answer-btn", code, "selected");
  evaluateIfReady();
}

function clearCurrentSelections() {
  selectedFlag = null;
  selectedAnswer = null;
  document.querySelectorAll(".flag-card, .answer-btn").forEach((el) => {
    el.classList.remove("selected");
  });
}

function hideMatchedPair(code) {
  const flagEl = document.querySelector(`.flag-card[data-country-code="${code}"]`);
  const answerEl = document.querySelector(
    `.answer-btn[data-country-code="${code}"]`
  );
  flagEl?.classList.add("matched");
  answerEl?.classList.add("matched");
  flagEl?.classList.remove("selected");
  answerEl?.classList.remove("selected");
  flagEl && (flagEl.disabled = true);
  answerEl && (answerEl.disabled = true);
}

function applyRoundResult(isCorrect) {
  const selectedFlagEl = document.querySelector(
    `.flag-card[data-country-code="${selectedFlag}"]`
  );
  const selectedAnswerEl = document.querySelector(
    `.answer-btn[data-country-code="${selectedAnswer}"]`
  );

  if (selectedFlagEl) {
    selectedFlagEl.classList.add(isCorrect ? "correct" : "wrong");
  }
  if (selectedAnswerEl) {
    selectedAnswerEl.classList.add(isCorrect ? "correct" : "wrong");
  }

  // Remove temporary result styles after a short feedback delay.
  setTimeout(() => {
    selectedFlagEl?.classList.remove("correct", "wrong");
    selectedAnswerEl?.classList.remove("correct", "wrong");
  }, 350);
}

function evaluateIfReady() {
  if (!selectedFlag || !selectedAnswer) {
    return;
  }

  const isCorrect = selectedFlag === selectedAnswer;
  totalQuestions += 1;
  if (isCorrect) {
    score += 1;
    round.matchedCodes.add(selectedFlag);
    hideMatchedPair(selectedFlag);

    if (round.matchedCodes.size === round.flags.length) {
      setStatus("Great! You matched all 4. Click Next Question.");
      nextButton.disabled = false;
    } else {
      const remaining = round.flags.length - round.matchedCodes.size;
      setStatus(`Correct match. ${remaining} pair(s) left.`);
    }
  } else {
    setStatus("Not a match. Try another combination.");
  }
  updateScore();
  applyRoundResult(isCorrect);
  clearCurrentSelections();
}

function createRound() {
  const picked = chooseFourCountries();
  round = {
    flags: shuffle(picked),
    answers: shuffle(picked),
    matchedCodes: new Set(),
  };
}

async function loadCountries() {
  setStatus("Loading flags...");
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();
    countries = data.filter(
      (c) => c?.name?.common && c?.flags?.png && typeof c?.cca2 === "string"
    );
    if (countries.length < 4) {
      throw new Error("Not enough country records.");
    }
    createRound();
    renderRound();
  } catch (error) {
    setStatus("Could not load countries. Try refreshing.");
    console.error(error);
  }
}

nextButton.addEventListener("click", () => {
  createRound();
  renderRound();
});

updateScore();
loadCountries();
