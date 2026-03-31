# Plan: Standardized Game HUD Architecture

## Objective
Add a standardized status bar (HUD) at the top of every game screen to display game-specific information (round progress, timer, score, etc.) while keeping the play area clean and focused.

## User Requirements
- **Every game has a HUD** - Consistent status bar at top of game area
- **Fixed HUD height** - Same height across all games for visual consistency
- **Make screen taller** - Increase game container height to accommodate HUD
- **Only 2 games**: Stoplight and Whack (remove Stroop)
- **Game-specific HUD content:**
  - **Stoplight**: Round progress (e.g., "Round 1 of 5")
  - **Whack**: Time remaining and hit count (e.g., "15.0s | 8 hits")

## Benefits
- Clean separation between game status and play area
- Consistent visual structure across all games
- Easier to scan game state at a glance
- Extensible for future games
- Cleaner play area focused on core interaction

## Current State vs. New State

### Stoplight
**Current**: No visible round progress, self-contained panel
**New**: HUD shows "Round 1 of 5", panel remains focused on reaction task

### Whack
**Current**: Timer and hits displayed inside play area during game
**New**: HUD shows "15.0s | 8 hits", play area shows only grid and pixel

## Architecture Design

### Template Structure (All Games)
```html
<div class="game-container">
  <div class="game-hud" id="game-hud">
    <div class="hud-content" id="hud-content">
      <!-- Game-specific content populated by JS -->
    </div>
  </div>
  <div class="game-panel-wrapper">
    <!-- Existing game panel (button or div) -->
  </div>
</div>
```

### CSS Structure
```css
.game-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 420px; /* Increased from 360px */
}

.game-hud {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.hud-content {
  font-size: 1rem;
  color: var(--muted);
  letter-spacing: 0.05em;
}

.game-panel-wrapper {
  flex: 1;
  display: flex;
  align-items: stretch;
}

.game-panel-wrapper > * {
  flex: 1;
}
```

## Implementation Plan

### Phase 1: Update Stoplight Template & JS

**File: `games/stoplight.html`**
```html
<div class="game-container">
  <div class="game-hud" id="game-hud">
    <div class="hud-content" id="hud-content"></div>
  </div>
  <div class="game-panel-wrapper">
    <button class="reaction-panel entry" id="reaction-panel" type="button">
      <span class="panel-phase" id="panel-phase">TAP TO START</span>
      <span class="panel-instruction" id="panel-instruction"></span>
    </button>
  </div>
</div>
```

**File: `games/stoplight.js`**
- Add HUD reference: `const hudContent = root.querySelector("#hud-content")`
- Update HUD on each round: `hudContent.textContent = "Round 1 of 5"` or `"Round 1 / 5"`
- Clear HUD during entry state

### Phase 2: Remove Stroop Game

**Files to delete:**
- `games/stroop.html`
- `games/stroop.js`

**File: `app.js`**
- Remove stroop import: `import { createStroopGame } from "./games/stroop.js";`
- Remove stroop from gameRegistry
- Remove stroop button from mode selection (if needed)

**File: `styles.css`**
- Remove all stroop-specific styles (.stroop-panel, .stroop-round, .stroop-word, etc.)

**File: `index.html`**
- Remove stroop mode button from selection screen

### Phase 3: Update Whack Template & JS

**File: `games/whack.html`**
```html
<div class="game-container">
  <div class="game-hud" id="game-hud">
    <div class="hud-content" id="hud-content"></div>
  </div>
  <div class="game-panel-wrapper">
    <button class="whack-panel entry" id="whack-panel" type="button">
      <span class="panel-phase" id="panel-phase">TAP TO START</span>
      <span class="panel-instruction" id="panel-instruction"></span>
    </button>
  </div>
</div>
```

**File: `games/whack.js`**
- Add HUD reference: `const hudContent = root.querySelector("#hud-content")`
- During entry state: Hide or clear HUD
- During playing state: Update HUD with timer and hits
  - Format: `"15.0s | 8 hits"` or `"Time: 15.0s  •  Hits: 8"`
- Remove timer/hits from panel-phase and panel-instruction during playing
- Use panel-phase/panel-instruction only for entry state ("TAP TO START")

### Phase 4: Update CSS

**File: `styles.css`**

Add game container and HUD styles:
```css
.game-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 420px;
  border-radius: 8px;
  overflow: hidden;
}

.game-hud {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.hud-content {
  font-size: 1rem;
  color: var(--muted);
  letter-spacing: 0.05em;
  font-weight: 500;
}

.game-panel-wrapper {
  flex: 1;
  display: flex;
  align-items: stretch;
}

.game-panel-wrapper > * {
  flex: 1;
  border-radius: 0; /* Remove border-radius since container handles it */
}
```

Update existing panel styles:
```css
.reaction-panel,
.stroop-panel,
.whack-panel {
  /* Remove min-height: 360px */
  /* Panels now flex to fill available space */
}
```

Mobile adjustments:
```css
@media (max-width: 640px) {
  .game-container {
    min-height: 380px; /* Slightly shorter on mobile */
  }

  .game-hud {
    height: 50px;
  }

  .hud-content {
    font-size: 0.9rem;
  }
}
```

## HUD Content Formats

### Stoplight
- Entry: "" (empty or "Tap to start")
- Playing: "Round 1 of 5" or "Round 1 / 5"
- Between rounds: "Round 2 of 5"

### Whack
- Entry: "" (empty)
- Playing: "15.0s | 8 hits" or "Time: 15.0s  •  Hits: 8"
- Updates every frame (timer) and on each hit

## Files to Modify/Delete

### To Modify:
1. **games/stoplight.html** - Add game-container wrapper and HUD
2. **games/stoplight.js** - Update to populate HUD with round progress
3. **games/whack.html** - Add game-container wrapper and HUD
4. **games/whack.js** - Update to populate HUD with timer/hits, clean up panel content
5. **index.html** - Remove Stroop button from mode selection
6. **app.js** - Remove Stroop import and gameRegistry entry
7. **styles.css** - Add game-container and HUD styles, update panel styles, remove Stroop styles

### To Delete:
1. **games/stroop.html**
2. **games/stroop.js**

## Verification Checklist

### Stroop Removal
- [ ] Stroop files deleted (stroop.html, stroop.js)
- [ ] Stroop button removed from index.html
- [ ] Stroop import removed from app.js
- [ ] Stroop styles removed from styles.css
- [ ] Only 2 game buttons visible: Stoplight and Whack

### Visual Consistency
- [ ] Both games have HUD with same height (60px desktop, 50px mobile)
- [ ] HUD has consistent background and border styling
- [ ] Game containers are taller to accommodate HUD (420px desktop, 380px mobile)

### Stoplight
- [ ] HUD shows "Round X of 5" during gameplay
- [ ] HUD clears or shows instructions during entry state
- [ ] Panel remains focused on reaction task

### Whack
- [ ] HUD empty during entry state
- [ ] HUD shows timer and hit count during playing state
- [ ] Timer updates smoothly in HUD
- [ ] Hit count updates in HUD on each hit
- [ ] Panel shows only "TAP TO START" during entry
- [ ] Panel shows grid and pixel during playing (no timer/score overlay)

### Responsive
- [ ] HUD scales down appropriately on mobile
- [ ] Both games remain playable on mobile with HUD

## Implementation Order

1. **Remove Stroop** - Delete files, remove from app.js and index.html, remove styles
2. **CSS first** - Add game-container and HUD base styles
3. **Stoplight** - Simplest game, establish the HUD pattern
4. **Whack** - Move timer/hits to HUD, clean up play area

This ensures we simplify the codebase first, then build the HUD architecture systematically.
