const TOTAL_ROUNDS = 3;
const WAIT_MIN_MS = 10;
const WAIT_RANDOM_MS = 10;

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

let currentRound = 0;
let isReady = false;
let startTime = 0;
let results = [];
let readyTimeoutId = null;

// ============================================================
// HELPER FUNCTIONS (already done for you)
// ============================================================

function formatMilliseconds(value) {
  return `${Math.round(value)} ms`;
}

function calculatePercentile(time) {
  const slope = -0.408333;
  const intercept = 164.3333;
  const percentile = slope * time + intercept;
  return Math.round(Math.max(1, Math.min(99, percentile)));
}

function getReactionDescription(average) {
  if (average < 180) return "You have elite reaction speed!";
  if (average < 200) return "Dang. That was insane, you have lightning reflexes.";
  if (average < 225) return "Very impressive.";
  if (average < 275) return "Nice work, that was good focus.";
  if (average < 300) return "Good job, that was solid work.";
  if (average < 350) return "Not too shabby.";
  return "Need a bit of practice, but you have potential.";
}

// ============================================================
// YOUR EXERCISES - Implement these functions!
// ============================================================

/**
 * TODO 7: Calculate the average of an array of times
 * @param {number[]} times - Array of reaction times in milliseconds
 * @returns {number} The average time
 *
 * Example: calculateAverage([200, 250, 220]) should return 223.33...
 *
 * Hint: Use a for loop to add up all the values, then divide by the length
 */
function calculateAverage(times) {
  let sum = 0;
  for (let i = 0; i < times.length; i++) {
    sum += times[i];
  }
  return sum / times.length;
}

/**
 * TODO 8: Calculate how many milliseconds have passed since startTime
 * @param {number} startTime - The time when "TAP!" appeared (from performance.now())
 * @returns {number} Milliseconds elapsed since startTime
 *
 * Hint: Use performance.now() to get the current time, then subtract startTime
 */
function getReactionTime(startTime) {
  return performance.now() - startTime;
}

/**
 * TODO 9: Update the results screen with the player's stats
 * @param {number} average - The average reaction time in milliseconds
 * @param {number[]} times - Array of individual round times
 *
 * You need to update these elements:
 * - averageTime.textContent = use formatMilliseconds(average)
 * - reactionPercentile.textContent = "Faster than X% of people." (use calculatePercentile)
 * - reactionDescription.textContent = use getReactionDescription(average)
 * - roundTimeElements[0], [1], [2] .textContent = use formatMilliseconds for each time
 */
function updateResultsDisplay(average, times) {
  console.log(roundTimeElements);
  averageTime.textContent = formatMilliseconds(average);
  
  reactionPercentile.textContent = "faster than " + calculatePercentile(average) + "% of people";

  reactionDescription.textContent = getReactionDescription(average);

  for(let i = 0; i < roundTimeElements.length; i++){
    roundTimeElements[i].textContent = formatMilliseconds(times[i]);
  }
}

function setPanel(className, phaseText, instructionText) {
  reactionPanel.className = `game-panel ${className}`;
  panelPhase.textContent = phaseText;
  panelInstruction.textContent = instructionText;
  hudContent.textContent = currentRound === 0 ? "" : `Round ${currentRound} of ${TOTAL_ROUNDS}`;
}

function startGame() {
  startScreen.classList.add("hidden");
  playingState.classList.remove("hidden");
  document.body.classList.add("playing-mode");
  currentRound = 0;
  results = [];
  startRound();
}

function startRound() {
  currentRound += 1;
  isReady = false;
  setPanel("waiting", "WAIT", "");

  const delay = WAIT_MIN_MS + Math.random() * WAIT_RANDOM_MS;

  readyTimeoutId = setTimeout(() => {
    isReady = true;
    startTime = performance.now();
    setPanel("ready", "TAP!", "");
    readyTimeoutId = null;
  }, delay);
}

function handlePanelClick() {
  if (!isReady) {
    clearTimeout(readyTimeoutId);
    setPanel("early", "TOO SOON!", "Tap to retry");
    setTimeout(() => startRound(), 1000);
    return;
  }

  const reactionTime = getReactionTime(startTime);
  results.push(reactionTime);

  setPanel("result", formatMilliseconds(reactionTime), "");

  setTimeout(() => {
    if (currentRound < TOTAL_ROUNDS) {
      startRound();
    } else {
      showResults();
    }
  }, 1500);
}

function showResults() {
  const average = calculateAverage(results);
  updateResultsDisplay(average, results);

  playingState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  document.body.classList.remove("playing-mode");
}

function showStartScreen() {
  resultsState.classList.add("hidden");
  startScreen.classList.remove("hidden");
  document.body.classList.remove("playing-mode");
  currentRound = 0;
  results = [];
}

// Event listeners
startButton.addEventListener("click", startGame);
tryAgainButton.addEventListener("click", showStartScreen);
reactionPanel.addEventListener("click", handlePanelClick);

shareButton.addEventListener("click", async () => {
  const average = results.reduce((sum, time) => sum + time, 0) / results.length;
  const percentile = calculatePercentile(average);
  const shareText = `My reaction time is ${formatMilliseconds(average)}. Faster than ${percentile}% of people! What's yours?`;

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
    setTimeout(() => {
      shareButton.textContent = "Share";
    }, 2000);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
});
