
# Plan: Wire SiliconGPT Process Lab to real backend

Goal: replace the seeded-RNG mock in `ProcessLab.tsx` with live calls to the Python/Flask backend at `VITE_BACKEND_URL` (default `http://localhost:5050`). Keep all existing visual design; only swap data sources and add two new pieces (Random import + Batch Eval tab + a health pill).

---

## 1. Files created / modified

| File | Action | Reason |
|---|---|---|
| `src/lib/api.ts` | **create** | Typed fetch client (`jget`/`jpost`/`fpost`) + `api` object with all endpoints and shared TS types (`Prediction`, `Violation`, `AnomalyResult`, eval result types). Exact content from the spec. |
| `src/vite-env.d.ts` | **create** | `/// <reference types="vite/client" />` so `import.meta.env.VITE_BACKEND_URL` is typed. |
| `.env.local` | **create** | `VITE_BACKEND_URL=http://localhost:5050` default. |
| `src/components/dashboard/ProcessLab.tsx` | **modify** | Replace mock logic in 5 tabs, update DEMO tokens to space-form vocab, add Random import mode, add Batch Eval tab, add header health pill, replace hardcoded checkpoint text. |

Nothing else is touched. `GroundTruthComparison.tsx`, `OODDashboard.tsx`, other dashboard pages, and `_app.lab.tsx` layout stay untouched.

---

## 2. Per-tab changes in `ProcessLab.tsx`

Shared cleanup (top of file):
- **Delete**: `seededRand`, `predictTop5`, `ALL_STEPS`.
- **Replace DEMO datasets**: MOSFET / IGBT / IC `steps[]` arrays switched to the space-form vocab from the spec (e.g. `"RECEIVE WAFER"`, `"EXPOSE LITHO LEVEL 1"`). OOD dataset kept as-is (it's just shown in the OOD info area).
- **Update parsers** in `ImportPanel.loadPaste` and `ImportPanel.onFile`: stop replacing internal whitespace with `_`. Tokens are uppercased + trimmed only; line/comma/semicolon are still the row separators. This is required so user-pasted real tokens like `RCA CLEAN` survive.
- **Update `stageOf`**: today it splits on `_`; switch to splitting on first space (and keep underscore fallback for OOD), so chips still color correctly with the new vocab.

### Tab T1 · PredictTab (Predict Next Step)
- Delete: the seeded `predictTop5(prefix, dataset)` call and the artificial 420 ms `setTimeout` inside the `useEffect`.
- Replace with: `api.predictNextStep(prefix, 5)` → `setResults(r.predictions)`. Set `running` true/false around the call; add a `setError` state and surface failures inline.
- Keep: the entire render (`{token, prob}` shape is identical), the bar chart, the "true next" highlight (we can keep highlighting `dataset.steps[cursor+1]` when present).

### Tab T2 · CompleteTab (Complete Sequence)
- Delete: the local autoregressive `tick()` loop that fakes streaming.
- Replace with: single `await api.complete(prefix, { greedy: true })` returning `{ generated }`. Then stagger reveal client-side by pushing tokens into `out` every ~180 ms so the streaming feel is preserved.
- Keep: the visual treatment (token chips animating in, stage labels), the "stop / restart" controls retargeted to start/stop the local reveal interval rather than the fake generator.

### Tab T3 · ValidateTab
- Delete: hardcoded `VAL_RULES` heuristic array and its evaluation logic.
- Replace with: `api.validate(steps)` → render `r.violations[]` (each `{rule, description, step_index, step_name}`) and `r.is_valid`.
- At component mount fetch `api.rules()` once and render the full rule list in the side panel; per rule, mark pass/fail by whether `rule.id` appears in `r.violations`.
- Keep: panel chrome, violation row layout (we already render rule/step pairs — just remap fields).

### Tab T4 · AnomalyTab
- Delete: per-step heatmap heuristics (the model returns one verdict per sequence, not per-step).
- Replace with: `api.anomaly(steps, true)` → render:
  - Big verdict card: `NORMAL` vs `ANOMALY` from `r.is_valid`, confidence = `(r.score*100).toFixed(0)%`.
  - Stats strip: `NLL`, `threshold`, LM-only verdict.
  - Violation list (same component as ValidateTab) and highlight each `step_index` in the sequence chip strip.
- Keep: the chip strip showing the full sequence; just drive its highlight from `violations[].step_index`.

### Tab T5 · OODTab
- Delete: hardcoded `perFamily` numbers.
- Replace with: a small uploader (`<input type="file" accept=".csv">`) + a `task` `<select>` (nextstep / completion / anomaly). On file pick: `api.evalOOD(file, task)` → render a per-family metrics table from `oodResult.metrics` with an `ALL` row pinned at top. Columns depend on task (top1/top3/top5/mrr · exact_match/norm_edit_dist/token_acc · acc/precision/recall/f1/roc_auc/rule_attr).
- Keep: panel chrome and "Held-out families" info block describing what OOD means.

---

## 3. Two new pieces

### A. "Random" import mode (4th tab in ImportPanel)
- Adds a `"random"` mode alongside `demo | paste | upload`.
- Controls: temperature slider 0.4–1.4 (default 0.9) + optional prefix textarea (reuses the paste parser).
- Button "▶ Sample New Recipe" calls `api.generate({ prefix, temperature })`. On success build a synthetic `Dataset` (id `"RANDOM"`, family `"Model Sample"`, node `T=…`, description `"<n>-step random sample · VALID/INVALID"`) and `setSteps(r.full)`. Cheap to add; surfaces the generator endpoint judges expect.

### B. Batch Eval (CSV) — new 6th tab `T6`
- New `TabId "batch"` added to `TABS` (label `"Batch Eval (CSV)"`). `TabBar` grid bumps from `md:grid-cols-5` to `md:grid-cols-6`.
- Body: segmented control (Next-step / Completion / Anomaly) + file input. On file picked, dispatch to `api.evalNextStep | evalCompletion | evalAnomaly`.
- While loading: progress bar + current row count (we only get rows on completion, so progress is indeterminate — see ambiguity #2 below).
- On completion render in order: (i) per-family metrics table with `ALL` pinned, same columns as OOD tab; (ii) latency card (total + per-row avg from `Date.now()` deltas around the fetch); (iii) paginated 50-row per-row results table whose columns depend on task.
- "Download predictions.csv" button: client-side serialization of `rows[]` into the format `predict.py` writes, so the official scorer can be run offline.
- Small "?" tooltip with the CSV column expectations from the spec.

---

## 4. Ambiguities / pushback before implementing

1. **CORS + mixed content when running through Lovable preview.** `http://localhost:5050` will be blocked from the `https://…lovable.app` preview iframe (mixed content) and may also fail CORS. Two workable options — please confirm which:
   - (a) Local-only dev: run both backend and frontend on the user's machine (`bun dev` on localhost:3000) and use the default. Lovable preview won't work until tunneled.
   - (b) Cloudflare quick-tunnel the Flask app (`cloudflared tunnel --url http://localhost:5050`) and set `VITE_BACKEND_URL` to the `https://…trycloudflare.com` URL. Backend must also send `Access-Control-Allow-Origin: *` (or echo origin) on every response, including errors and the OPTIONS preflight. I'll proceed assuming this; if the Flask app isn't CORS-enabled I'll only do the frontend wiring and call this out, not modify backend code (out of repo).
2. **Batch eval progress bar.** The spec says "progress bar + current row count" but the endpoints return everything in one response — there is no streaming/SSE channel. Plan is to show an indeterminate animated bar + spinner + elapsed timer instead of a real percent. If a true progress bar is required we'd need backend SSE support, which is out of scope here.
3. **`OOD` demo tokens.** Spec says "keep OOD demo as-is", but those tokens (`2D_TRANSFER_MoS2`, `BEOL_AIR_GAP`, …) almost certainly hit `<UNK>` against the real vocab too. Fine for the info card, but if a user clicks "OOD demo" then opens Predict/Validate against it they'll get noise. I'll add a small "demo only — not in trained vocab" warning chip on the OOD demo card.
4. **Sequence Explorer cursor recompute.** When `setSteps` is called from Random / Batch / paste, `cursor` may exceed `steps.length-1`. I'll clamp on every steps change (small but the spec doesn't mention it).
5. **Health pill placement.** The existing header strip text is `§ Lab · Primary Workstation` and the checkpoint text `sgpt-v041-ep142` lives in a card lower down. I'll (a) add the pill in the Panel header `meta` slot, (b) swap the checkpoint card text to `basename(h.ckpt_path)` when health resolves, falling back to current text while loading.
6. **`vite-env.d.ts`** may already exist (it's commonly generated). I'll only create it if missing to avoid clobbering.

---

## 5. Assumptions about the current codebase

- `ProcessLab.tsx` is the only place rendering mock model output for these tabs (the file I read confirms the seeded-RNG logic and all 5 tabs live there). `GroundTruthComparison`, `OODDashboard`, `ModelArena`, `LiveMetrics`, etc. stay on their own mock data — out of scope.
- `Panel`, `StatusDot`, `Label` primitives accept the props used (`color="success" | "warning" | "info"` for `StatusDot`); no primitive changes needed.
- `framer-motion` and React 19 are already installed; no new deps.
- Backend endpoints, request bodies, and response shapes match exactly what's documented in the prompt's `api.ts`. I will not modify the backend; if a shape mismatch surfaces at runtime I'll surface the error in the UI and flag it back rather than silently massaging.
- The route `/lab` (`src/routes/_app.lab.tsx`) renders `<ProcessLab />` — already verified. No router changes required.
- Tailwind 4 utility classes used in the spec (`font-mono text-xs uppercase tracking-widest`, etc.) already work in the project.
