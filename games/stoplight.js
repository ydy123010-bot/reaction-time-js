import { formatMilliseconds } from "./helpers.js";

export function createStoplightGame(root, { onComplete }) {
  const reactionPanel = root.querySelector("#reaction-panel");
  const panelPhase = root.querySelector("#panel-phase");
  const panelInstruction = root.querySelector("#panel-instruction");
  const hudContent = root.querySelector("#hud-content");

  let state = "entry";
  let readyTimeoutId = null;
  let transitionTimeoutId = null;
  let startTime = 0;
  let round = 0;
  let results = [];

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

  function setPanel(panelState, phaseText, instructionText) {
    reactionPanel.className = `reaction-panel ${panelState}`;
    panelPhase.textContent = phaseText;
    panelInstruction.textContent = instructionText;

    // Update HUD
    if (panelState === "entry") {
      hudContent.textContent = "3 Rounds. Tap to start.";
    } else if (
      panelState === "waiting" ||
      panelState === "ready" ||
      panelState === "result" ||
      panelState === "early"
    ) {
      hudContent.textContent = `Round ${round} of 3`;
    }
  }

  function finishSeries() {
    cleanupTimers();

    const average =
      results.reduce((sum, time) => sum + time, 0) / results.length;
    const fastest = Math.min(...results);
    const slowest = Math.max(...results);
    const reactionAge = Math.max(
      15,
      Math.min(75, Math.round(15 + (average - 200) / 5)),
    );

    onComplete({
      average,
      reactionAge,
      fastest,
      slowest,
      results,
    });
  }

  function queueCurrentRound() {
    state = "waiting";
    setPanel("waiting", `WAIT`, "");

    const delay = 2500 + Math.random() * 1000;
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

  function handleClick() {
    if (state === "entry") {
      queueNextRound();
      return;
    }

    if (state === "result" || state === "early") {
      if (results.length === 3) {
        finishSeries();
      } else {
        queueNextRound();
      }
      return;
    }

    if (state === "waiting") {
      cleanupTimers();
      state = "early";
      setPanel("early", "TOO SOON!", "Tap to continue");
      results.push(1000);
      return;
    }

    if (state !== "ready") {
      return;
    }

    const reactionTime = performance.now() - startTime;
    results.push(reactionTime);
    state = "result";

    if (results.length === 3) {
      setPanel("result", formatMilliseconds(reactionTime), "");
      transitionTimeoutId = window.setTimeout(finishSeries, 1500);
    } else {
      setPanel("result", formatMilliseconds(reactionTime), "Tap to continue");
    }
  }

  reactionPanel.addEventListener("pointerdown", handleClick);

  // Initialize HUD
  hudContent.textContent = "3 Rounds. Tap to start.";

  return {
    destroy() {
      cleanupTimers();
      reactionPanel.removeEventListener("pointerdown", handleClick);
    },
  };
}
