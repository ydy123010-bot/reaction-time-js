const modeButtons = document.querySelectorAll(".mode-button");

const testSelection = document.getElementById("test-selection");
const gameArea = document.getElementById("game-area");
const arena = document.getElementById("arena");
const resultsPanel = document.getElementById("results-panel");
const resultsTitle = document.getElementById("results-title");
const resultsSummary = document.getElementById("results-summary");
const retryButton = document.getElementById("retry-button");
const differentTestButton = document.getElementById("different-test-button");

const reactionPanel = document.getElementById("reaction-panel");
const panelPhase = document.getElementById("panel-phase");
const panelInstruction = document.getElementById("panel-instruction");

const stroopPanel = document.getElementById("stroop-panel");
const stroopRound = document.getElementById("stroop-round");
const stroopWord = document.getElementById("stroop-word");
const trueButton = document.getElementById("true-button");
const falseButton = document.getElementById("false-button");

const whackPanel = document.getElementById("whack-panel");
const whackBoard = document.getElementById("whack-board");
const pixel = document.getElementById("pixel");
const whackTimer = document.getElementById("whack-timer");
const whackScore = document.getElementById("whack-score");

const stroopColors = [
    { label: "RED", value: "#ff6b6b" },
    { label: "BLUE", value: "#71a7ff" },
    { label: "GREEN", value: "#7cf29a" },
    { label: "YELLOW", value: "#ffe27a" }
];

let currentMode = null;

let stoplightState = "idle";
let stoplightTimeoutId = null;
let stoplightStartTime = 0;
let stoplightRound = 0;
let stoplightResults = [];

let stroopState = "idle";
let stroopQuestionIndex = 0;
let stroopQuestionStart = 0;
let stroopResults = [];
let currentStroopAnswer = false;

let whackState = "idle";
let whackScoreValue = 0;
let whackTimeRemaining = 20;
let whackTimerIntervalId = null;
let whackPenaltyTimeoutId = null;
let whackRoundStart = 0;
let pixelEnabled = false;

function formatMilliseconds(value) {
    return `${Math.round(value)} ms`;
}

function showMenu() {
    currentMode = null;
    testSelection.classList.remove("hidden");
    gameArea.classList.add("hidden");
    cleanupTimers();
    resetAllBoards();
}

function showArena(mode) {
    currentMode = mode;
    testSelection.classList.add("hidden");
    gameArea.classList.remove("hidden");
    arena.classList.remove("hidden");
    resultsPanel.classList.add("hidden");

    reactionPanel.classList.toggle("hidden", mode !== "stoplight");
    stroopPanel.classList.toggle("hidden", mode !== "stroop");
    whackPanel.classList.toggle("hidden", mode !== "whack");
}

function showResults(title, lines) {
    arena.classList.add("hidden");
    resultsPanel.classList.remove("hidden");
    resultsTitle.textContent = title;
    resultsSummary.innerHTML = "";

    lines.forEach((line) => {
        const item = document.createElement("div");
        item.className = "result-line";
        item.innerHTML = line;
        resultsSummary.appendChild(item);
    });
}

function cleanupTimers() {
    if (stoplightTimeoutId !== null) {
        clearTimeout(stoplightTimeoutId);
        stoplightTimeoutId = null;
    }

    if (whackTimerIntervalId !== null) {
        clearInterval(whackTimerIntervalId);
        whackTimerIntervalId = null;
    }

    if (whackPenaltyTimeoutId !== null) {
        clearTimeout(whackPenaltyTimeoutId);
        whackPenaltyTimeoutId = null;
    }
}

function resetAllBoards() {
    reactionPanel.className = "reaction-panel idle";
    panelPhase.textContent = "Round 1";
    panelInstruction.textContent = "Wait for green, then click as fast as you can.";

    stroopRound.textContent = "Question 1 of 10";
    stroopWord.textContent = "READY";
    stroopWord.style.color = "var(--cyan)";

    whackTimer.textContent = "20.0s";
    whackScore.textContent = "0";
    pixel.classList.add("hidden");
    pixel.classList.remove("penalty");
}

function startMode(mode) {
    cleanupTimers();
    resetAllBoards();
    showArena(mode);

    if (mode === "stoplight") {
        startStoplightSeries();
        return;
    }

    if (mode === "stroop") {
        startStroop();
        return;
    }

    startWhack();
}

function retryCurrentMode() {
    if (!currentMode) {
        return;
    }

    startMode(currentMode);
}

function setStoplightPanel(state, phaseText, instructionText) {
    reactionPanel.className = `reaction-panel ${state}`;
    panelPhase.textContent = phaseText;
    panelInstruction.textContent = instructionText;
}

function startStoplightSeries() {
    stoplightState = "idle";
    stoplightRound = 0;
    stoplightResults = [];
    queueStoplightRound();
}

function queueStoplightRound() {
    stoplightRound += 1;
    stoplightState = "waiting";
    setStoplightPanel("waiting", `Round ${stoplightRound}`, "Wait for green. Clicking early restarts this round.");

    const delay = 1400 + Math.random() * 2600;
    stoplightTimeoutId = window.setTimeout(() => {
        stoplightState = "ready";
        stoplightStartTime = performance.now();
        setStoplightPanel("ready", `Round ${stoplightRound}`, "Green means go. Click now.");
        stoplightTimeoutId = null;
    }, delay);
}

function restartCurrentStoplightRound() {
    stoplightState = "waiting";
    setStoplightPanel("waiting", `Round ${stoplightRound}`, "Wait for green. Clicking early restarts this round.");

    const delay = 1400 + Math.random() * 2600;
    stoplightTimeoutId = window.setTimeout(() => {
        stoplightState = "ready";
        stoplightStartTime = performance.now();
        setStoplightPanel("ready", `Round ${stoplightRound}`, "Green means go. Click now.");
        stoplightTimeoutId = null;
    }, delay);
}

function finishStoplightSeries() {
    const average = stoplightResults.reduce((sum, time) => sum + time, 0) / stoplightResults.length;
    const fastest = Math.min(...stoplightResults);
    const slowest = Math.max(...stoplightResults);

    showResults("Stoplight Complete", [
        `<strong>Average:</strong> ${formatMilliseconds(average)}`,
        `<strong>Fastest:</strong> ${formatMilliseconds(fastest)}`,
        `<strong>Slowest:</strong> ${formatMilliseconds(slowest)}`,
        `<strong>Rounds:</strong> ${stoplightResults.map((time, index) => `R${index + 1} ${formatMilliseconds(time)}`).join(" • ")}`
    ]);
}

function handleStoplightPanelClick() {
    if (currentMode !== "stoplight") {
        return;
    }

    if (stoplightState === "waiting") {
        if (stoplightTimeoutId !== null) {
            clearTimeout(stoplightTimeoutId);
            stoplightTimeoutId = null;
        }

        stoplightState = "early";
        setStoplightPanel("early", `Round ${stoplightRound}`, "Too soon. This round is restarting...");

        window.setTimeout(() => {
            if (currentMode === "stoplight" && resultsPanel.classList.contains("hidden")) {
                restartCurrentStoplightRound();
            }
        }, 900);
        return;
    }

    if (stoplightState === "ready") {
        const reactionTime = performance.now() - stoplightStartTime;
        stoplightResults.push(reactionTime);
        stoplightState = "result";
        setStoplightPanel("result", formatMilliseconds(reactionTime), `Round ${stoplightRound} complete.`);

        if (stoplightResults.length === 3) {
            finishStoplightSeries();
            return;
        }

        window.setTimeout(() => {
            if (currentMode === "stoplight" && resultsPanel.classList.contains("hidden")) {
                queueStoplightRound();
            }
        }, 900);
    }
}

function randomStroopPrompt() {
    const wordChoice = stroopColors[Math.floor(Math.random() * stroopColors.length)];
    const isMatch = Math.random() < 0.5;
    const mismatchOptions = stroopColors.filter((color) => color.label !== wordChoice.label);
    const colorChoice = isMatch
        ? wordChoice
        : mismatchOptions[Math.floor(Math.random() * mismatchOptions.length)];

    currentStroopAnswer = isMatch;
    stroopWord.textContent = wordChoice.label;
    stroopWord.style.color = colorChoice.value;
    stroopQuestionStart = performance.now();
}

function startStroop() {
    stroopState = "playing";
    stroopQuestionIndex = 0;
    stroopResults = [];
    stroopRound.textContent = "Question 1 of 10";
    randomStroopPrompt();
}

function finishStroop() {
    const correctCount = stroopResults.filter((result) => result.correct).length;
    const averageTime = stroopResults.reduce((sum, result) => sum + result.time, 0) / stroopResults.length;

    showResults("Color Match Complete", [
        `<strong>Score:</strong> ${correctCount} / 10`,
        `<strong>Average response:</strong> ${formatMilliseconds(averageTime)}`,
        `<strong>Accuracy:</strong> ${Math.round((correctCount / 10) * 100)}%`
    ]);
}

function answerStroop(answer) {
    if (currentMode !== "stroop" || stroopState !== "playing") {
        return;
    }

    const reactionTime = performance.now() - stroopQuestionStart;
    const isCorrect = answer === currentStroopAnswer;

    stroopResults.push({ correct: isCorrect, time: reactionTime });
    stroopQuestionIndex += 1;

    if (stroopQuestionIndex >= 10) {
        finishStroop();
        return;
    }

    stroopRound.textContent = `Question ${stroopQuestionIndex + 1} of 10`;
    randomStroopPrompt();
}

function updateWhackHud() {
    whackTimer.textContent = `${whackTimeRemaining.toFixed(1)}s`;
    whackScore.textContent = String(whackScoreValue);
}

function placePixel() {
    const boardRect = whackBoard.getBoundingClientRect();
    const pixelSize = 24;
    const left = Math.random() * Math.max(0, boardRect.width - pixelSize);
    const top = Math.random() * Math.max(0, boardRect.height - pixelSize);

    pixel.style.left = `${left}px`;
    pixel.style.top = `${top}px`;
    pixel.classList.remove("hidden", "penalty");
    pixelEnabled = true;
}

function startWhack() {
    whackState = "playing";
    whackScoreValue = 0;
    whackTimeRemaining = 20;
    whackRoundStart = performance.now();
    updateWhackHud();
    placePixel();

    whackTimerIntervalId = window.setInterval(() => {
        const elapsed = (performance.now() - whackRoundStart) / 1000;
        whackTimeRemaining = Math.max(0, 20 - elapsed);
        updateWhackHud();

        if (whackTimeRemaining <= 0) {
            finishWhack();
        }
    }, 100);
}

function finishWhack() {
    cleanupTimers();
    whackState = "done";
    pixel.classList.add("hidden");
    pixelEnabled = false;
    showResults("Whack a Pixel Complete", [
        `<strong>Final score:</strong> ${whackScoreValue}`,
        `<strong>Round length:</strong> 20 seconds`,
        `<strong>Penalty:</strong> Misclicks freeze the pixel for 1 second`
    ]);
}

function handlePixelClick(event) {
    event.stopPropagation();

    if (currentMode !== "whack" || whackState !== "playing" || !pixelEnabled) {
        return;
    }

    whackScoreValue += 1;
    updateWhackHud();
    placePixel();
}

function handleWhackMiss() {
    if (currentMode !== "whack" || whackState !== "playing" || !pixelEnabled) {
        return;
    }

    pixelEnabled = false;
    pixel.classList.add("penalty");

    if (whackPenaltyTimeoutId !== null) {
        clearTimeout(whackPenaltyTimeoutId);
    }

    whackPenaltyTimeoutId = window.setTimeout(() => {
        whackPenaltyTimeoutId = null;

        if (currentMode !== "whack" || whackState !== "playing") {
            return;
        }

        placePixel();
    }, 1000);
}

modeButtons.forEach((button) => {
    button.addEventListener("click", () => startMode(button.dataset.mode));
});

reactionPanel.addEventListener("click", handleStoplightPanelClick);
trueButton.addEventListener("click", () => answerStroop(true));
falseButton.addEventListener("click", () => answerStroop(false));
pixel.addEventListener("click", handlePixelClick);
whackBoard.addEventListener("click", handleWhackMiss);
retryButton.addEventListener("click", retryCurrentMode);
differentTestButton.addEventListener("click", showMenu);

showMenu();
