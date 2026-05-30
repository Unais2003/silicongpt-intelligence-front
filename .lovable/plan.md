
## Goal

Turn `/architecture` into a single-page visual model diagram (like ML-paper figures for GPT/LLaMA/Qwen) plus a compact real-results section. Rename the page to "Architecture" (drop "Research"). Remove the existing 8-stage pipeline and the ablation table — the diagram itself is the pipeline.

## Files

- **Rewrite** `src/components/dashboard/ModelArchitecture.tsx` — full visual diagram (centerpiece)
- **Edit** `src/routes/_app.architecture.tsx` — rename, remove `PipelineDiagram`, replace `ExperimentTable` with a real-results block, give the diagram full width with `py-12`

No other files touched. Keep design tokens (`font-mono`, `bg-card`, `border-border`, `--info`, `--success`, etc.). Framer Motion used only for the animated particle and the top-5 bar fills.

---

## 1. New `ModelArchitecture.tsx`

A centered column (`max-w-lg mx-auto`, ~900px tall) of colored rectangles connected by short vertical arrows, with tensor-shape labels on the right of each arrow. A dashed bracket wraps the repeated transformer block (×8). One cyan particle flows top→bottom on the center axis.

### Layout (top → bottom)

1. **Stat row** (always visible, above input strip) — 6 chips in one line: `[25.31M params] [8 layers] [d=512] [8 heads] [vocab 202] [ctx 256]`. `font-mono text-[10px] border border-border bg-card px-2 py-1 rounded-sm`.
2. **Input sequence strip** — label "INPUT SEQUENCE" (`text-[9px] uppercase muted`), then a horizontally scrollable chip row of real MOSFET steps: `RECEIVE WAFER LOT · PRE CLEAN WAFER · RCA CLEAN 1 · RCA CLEAN 2 · HF DIP · THERMAL OXIDATION · [▶ DEPOSIT POLYSILICON] · POLYSILICON ANNEAL · …`. Past chips muted, active chip `bg-[var(--info)] text-white`, future chips `opacity-40`.
3. **Diagram column** (`relative max-w-lg mx-auto`) containing:
   - Tokenizer box (cyan) — "string → ID" arrow label, shape `[B, T]`
   - Token Embedding box (amber) with `★ tied` badge — `202 × 512`
   - Arrow with `[B, T, 512]`
   - **Dashed ×8 bracket** wrapping the 6 sub-blocks:
     - RMSNorm (green, ~36px)
     - Multi-Head Attention (orange) — `8h · 64 · RoPE · Causal`
     - ⊕ residual add
     - RMSNorm (green)
     - SwiGLU FFN (purple) — `512 → 1368 → 512`
     - ⊕ residual add
     - Left side of bracket has rotated `× 8` label (`rotate-[270deg]`, info color)
   - Arrow with `[B, T, 512]`
   - Final RMSNorm (green)
   - LM Head (pink) with `★ same matrix as embedding` — `512 → 202`
   - Arrow with `logits [B, T, 202]`
   - Top-5 Predictions box (green/teal, ~120px) — 5 rows: rank · step name · animated bar · %. Rank 1 = `POLYSILICON ANNEAL 82%` in green, others muted. Bars use Framer Motion staggered width-from-0 animation.
4. **Weight-tie SVG arc** — absolutely positioned on the right of the column, curved dashed pink arc (`stroke="#ec4899" stroke-dasharray="4 3"`) from LM Head box up to Token Embedding box, labeled `★ shared weights`.
5. **Residual SVG** — behind the column, two L-shaped muted gray paths for the two ⊕ adds (drawn at the left of the column).
6. **Animated particle** — `w-3 h-3 rounded-full bg-[var(--info)] shadow-[0_0_8px_var(--info)]` on the center vertical axis. Framer Motion: animate `y` from top of Tokenizer to bottom of Top-5, `duration: 3.5, ease: "linear", repeat: Infinity`.
7. **Parameter breakdown bar** (below diagram) — one horizontal stacked bar split into colored segments (purple SwiGLU 66.1% / orange Attn 33.1% / amber Emb 0.4% / green Norms 0.03%), with tiny labels above each segment and `25.31M total parameters` under it.

### Rectangle spec

- ~320px wide, ~52px tall (RMSNorm shorter ~36px), `rounded-md`, `border` 1px, **3px colored left border**, very subtle bg tint of the same color
- Line 1: name — `font-mono text-xs font-semibold uppercase`
- Line 2: dimension/formula — `font-mono text-[10px] text-muted-foreground`
- Param count: absolutely positioned right, `font-mono text-[9px] text-muted-foreground`

### Colors

| Block | Color | Hex |
|---|---|---|
| Tokenizer | cyan | `var(--info)` |
| Embedding + LM Head | amber/pink | `#f59e0b` / `#ec4899` |
| RMSNorm | green | `#22c55e` |
| Attention | orange | `#f97316` |
| SwiGLU FFN | purple | `#a855f7` |

Each rectangle gets a `bg-{color}/8` tint (use inline `style={{ backgroundColor: "color-mix(in oklab, #f59e0b 8%, transparent)" }}` to avoid adding tailwind classes).

### Arrows

Between each pair of boxes: a 24px vertical line (`w-px h-6 bg-border-strong` centered) + `▼` arrowhead. Tensor shape label on the right (`absolute right-0 font-mono text-[9px] text-muted-foreground`).

### Rules

- NO expandable cards, NO long descriptions, max 2 lines of text per box.
- All text `font-mono`, 9–12px.
- Framer Motion only for: particle loop + top-5 bar fills.

---

## 2. `_app.architecture.tsx` edits

- `head().meta.title` → `"Architecture — SiliconGPT"`
- `head().meta.og:title` → `"Architecture — SiliconGPT"`
- Update description to match the new focus on the diagram
- `PageHeader.kicker` → `"§ 03 · Architecture"`
- **Remove**: `Stage`, `V`, `pipeline`, `PipelineDiagram`, `experiments`, `ExperimentTable`, the `§ Pipeline` and `§ Transformer` section headings
- **Page body** becomes:

  ```tsx
  <main className="flex-1">
    <PageHeader ... />
    <div className="px-4 md:px-6 lg:px-8 py-12">
      <ModelArchitecture />
    </div>
    <div className="px-4 md:px-6 lg:px-8 py-10 space-y-10">
      <ResultsSection />
    </div>
    <PageFooter />
  </main>
  ```

### New `ResultsSection` (inline in the route file)

Two side-by-side panels on `md+`, stacked on mobile, plus an anomaly metric strip.

**Task 1 — Next-Step Prediction** (`Panel title="TASK 1 · NEXT-STEP" meta="n=3,600"`):
Compact table — columns: Family, Top-1, Top-3, Top-5, MRR. Rows:

| | Top-1 | Top-3 | Top-5 | MRR |
|---|---|---|---|---|
| ALL | 0.807 | 0.997 | 1.000 | 0.901 |
| mosfet | 0.812 | 0.996 | 1.000 | 0.904 |
| igbt | 0.821 | 0.998 | 1.000 | 0.909 |
| ic | 0.789 | 0.996 | 0.999 | 0.891 |

ALL row gets `bg-accent/40 font-semibold`.

**Task 3 — Anomaly Detection** (`Panel title="TASK 3 · ANOMALY" meta="n=1,000"`):
Three large metric tiles in a grid (not a table):

- `F1` — `1.000`
- `ROC-AUC` — `0.997`
- `Rule Attribution` — `1.000`

Each tile: `font-mono`, big number (`text-3xl tabular`), small label above. Same visual treatment as `LiveMetrics` mini-stats.

(Task 2 omitted — not provided by the user.)

---

## Out of scope

- Other dashboard components, lab page, overview page.
- Any backend or data changes.
- Tailwind config / theme token additions (use inline `style` for hex tints).
