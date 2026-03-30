# Plan: Curved Sliding Hover Effect for Mode Buttons

## Objective
Replace the current left-to-right sliding hover effect on `.mode-button` with a curved/arch sliding effect that transitions from bottom to top with a wave-like appearance.

## Current Implementation
The mode buttons currently use a `::before` pseudo-element that:
- Starts with `width: 0` and `left: 0`
- Expands to `width: 100%` on hover
- Creates a left-to-right sliding effect

## Proposed Implementation

### Changes to `.mode-button::before` in styles.css (around line 163-173)

Replace the current implementation with:
```css
.mode-button::before {
    content: "";
    position: absolute;
    top: 120%;  /* Start below the button */
    left: -10%;
    width: 120%;
    height: 200%;
    background: linear-gradient(135deg, var(--cyan), var(--blue));
    border-radius: 40%;  /* Creates the arch/curve */
    transition: transform 0.6s ease-in-out;
    z-index: 0;
}
```

### Changes to `.mode-button:hover::before`

Replace:
```css
.mode-button:hover::before {
    width: 100%;
}
```

With:
```css
.mode-button:hover::before {
    transform: translateY(-110%);  /* Slide the arch up */
}
```

### Files to Modify
- `/Users/jasonhwang/src/aca/_demos/reaction-time-demo/styles.css` (lines ~163-177)

## Implementation Details

1. The `::before` pseudo-element will be positioned below the button initially (`top: 120%`)
2. It will be larger than the button (`width: 120%`, `height: 200%`) to ensure full coverage
3. The `border-radius: 40%` creates the curved/wave effect
4. On hover, `translateY(-110%)` slides it upward, creating a bottom-to-top transition with a curved leading edge
5. Keep all other styling (color inversion, z-index, overflow hidden, etc.) as-is

## Verification
1. Open the page in a browser
2. Hover over any of the three test buttons (Stoplight, Color Match, Whack a Pixel)
3. Verify the background slides up from the bottom with a curved wave effect
4. Verify the text color inverts properly during the animation
5. Verify the animation is smooth and completes in ~0.6 seconds

## Notes
- The effect uses pure CSS with no JavaScript changes needed
- The curved transition is more visually interesting than a straight slide
- All existing functionality remains unchanged
