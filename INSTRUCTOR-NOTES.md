# Reaction Lab - Instructor Notes

## Project Overview

This is a student starter project for building a reaction-time game. Students will complete **6 TODOs** across HTML, CSS, and JavaScript to create a fully functional game.

## Key Changes from Original

### Simplified Architecture
- **Removed**: Complex state machine with 7 states
- **Replaced with**: Round counter + boolean flag pattern
  - `currentRound` (0-3)
  - `isReady` (true/false)
  - `startTime` (milliseconds)
  - `results` (array of times)

### Benefits of Simplification
- ✅ Core timing logic is more visible
- ✅ Easier to debug (`console.log(isReady)`)
- ✅ Students focus on `performance.now()` calculations
- ✅ No "state" string magic - just simple booleans

## TODO Structure

### HTML (2 TODOs)
1. **Wire up start button** - Already exists, just needs JS connection
2. **Build results display** - Create hero-stats and rounds containers

### CSS (2 TODOs)
3. **Style results display** - Flexbox layout for hero-stats, rounds, round-box
4. **Style game panel states** - 5 color states (entry, waiting, ready, result, early)

### JavaScript (2 TODOs)
5. **Screen transitions** - Complete `startGame()`, `showResults()`, `showStartScreen()`
6. **Timing logic** - Add 2 lines: capture `startTime`, calculate `reactionTime`

## Teaching Strategy

### Recommended Order
1. **Task 1** (HTML + JS) → Get start button working
2. **Task 2** (HTML) → Build results structure
3. **Task 3** (CSS) → Style results with flexbox
4. **Task 4** (CSS) → Add game panel colors
5. **Task 5** (JS) → Complete screen transitions
6. **Task 6** (JS) → Add timing calculations

### Key Learning Moments

**Task 3 - Flexbox:**
- First time many students use flexbox for real layouts
- Emphasize `display: flex`, `flex-direction`, `gap`, `flex: 1`
- Show how padding/margin/border work together

**Task 4 - CSS State Classes:**
- Understand how JavaScript changes classes
- See immediate visual feedback
- Learn gradient backgrounds

**Task 6 - Timing Logic:**
- Core programming concept: time deltas
- `performance.now()` returns milliseconds since page load
- Calculation: `currentTime - startTime = elapsed time`

## Common Student Mistakes

### HTML
- ❌ Forgetting `id` attributes on results elements
- ❌ Wrong class names (`.hero-stats` not `.hero-stat`)
- ✅ Remind: Check browser console for missing element errors

### CSS
- ❌ Missing semicolons or closing braces
- ❌ Wrong selectors (`.rounds .round-box` vs `.round-box`)
- ❌ Forgetting `display: flex` on container
- ✅ Remind: Use DevTools to inspect computed styles

### JavaScript
- ❌ Not capturing `startTime` before showing "TAP!"
- ❌ Forgetting to push to `results` array
- ❌ Using `=` instead of `===` in comparisons
- ✅ Remind: Use `console.log()` to debug variables

## Helper Functions (Pre-built)

Students DON'T need to modify these:

- `formatMilliseconds()` - Converts 234.567 → "235 ms"
- `calculatePercentile()` - Math formula for ranking
- `getReactionDescription()` - Returns encouraging message
- `setPanel()` - Updates game panel UI (abstraction layer)

## Starter Code Features

**What's Provided:**
- All DOM element references
- Constants (TOTAL_ROUNDS, delays)
- Helper functions
- Event listeners (already wired up)
- Share button functionality (async/await)
- Partial function structures with comments

**What Students Build:**
- Screen transition logic
- Results display structure
- Flexbox layouts
- Game panel state styling
- Core timing calculation (2 lines!)

## Testing Checklist

After each task:

- [ ] **Task 1**: Click start → Playing screen appears
- [ ] **Task 2**: Results elements visible in DOM
- [ ] **Task 3**: Results page has styled layout
- [ ] **Task 4**: Game panel changes colors (gray → green)
- [ ] **Task 5**: Screens transition correctly
- [ ] **Task 6**: Reaction times display accurately

## Troubleshooting Guide

### "Button doesn't work"
- Check: Is `startGame()` complete?
- Check: Event listener at bottom of file
- Check: Browser console for errors

### "Times are NaN or undefined"
- Check: Did they capture `startTime`?
- Check: Did they calculate `reactionTime`?
- Check: Did they push to `results` array?

### "Screens don't switch"
- Check: `.add("hidden")` and `.remove("hidden")`
- Check: Correct element references
- Check: No typos in variable names

### "Colors don't appear"
- Check: CSS syntax (semicolons, braces)
- Check: Correct class names (`.game-panel.ready`)
- Check: CSS file is linked in HTML

## Extension Ideas (After Completion)

For advanced students:

1. **Add difficulty levels** - Shorter delays for "hard mode"
2. **Best score tracking** - Use `localStorage`
3. **Sound effects** - Add audio on click
4. **Leaderboard** - Display top 5 times
5. **Custom themes** - CSS variable overrides

## File Structure

```
reaction-time-demo-js/
├── index.html          # Starter (62 lines, 2 TODOs)
├── styles.css          # Starter (320 lines, 2 TODOs)
├── app.js              # Starter (167 lines, 2 TODOs)
├── solution/           # Complete reference
│   ├── index.html     # Full solution
│   ├── styles.css     # Full solution
│   └── app.js         # Full solution
├── README.md          # Student guide
└── INSTRUCTOR-NOTES.md # This file
```

## Estimated Time

- **Fast students**: 1.5-2 hours
- **Average students**: 3-4 hours
- **Struggling students**: 5-6 hours (with help)

## Prerequisites

Students should know:
- HTML structure and attributes
- CSS selectors and properties
- JavaScript variables and functions
- DOM manipulation basics
- Event listeners

## Learning Outcomes

By the end, students will:
- ✅ Build multi-screen applications
- ✅ Use flexbox for responsive layouts
- ✅ Implement timing logic with `performance.now()`
- ✅ Understand state-based UI changes
- ✅ Debug with browser console
- ✅ Apply CSS transitions and animations

---

**Ready to use with students!** All files validated and tested.
