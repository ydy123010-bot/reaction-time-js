export function createWhackGame(root, { onComplete }) {
  const panel = root.querySelector("#whack-panel");
  const panelPhase = root.querySelector("#panel-phase");
  const hudContent = root.querySelector("#hud-content");

  // State machine
  let state = "entry"; // "entry" | "playing" | "complete"

  // Game data
  let timeRemaining = 15000; // milliseconds
  let hits = 0;
  let misses = 0;
  let hitTimes = []; // Array of reaction times in milliseconds
  let totalPenaltyTime = 0; // Accumulated penalty time
  let gameStartTime = 0;
  let pixelSpawnTime = 0;
  let currentPixel = null;
  let animationFrameId = null;

  // Constants
  const GAME_DURATION = 10000; // 10 seconds
  const HITBOX_SIZE = 36;
  const MARGIN = 20;
  const SPAWN_DELAY = 250;
  const MISS_PENALTY = 1000;

  function setPanel(panelState, content = {}) {
    state = panelState;
    panel.className = `whack-panel ${panelState}`;

    if (panelState === "entry") {
      panelPhase.textContent = "TAP TO START";
      panelPhase.style.display = "";
      hudContent.textContent = "";
    } else if (panelState === "playing") {
      // Hide panel text during playing so clicks pass through to panel
      panelPhase.style.display = "none";
      // Update HUD with timer and hits
      const timeLeft = Math.max(0, timeRemaining / 1000);
      hudContent.textContent = `${timeLeft.toFixed(1)}s | ${hits} hits`;
    }
  }

  function spawnPixel() {
    if (state !== "playing") return;

    // Remove old pixel if exists
    if (currentPixel) {
      currentPixel.remove();
      currentPixel = null;
    }

    // Calculate random position with margin
    const panelRect = panel.getBoundingClientRect();
    const maxX = panelRect.width - HITBOX_SIZE - MARGIN * 2;
    const maxY = panelRect.height - HITBOX_SIZE - MARGIN * 2;

    const x = MARGIN + Math.random() * Math.max(0, maxX);
    const y = MARGIN + Math.random() * Math.max(0, maxY);

    // Create pixel hitbox wrapper
    const hitbox = document.createElement("div");
    hitbox.className = "pixel-hitbox";
    hitbox.style.position = "absolute";
    hitbox.style.left = `${x}px`;
    hitbox.style.top = `${y}px`;
    hitbox.style.width = `${HITBOX_SIZE}px`;
    hitbox.style.height = `${HITBOX_SIZE}px`;
    hitbox.style.display = "flex";
    hitbox.style.alignItems = "center";
    hitbox.style.justifyContent = "center";

    // Create visual pixel
    const pixel = document.createElement("div");
    pixel.className = "pixel";

    hitbox.appendChild(pixel);
    panel.appendChild(hitbox);
    currentPixel = hitbox;

    // Set spawn time for reaction measurement
    pixelSpawnTime = performance.now();

    // Add hit handler
    hitbox.addEventListener("pointerdown", handleHit);
  }

  function handleHit(event) {
    event.stopPropagation();

    if (state !== "playing" || !currentPixel) return;

    // Calculate reaction time
    const reactionTime = performance.now() - pixelSpawnTime;
    hitTimes.push(reactionTime);
    hits += 1;

    // Play pop animation
    const pixel = currentPixel.querySelector(".pixel");
    pixel.classList.add("hit");

    // Update HUD
    const timeLeft = Math.max(0, timeRemaining / 1000);
    hudContent.textContent = `${timeLeft.toFixed(1)}s | ${hits} hits`;

    // Remove pixel and spawn next after delay
    setTimeout(() => {
      if (currentPixel) {
        currentPixel.remove();
        currentPixel = null;
      }
      spawnPixel();
    }, SPAWN_DELAY);
  }

  function handleMiss(event) {
    if (state !== "playing") return;

    // Increment miss counter
    misses += 1;

    // Add penalty time
    totalPenaltyTime += MISS_PENALTY;

    // Show toast penalty message
    showPenaltyToast();
  }

  function showPenaltyToast() {
    const toast = document.createElement("div");
    toast.className = "penalty-toast";
    toast.textContent = "1s PENALTY";
    panel.appendChild(toast);

    // Auto-remove after animation
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  function updateTimer() {
    if (state !== "playing") return;

    const elapsed = performance.now() - gameStartTime;
    const totalTime = elapsed + totalPenaltyTime;
    timeRemaining = Math.max(0, GAME_DURATION - totalTime);

    // Update HUD
    const timeLeft = timeRemaining / 1000;
    hudContent.textContent = `${timeLeft.toFixed(1)}s | ${hits} hits`;

    if (timeRemaining <= 0) {
      finishGame();
    } else {
      animationFrameId = requestAnimationFrame(updateTimer);
    }
  }

  function finishGame() {
    state = "complete";

    // Clean up
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (currentPixel) {
      currentPixel.remove();
      currentPixel = null;
    }

    // Calculate stats
    const totalAttempts = hits + misses;
    const accuracy = totalAttempts > 0 ? (hits / totalAttempts) * 100 : 0;
    const avgTime =
      hitTimes.length > 0
        ? hitTimes.reduce((sum, t) => sum + t, 0) / hitTimes.length
        : 0;

    // Determine skill badge and description pair based on hits (7 buckets)
    let skillBadge = "Trainee";
    let reactionDescription = "You are reaching unc status";

    if (hits >= 25) {
      skillBadge = "Professional";
      reactionDescription = "You have elite reaction speed";
    } else if (hits >= 20) {
      skillBadge = "Eagle Eye";
      reactionDescription = "Sniped a lot of pixels!";
    } else if (hits >= 14) {
      skillBadge = "Marksman";
      reactionDescription =
        "You may not be a pro athlete, but you sure aren't an unc!";
    } else if (hits >= 9) {
      skillBadge = "Cadet";
      reactionDescription = "Good start, but you can do better.";
    } else {
      skillBadge = "Stormtrooper";
      reactionDescription = "Gotta work on that aim!";
    }

    // Pass data object to onComplete
    onComplete({
      hits,
      misses,
      accuracy,
      avgTime,
      skillBadge,
      reactionDescription,
      hitTimes,
    });
  }

  function startGame() {
    if (state !== "entry") return;

    setPanel("playing");
    gameStartTime = performance.now();
    spawnPixel();
    animationFrameId = requestAnimationFrame(updateTimer);
  }

  // Event listeners
  panel.addEventListener("pointerdown", (event) => {
    if (state === "entry") {
      startGame();
    } else if (state === "playing" && event.target === panel) {
      handleMiss(event);
    }
  });

  // Initialize
  setPanel("entry");

  return {
    destroy() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (currentPixel) {
        currentPixel.remove();
      }
    },
  };
}
