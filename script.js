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
  setStatus("Step 1: choose a flag. Step 2: choose the matching country name.");

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
  selectedFlag = code;
  highlightSelected(".flag-card", code, "selected");
  evaluateIfReady();
}

function onSelectAnswer(code) {
  selectedAnswer = code;
  highlightSelected(".answer-btn", code, "selected");
  evaluateIfReady();
}

function lockRound() {
  document.querySelectorAll(".flag-card, .answer-btn").forEach((el) => {
    el.disabled = true;
  });
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

  if (!isCorrect) {
    const correctFlag = document.querySelector(
      `.flag-card[data-country-code="${round.targetCode}"]`
    );
    const correctAnswer = document.querySelector(
      `.answer-btn[data-country-code="${round.targetCode}"]`
    );
    correctFlag?.classList.add("correct");
    correctAnswer?.classList.add("correct");
  }
}

function evaluateIfReady() {
  if (!selectedFlag || !selectedAnswer) {
    return;
  }

  const isCorrect =
    selectedFlag === selectedAnswer && selectedAnswer === round.targetCode;
  totalQuestions += 1;
  if (isCorrect) {
    score += 1;
    setStatus("Correct! Click Next Question.");
  } else {
    const targetCountry = round.flags.find((c) => c.cca2 === round.targetCode);
    setStatus(`Not correct. Right answer: ${targetCountry.name.common}.`);
  }
  updateScore();
  applyRoundResult(isCorrect);
  lockRound();
  nextButton.disabled = false;
}

function createRound() {
  const picked = chooseFourCountries();
  const target = picked[Math.floor(Math.random() * picked.length)];
  round = {
    flags: shuffle(picked),
    answers: shuffle(picked),
    targetCode: target.cca2,
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
