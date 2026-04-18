# Plan: Convert Reaction Lab to Student Starter Project

## Overview

Transform the working reaction-time game into a student starter project with **7 meaningful TODO blocks** across HTML (2), CSS (2), and JS (3). The starter code will remain syntactically valid while guiding students through building a complete game.

## Student Profile
- Knows: HTML structure, flexbox/grid, CSS selectors, JS conditionals/loops/arrays/objects/events
- Learning: Screen transitions, state management, game timing, DOM manipulation

## File Structure

Keep 3 files only:
- `index.html` (81 lines) → Add 2 TODO blocks
- `styles.css` (368 lines) → Add 2 TODO blocks
- `app.js` (260 lines) → Add 3 TODO blocks

## TODO Block Distribution

### HTML: 2 Blocks

**TODO 1: Build Start Screen**
```html
<!-- TODO START: Create intro <p class="intro"> explaining game rules + start <button> with class="hover-button" id="start-button" -->
<!-- END -->
```

**TODO 2: Build Results Display**
```html
<!-- TODO START: Create .stoplight-results > .hero-stats (average-time, reaction-percentile, reaction-description) + .rounds > 3 .round-box divs (each with .round-label and .round-time data-round-time) -->
<!-- END -->
```

### CSS: 2 Blocks

**TODO 3: Style Buttons**
```css
/* TODO START: Style .hover-button - base (border, cursor, font, padding, border-radius, background, color, border, shadow, transitions) + ::before pseudo-element (gradient overlay, opacity 0→1 on hover) + :hover (color change, translateY) */
/* END */
```

**TODO 4: Style Game States**
```css
/* TODO START: .game-panel.entry (gray gradient) .waiting (wait-gray) .ready (green) .result (blue gradient) .early (red + shake animation) + @keyframes shake (translateX oscillation) */
/* END */
```

### JS: 3 Blocks

**TODO 5: Screen Transitions**
```javascript
/* TODO START: showStartScreen() - cleanup, reset vars, remove playing-mode, show start/hide others, enable button, setPanel entry. startGame() - cleanup, reset vars, add playing-mode, hide start/results, show playing, disable button, queueNextRound */
// END
```

**TODO 6: Round Timing**
```javascript
/* TODO START: queueCurrentRound() - set state waiting, setPanel waiting, setTimeout with random delay (WAIT_MIN_MS + Math.random() * WAIT_RANDOM_MS) then set state ready, startTime = performance.now(), setPanel ready. queueNextRound() - increment round, call queueCurrentRound */
// END
```

**TODO 7: Click Handler**
```javascript
/* TODO START: handlePanelPointerDown() - if result/early: finishSeries if done, else retry/next. if waiting: cleanup, state early, setPanel early. if not ready: return. if ready: calc time, push to results, state result, setPanel result, setTimeout finishSeries if done else setPanel with next round instruction */
// END
```

## Scaffolding Strategy

### Keep Instructor-Provided

**Constants & Setup:**
- All constants (TOTAL_ROUNDS, delays)
- All DOM references
- All state variables

**Helper Functions:**
- `formatMilliseconds()` - utility
- `calculatePercentile()` - math formula
- `getReactionDescription()` - descriptive text
- `cleanupTimers()` - memory management
- `resetShareButton()` - UI helper
- `clearResults()` - DOM clearing
- `setPanel()` - UI abstraction

**Complex Features:**
- `finishSeries()` - results calculation + rendering (too complex)
- Share button handler - async/await (beyond student level)
- Event listener wiring - show the pattern

**HTML/CSS Scaffolding:**
- Playing state section (complex nested structure)
- Results action buttons
- CSS variables, resets, base layout
- Game container/HUD structure
- Footer, responsive breakpoints

## Implementation Steps

### 1. Add Teacher Notes
Add brief comment at top of each file explaining what students will build.

### 2. Transform index.html

Use concise TODO format:
```html
<!-- TODO START: Build start screen (intro paragraph + start button) -->
<!-- END -->

<!-- TODO START: Build results display (hero stats + 3 round boxes) -->
<!-- END -->
```

### 3. Transform styles.css

Use concise TODO format:
```css
/* TODO START: Style .hover-button with base styles, ::before gradient, hover effects */
/* END */

/* TODO START: Style game panel states (.entry, .waiting, .ready, .result, .early) + shake animation */
/* END */
```

### 4. Transform app.js

Use concise TODO format:
```javascript
/* TODO START: Implement showStartScreen() and startGame() for screen transitions */
// END

/* TODO START: Implement queueCurrentRound() and queueNextRound() with setTimeout and random delays */
// END

/* TODO START: Implement handlePanelPointerDown() state machine (5-way decision tree) */
// END
```

### 5. Create Solution Folder

Create `/solution/` folder with complete working versions:
- `solution/index.html` - Full HTML with all sections
- `solution/styles.css` - Complete styles
- `solution/app.js` - Complete game logic

### 6. Validation

After transformation:
1. Serve with static server
2. Verify HTML/CSS/JS parse without errors
3. Check that page renders with scaffolded layout
4. Confirm buttons appear but don't function yet

## Teaching Progression

**Recommended student order:**

1. **HTML TODOs (1-2)**: Build structure → See elements appear
2. **CSS TODOs (3-4)**: Add visual design → See styled UI
3. **JS TODO 5**: Screen transitions → Navigation works
4. **JS TODO 6**: Waiting logic → Timing works
5. **JS TODO 7**: Click handler → Game complete

## Critical Files

- `/Users/jasonhwang/src/aca/_courses/reaction-time-demo-js/index.html`
- `/Users/jasonhwang/src/aca/_courses/reaction-time-demo-js/styles.css`
- `/Users/jasonhwang/src/aca/_courses/reaction-time-demo-js/app.js`

## Syntax Validation Strategy

- **HTML**: Use comment blocks inside valid elements
- **CSS**: Use empty rulesets with comments
- **JS**: Use empty function bodies with instructional comments

## Testing Checkpoints

After each TODO:
- **TODO 1-2**: Elements visible in browser
- **TODO 3**: Buttons have hover effects
- **TODO 4**: Panel shows correct colors per state
- **TODO 5**: Screens transition on button clicks
- **TODO 6**: WAIT → TAP! transition works
- **TODO 7**: Full game loop functional
