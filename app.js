const TOTAL_ROUNDS = 3;
const WAIT_MIN_MS = 2000;
const WAIT_RANDOM_MS = 1750;
const FINAL_RESULT_DELAY_MS = 1500;
const SHARE_RESET_DELAY_MS = 2000;

const startScreen = document.getElementById("test-selection");
const playingState = document.getElementById("playing-state");
const resultsState = document.getElementById("results-state");
const startButton = document.getElementById("start-button");
const tryAgainButton = document.getElementById("different-test-button");
const shareButton = document.getElementById("share-button");

const reactionPanel = document.getElementById("reaction-panel");
const hudContent = document.getElementById("hud-content");
const panelPhase = document.getElementById("panel-phase");
const panelInstruction = document.getElementById("panel-instruction");

const averageTime = document.getElementById("average-time");
const reactionPercentile = document.getElementById("reaction-percentile");
const reactionDescription = document.getElementById("reaction-description");
const roundTimeElements = Array.from(
  document.querySelectorAll("[data-round-time]"),
);

let currentResultsData = null;
let readyTimeoutId = null;
let transitionTimeoutId = null;
let shareResetTimeoutId = null;
let startTime = 0;
let round = 0;
let results = [];
let state = "idle";

function formatMilliseconds(value) {
  return `${Math.round(value)} ms`;
}

function cleanupTimers() {
  if (readyTimeoutId !== null) {
    clearTimeout(readyTimeoutId);
    readyTimeoutId = null;
  }

  if (transitionTimeoutId !== null) {
    clearTimeout(transitionTimeoutId);
    transitionTimeoutId = null;
  }
}

function resetShareButton() {
  if (shareResetTimeoutId !== null) {
    clearTimeout(shareResetTimeoutId);
    shareResetTimeoutId = null;
  }

  shareButton.textContent = "Share";
}

function clearResults() {
  averageTime.textContent = "";
  reactionPercentile.textContent = "";
  reactionDescription.textContent = "";

  roundTimeElements.forEach((element) => {
    element.textContent = "";
  });
}

function setPanel(panelState, phaseText, instructionText) {
  reactionPanel.className = `game-panel ${panelState}`;
  panelPhase.textContent = phaseText;
  panelInstruction.textContent = instructionText;
  hudContent.textContent =
    round === 0 ? "" : `Round ${round} of ${TOTAL_ROUNDS}`;
}

function calculatePercentile(time) {
  const slope = -0.408333;
  const intercept = 164.3333;
  const percentile = slope * time + intercept;

  return Math.round(Math.max(1, Math.min(99, percentile)));
}

function getReactionDescription(average) {
  if (average < 180) return "You have elite reaction speed!";
  if (average < 200) {
    return "Dang. That was insane, you have lightning reflexes.";
  }
  if (average < 225) return "Very impressive.";
  if (average < 275) return "Nice work, that was good focus.";
  if (average < 300) return "Good job, that was solid work.";
  if (average < 350) return "Not too shabby.";
  return "Need a bit of practice, but you have potential.";
}

function showStartScreen() {
  cleanupTimers();
  resetShareButton();
  clearResults();

  currentResultsData = null;
  startTime = 0;
  round = 0;
  results = [];
  state = "idle";

  document.body.classList.remove("playing-mode");
  startScreen.classList.remove("hidden");
  playingState.classList.add("hidden");
  resultsState.classList.add("hidden");
  startButton.disabled = false;

  setPanel("entry", "", "");
}

function finishSeries() {
  cleanupTimers();

  const average = results.reduce((sum, time) => sum + time, 0) / results.length;
  const percentile = calculatePercentile(average);

  currentResultsData = {
    average,
    percentile,
    reactionDescription: getReactionDescription(average),
    results: [...results],
  };

  averageTime.textContent = formatMilliseconds(currentResultsData.average);
  reactionPercentile.textContent = `Faster than ${currentResultsData.percentile}% of people.`;
  reactionDescription.textContent = currentResultsData.reactionDescription;

  roundTimeElements.forEach((element, index) => {
    element.textContent = formatMilliseconds(currentResultsData.results[index]);
  });

  document.body.classList.remove("playing-mode");
  playingState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  state = "complete";
}

function queueCurrentRound() {
  state = "waiting";
  setPanel("waiting", "WAIT", "");

  const delay = WAIT_MIN_MS + Math.random() * WAIT_RANDOM_MS;
  readyTimeoutId = window.setTimeout(() => {
    state = "ready";
    startTime = performance.now();
    setPanel("ready", "TAP!", "");
    readyTimeoutId = null;
  }, delay);
}

function queueNextRound() {
  round += 1;
  queueCurrentRound();
}

function startGame() {
  cleanupTimers();
  resetShareButton();

  currentResultsData = null;
  startTime = 0;
  round = 0;
  results = [];
  state = "entry";

  document.body.classList.add("playing-mode");
  startScreen.classList.add("hidden");
  resultsState.classList.add("hidden");
  playingState.classList.remove("hidden");
  startButton.disabled = true;

  queueNextRound();
}

function handlePanelPointerDown() {
  if (state === "result" || state === "early") {
    if (results.length === TOTAL_ROUNDS) {
      finishSeries();
    } else if (state === "early") {
      queueCurrentRound();
    } else {
      queueNextRound();
    }
    return;
  }

  if (state === "waiting") {
    cleanupTimers();
    state = "early";
    setPanel("early", "TOO SOON!", "Tap to retry");
    return;
  }

  if (state !== "ready") {
    return;
  }

  const reactionTime = performance.now() - startTime;
  results.push(reactionTime);
  state = "result";

  if (results.length === TOTAL_ROUNDS) {
    setPanel("result", formatMilliseconds(reactionTime), "");
    transitionTimeoutId = window.setTimeout(
      finishSeries,
      FINAL_RESULT_DELAY_MS,
    );
    return;
  }

  setPanel("result", formatMilliseconds(reactionTime), "Tap for next round");
}

startButton.addEventListener("click", startGame);
tryAgainButton.addEventListener("click", showStartScreen);
reactionPanel.addEventListener("pointerdown", handlePanelPointerDown);

shareButton.addEventListener("click", async () => {
  if (!currentResultsData) return;

  const shareText =
    `My reaction time is ${formatMilliseconds(currentResultsData.average)}. ` +
    `Faster than ${currentResultsData.percentile}% of people! What's yours?`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Reaction Lab",
        text: shareText,
        url: window.location.href,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
    shareButton.textContent = "Copied!";
    shareResetTimeoutId = window.setTimeout(
      resetShareButton,
      SHARE_RESET_DELAY_MS,
    );
  } catch (error) {
    console.error("Failed to copy:", error);
  }
});

showStartScreen();
