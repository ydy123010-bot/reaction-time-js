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

  function calculateTopPercent(time) {
    const slope = 98 / 240; // 0.408333
    const intercept = 1 - (slope * 160); // -64.3333

    let topX = (slope * time) + intercept;

    // Clamp the values between 1 and 99
    // Math.ceil is used so Top 1% remains exclusive to the best scores
    return Math.max(1, Math.min(99, Math.ceil(topX)));
  }

  function finishSeries() {
    cleanupTimers();

    const average =
      results.reduce((sum, time) => sum + time, 0) / results.length;
    const fastest = Math.min(...results);
    const slowest = Math.max(...results);
    const topPercent = calculateTopPercent(average);

    // Determine reaction description based on average time (7 buckets)
    let reactionDescription = "You are reaching unc status";
    if (average < 180) reactionDescription = "You have elite reaction speed!";
    else if (average < 200)
      reactionDescription =
        "Dang. That was insane, you have lightning reflexes.";
    else if (average < 225) reactionDescription = "Very impressive.";
    else if (average < 275)
      reactionDescription = "Nice work, that was good focus.";
    else if (average < 300)
      reactionDescription = "Nice, this is an average reaction time.";
    else if (average < 350) reactionDescription = "Not too shabby.";
    else
      reactionDescription = "Need a bit of practice, but you have potential.";

    onComplete({
      average,
      topPercent,
      reactionDescription,
      fastest,
      slowest,
      results,
    });
  }

  function queueCurrentRound() {
    state = "waiting";
    setPanel("waiting", `WAIT`, "");

    const delay = 2000 + Math.random() * 1750;
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
        if (state === "early") {
          queueCurrentRound(); // Retry same round
        } else {
          queueNextRound(); // Go to next round
        }
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
