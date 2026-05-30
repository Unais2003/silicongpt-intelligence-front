## Goal
Move the probability bar from below the token name onto the same row, so each candidate is a single horizontal line: rank · token · bar (fills remaining width) · percentage. Removes the vertical gap currently created by the bar wrapping under the token.

## Change (single file: `src/components/dashboard/ProcessLab.tsx`, lines ~670–728)

Restructure each candidate row in the next-step prediction panel:

Before (stacked):
```
#1  TOKEN NAME ✓               100.0%
    ████████████████████████
```

After (inline):
```
#1  TOKEN NAME ✓  ████████████████  100.0%
```

Specifically, inside the `results.map` row:
- Keep the outer `motion.div` flex row (rank pill + content + percentage).
- Replace the inner `<div className="flex-1 min-w-0">` (which stacked token name above the bar) with a single flex row containing:
  - token name (`truncate`, no longer growing — fixed/auto width via `shrink-0` or `max-w-[40%]`)
  - optional `✓ actual next step` badge (`shrink-0`)
  - probability bar wrapper as `flex-1` (the bar now fills the remaining row width, `h-1.5` unchanged)
- Remove the `mt-1` on the bar wrapper since it's no longer below anything.
- Keep rank pill (`w-7`) and right-aligned `%` column (`w-14`) unchanged.
- Keep top-1 emphasis (`bg-surface`, accent border, larger text on token + %).
- Keep entrance animation and bar fill animation.

## Out of scope
- Header, current→next chips, footer meta, skeleton/error states (unchanged).
- Any other panel or styling token.
