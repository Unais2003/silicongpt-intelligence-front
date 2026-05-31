## Goal

Replace the current vertical "Pipeline · 8 agents + supervisor + config" panel (Panel 1 in `CoScientistDiagram.tsx`, rendered on `/architecture`) with a proper 2D block diagram that mirrors the Google AI co-scientist layout you attached — but extended to show how our **GPU Experiment Agent** plugs into the loop.

Only Panel 1 changes. The Tier ladder, Results table, and Architecture diff stay as-is.

## Layout (matches the reference)

```text
                                                                 ┌────────────────────────┐
 Scientist ──► Research goal ──► Configuration ──► Supervisor ──►│ Research overview +    │
     │                                              agent        │ chosen architecture    │
     │                                                │          └────────────────────────┘
     ▼                                  Assign agents │ to workers           ▲
 Additional                                           ▼                      │
 feedback ─┐                  ┌──────────────────────────────────────┐  ┌─────────┐
           │                  │       AI co-scientist specialists    │  │ Worker  │
           │                  │                                      │  │ Worker  │
           │                  │  Generation  ⇄  Proximity            │──│ Worker  │
           │                  │      ⇅           ⇅                   │  │ Worker  │
           └─────────────────►│  Reflection  ⇄  Meta-review          │  └─────────┘
                              │      ⇅      ╳    ⇅                   │
                              │  Ranking    ⇄  Evolution             │       ▲
                              │                                      │       │
                              │  ─────────────────────────────────   │  ┌─────────┐
                              │  GPU Experiment Agent (our addition) │──│ Context │
                              │  smoke run → 3-fold OOD on A100      │  │ Memory  │
                              └──────────────────────────────────────┘  └─────────┘
```

Key fidelity points to the reference:
- **Top row left→right**: Scientist · Research goal · Configuration · Supervisor agent · Research overview.
- **Left side**: Scientist feeds "Additional feedback" downward into the specialists box (Reflection edge).
- **Right side**: Supervisor → Worker stack; Context Memory sits below it, connected to the specialists box.
- **Center box** "AI co-scientist specialists" holds the 6 original agents in a 2×3 grid with red bidirectional arrows (↕ ↔ ╳) exactly like the paper.
- **Distinct sub-panel inside the same box**: the **GPU Experiment Agent**, separated by a divider, with an amber border to mark it as our extension. An arrow shows it consumes Worker GPUs and writes back to Context Memory.
- Feedback loop arrow from "Research overview" back to Scientist (matches reference's long top arc).

## Visual system

- Use existing semantic tokens (`border`, `bg-card`, `bg-surface`, `text-muted-foreground`). No raw hex.
- Color coding kept consistent with the rest of the page:
  - blue tint = system I/O (Research goal, Research overview)
  - neutral/strong = orchestrator (Supervisor, Worker, Context Memory)
  - soft card = the 6 stock agents
  - amber = GPU Experiment Agent (our unique addition, matches §03 styling)
- Arrows drawn with CSS borders and small ▲▼◀▶ glyphs (same primitives the file already uses) — no SVG library needed. Bidirectional arrows between specialists rendered as `⇄` / `⇅` text glyphs styled in a subtle red/destructive tint to echo the reference.
- Responsive: on `md+` show the full 2D grid; on mobile collapse to a single vertical column (Scientist → goal → config → supervisor → specialists box → workers → output) so it stays readable on phones.

## Implementation

Single file edit: `src/components/dashboard/CoScientistDiagram.tsx`.

1. Delete `MainPipeline`, `ForkBetweenReflectionAndExperiment`, the old `Node`/`Arrow` linear renderer, and the `NODES` array (only used by Panel 1).
2. Add a new `DiscoveryLoopDiagram` component built from small subcomponents:
   - `TopRow` — Scientist · Research goal · Configuration · Supervisor · Research overview, with horizontal arrows and the long feedback arc back to Scientist.
   - `SpecialistsBox` — bordered container titled "AI co-scientist specialists" with:
     - 2×3 CSS grid of the 6 stock agents (Generation, Proximity, Reflection, Meta-review, Ranking, Evolution) each as a small chip with name + 1-line role.
     - Bidirectional arrow overlays between row/column neighbors.
     - A divider, then the **GPU Experiment Agent** chip styled amber with `NEW` badge, one-line role, and small caption "Tiered validation → see panel below".
   - `WorkersColumn` — stacked Worker chips + Context Memory chip on the right, with arrows into/out of the specialists box.
   - `FeedbackColumn` — "Additional feedback" chip on the left feeding into the specialists box.
3. Wire `CoScientistDiagram` Panel 1 to render `<DiscoveryLoopDiagram />` instead of `<MainPipeline />`. Update the panel kicker text from "Pipeline · 8 agents + supervisor + config" to "Multi-agent discovery loop · 6 specialists + GPU Experiment Agent".
4. Keep Panels 2 and 3 (TierLadder, ResultsTable, ArchitectureDiff) unchanged — the experiment-tier detail still lives there.

No changes to `DiscoveryArchitecture.tsx`, routes, or other components. No new dependencies.

## Verification

- Build succeeds.
- `/architecture` shows the new 2D diagram with the same overall shape as the reference, plus the GPU Experiment Agent visibly attached.
- Mobile viewport collapses to a clean vertical stack.
- No console / runtime errors.
