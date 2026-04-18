# Reaction Lab - Student Starter Project

Build a reaction-time game that measures how fast you can click when the screen turns green.

## Setup

1. Open with Live Server in VSCode
2. Complete tasks below in order
3. Test after each task

## Tasks

**index.html**
- 1. Build `.hero-stats` div containing `#average-time`, `#reaction-percentile`, `#reaction-description`
- 2. Build `.rounds` div with 3 `.round-box` divs (each has `.round-label` + `.round-time[data-round-time]`)

**styles.css**
- 3. Style `.hero-stats` - display: flex, flex-direction: column, align-items: center, gap: 8px
- 4. Style `.rounds` - display: flex, gap: 12px
- 5. Style `.round-box` - flex: 1, padding: 16px, text-align: center, background: rgba(16, 229, 117, 0.1), border: 1px solid var(--green), border-radius: 8px
- 6. Style game panel states - `.game-panel.entry` (gray gradient), `.waiting` (var(--wait-gray)), `.ready` (var(--green)), `.result` (blue gradient), `.early` (var(--red) + shake animation)

**app.js**
- 7. Implement `calculateAverage(times)` - use a for loop to sum values, divide by length
- 8. Implement `getReactionTime(startTime)` - return `performance.now() - startTime`
- 9. Implement `updateResultsDisplay(average, times)` - update DOM elements using helper functions

## Key Variables

- `currentRound` - current round (1-3)
- `isReady` - can user click?
- `startTime` - when green appeared
- `results` - array of times

## Helper Functions (already provided)

- `formatMilliseconds(value)` - converts 234.5 to "235 ms"
- `calculatePercentile(time)` - returns percentile ranking (1-99)
- `getReactionDescription(average)` - returns encouraging message
