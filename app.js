import { createStoplightGame } from "./games/stoplight.js";
import { createWhackGame } from "./games/whack.js";
import { formatMilliseconds } from "./games/helpers.js";

const modeButtons = document.querySelectorAll("[data-mode]");

const testSelection = document.getElementById("test-selection");
const playingState = document.getElementById("playing-state");
const resultsState = document.getElementById("results-state");
const resultsSummary = document.getElementById("results-summary");
const retryButton = document.getElementById("retry-button");
const differentTestButton = document.getElementById("different-test-button");

const gameRegistry = {
  stoplight: {
    templateUrl: "./games/stoplight.html",
    resultsTemplateUrl: "./games/stoplight-results.html",
    createGame: createStoplightGame,
  },
  whack: {
    templateUrl: "./games/whack.html",
    resultsTemplateUrl: "./games/whack-results.html",
    createGame: createWhackGame,
  },
};

const templateCache = new Map();

let currentMode = null;
let currentGame = null;

async function loadTemplate(url, cacheKey) {
  const key = cacheKey || url;

  if (templateCache.has(key)) {
    return templateCache.get(key);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load template from ${url}`);
  }

  const markup = await response.text();
  templateCache.set(key, markup);
  return markup;
}

async function renderResults(data) {
  playingState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  resultsSummary.innerHTML = "";

  // Handle old format (array of HTML strings) for backward compatibility
  if (Array.isArray(data)) {
    data.forEach((line) => {
      const item = document.createElement("div");
      item.className = "result-line";
      item.innerHTML = line;
      resultsSummary.appendChild(item);
    });
    return;
  }

  // Handle new format (data object with template)
  const game = gameRegistry[currentMode];
  if (game.resultsTemplateUrl) {
    const template = await loadTemplate(game.resultsTemplateUrl, `${currentMode}-results`);
    resultsSummary.innerHTML = template;

    if (currentMode === "stoplight") {
      populateStoplightResults(data);
    } else if (currentMode === "whack") {
      populateWhackResults(data);
    }
  }
}

function populateStoplightResults(data) {
  document.getElementById("average-time").textContent = formatMilliseconds(data.average);
  document.getElementById("reaction-description").textContent = `Top ${data.topPercent}% · ${data.reactionDescription}`;

  data.results.forEach((time, index) => {
    document.getElementById(`round-${index + 1}-time`).textContent = formatMilliseconds(time);
  });
}

function populateWhackResults(data) {
  // Hero stats
  document.getElementById("hit-count").textContent = data.hits;
  document.getElementById("reaction-description").textContent = `${data.skillBadge} · ${data.reactionDescription}`;

  // Stats grid
  document.getElementById("accuracy").textContent = `${data.accuracy.toFixed(1)}%`;
  document.getElementById("avg-time").textContent = formatMilliseconds(data.avgTime);
  document.getElementById("misses").textContent = data.misses;
}

function destroyCurrentGame() {
  if (currentGame !== null) {
    currentGame.destroy();
    currentGame = null;
  }

  playingState.innerHTML = "";
}

function setSelectionButtonsDisabled(isDisabled) {
  modeButtons.forEach((button) => {
    button.disabled = isDisabled;
    button.classList.toggle("active", isDisabled && button.dataset.mode === currentMode);
    if (!isDisabled) {
      button.classList.remove("active");
    }
  });
}

function showMenu() {
  currentMode = null;
  destroyCurrentGame();
  testSelection.classList.remove("hidden");
  playingState.classList.add("hidden");
  resultsState.classList.add("hidden");
  setSelectionButtonsDisabled(false);
}

async function startMode(mode) {
  currentMode = mode;
  destroyCurrentGame();
  setSelectionButtonsDisabled(true);
  testSelection.classList.add("hidden");
  resultsState.classList.add("hidden");
  playingState.classList.remove("hidden");

  try {
    const markup = await loadTemplate(gameRegistry[mode].templateUrl, mode);
    playingState.innerHTML = markup;

    if (currentMode !== mode) {
      return;
    }

    currentGame = gameRegistry[mode].createGame(playingState, {
      onComplete(data) {
        renderResults(data);
      },
    });
  } catch (error) {
    console.error(error);
    showMenu();
  }
}

function retryCurrentMode() {
  if (currentMode === null) {
    return;
  }

  void startMode(currentMode);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    void startMode(button.dataset.mode);
  });
});

retryButton.addEventListener("click", retryCurrentMode);
differentTestButton.addEventListener("click", showMenu);

showMenu();
