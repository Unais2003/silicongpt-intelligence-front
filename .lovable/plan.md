# Plan — Make the Next-Step Prediction Panel Readable

## Problem
Today the panel renders as a cramped line:
`Predicting after step 5: PHOTORESIST COAT 1 RECEIVE WAFER LOT 100.0% 2 LOT IDENTIFICATION 0.0% …4ms`

There's no visual separation between the header, the five candidates, and the latency. Users can't tell:
- what "next step" means
- which step is the current/observed one
- that the rows are ranked candidates with probabilities
- which one the model is actually picking
- whether any candidate matches the ground-truth next step

## Goal
Turn the block into a clearly labeled "what comes next?" card with an obvious context line, ranked candidates as bars, a highlighted #1 pick, and a ground-truth check.

## New layout (top → bottom)

1. **Context header** — two short lines, plain English:
   - Eyebrow: `NEXT-STEP PREDICTION`
   - Line: `Given step N — "<current step name>", the model ranks the 5 most likely next steps.`

2. **Current → Next visual** — small inline chip pair:
   `[ Step N · CURRENT STEP NAME ]  →  [ Step N+1 · ? ]`
   Makes the "predicting the step after this" idea explicit.

3. **Ranked candidates list (top 5)** — each row:
   - Rank pill (`#1`…`#5`), #1 emphasized
   - Token name (larger, readable)
   - Horizontal probability bar (full-width, not 48px), gradient-filled for #1, muted for the rest
   - Probability % right-aligned, tabular
   - If a candidate matches the true next step: green `✓ matches actual next step` badge on that row
   - Top pick row gets a subtle `bg-surface` background + left accent border so it reads as "the prediction"

4. **Footer meta** — right-aligned, muted:
   `Top-1 confidence 100.0% · inference 4 ms`
   Plus a tiny legend: `✓ = ground-truth next step from the recipe`

## Empty / loading / error states
- Loading: keep skeleton rows but label them `awaiting model…`
- Error: keep current red error line, prefixed `Prediction failed ·`
- No ground-truth match in top-5: show muted note `Actual next step not in top 5`

## Scope
- Single file: `src/components/dashboard/ProcessLab.tsx`, the predictions panel around lines 619–684
- Pure presentation change. No changes to data fetching, server functions, or the prediction logic
- Use existing design tokens (`--info`, `--success`, `surface`, `muted-foreground`) — no new colors
- Keep `motion` entrance animations; widen the probability bar to use available row width

## Out of scope
- Token-square strip and Complete-tab visualization (untouched)
- Backend / model / API
- Other panels in `/lab`
