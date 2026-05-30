
## Goal

Make each layer type in the architecture diagram visually distinct by **shape and size**, like real ML-paper figures (Attention is All You Need, LLaMA, Qwen). Keep the current color palette unchanged. Only `src/components/dashboard/ModelArchitecture.tsx` is touched.

## Shape vocabulary per block type

Each block type gets its own silhouette so you can read the diagram at a glance without reading text. The center column stays the same width (~320px); shapes vary in width, height, corner treatment, and accent geometry.

| Block | Shape | Why |
|---|---|---|
| **Tokenizer** | Wide rounded pill (full width, 40px tall, fully rounded ends `rounded-full`) | Input gateway — flat & wide, "entry point" feel |
| **Token Embedding** | Trapezoid (wider at top, narrower bottom, ~56px tall) via `clip-path` | Standard ML-paper convention for embedding/projection layers |
| **RMSNorm** | Thin horizontal bar (full width, 22px tall, no inner text — name shown on the side, small) | Normalization is "lightweight" — thinness shows it isn't a heavy compute layer |
| **Multi-Head Attention** | Tall hexagon (~280px wide, 72px tall) with notched left+right sides via `clip-path: polygon(...)` | Distinctive multi-port silhouette, evokes the multi-head "split & gather" |
| **SwiGLU FFN** | Inverse trapezoid / "bowtie middle" — narrow at the edges, wide in the middle (~76px tall) using `clip-path` | Visualizes the up-projection 512 → 1368 → 512 |
| **Final RMSNorm** | Same thin bar as RMSNorm | Consistency |
| **LM Head** | Inverted trapezoid (narrower at top, wider at bottom, ~56px tall) — mirror of embedding | Symmetry with embedding (tied weights = mirrored shape) |
| **Top-5 Predictions** | Wide rounded card (full width, ~140px tall, `rounded-xl`, double border) | Output panel — distinct from any intermediate layer |
| **Residual ⊕** | Small filled circle on the center axis (16px, gradient bg) instead of left-of-column | Inline on the spine, classic transformer notation |

### Concrete shape implementation

- **Trapezoids / hexagons / bowtie**: Use Tailwind arbitrary `clip-path-[polygon(...)]` on a wrapper div. The border color is preserved via a 2-layer approach: outer div with the colored background does the clip, an inset 1px `border` is faked by stacking a second clipped div one pixel inset with `bg-card` on top. (Borders don't follow clip-path, so we use the two-layer fill technique.)
  - Trapezoid (embedding): `clip-path: polygon(8% 0, 92% 0, 100% 100%, 0 100%)`
  - Inverted trapezoid (LM head): `clip-path: polygon(0 0, 100% 0, 92% 100%, 8% 100%)`
  - Hexagon (attention): `clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)`
  - Bowtie-middle (SwiGLU): `clip-path: polygon(15% 0, 85% 0, 100% 50%, 85% 100%, 15% 100%, 0 50%)` (wide-middle hexagon, opposite of attention's narrow points)
- **Pill** (Tokenizer): standard div with `rounded-full`.
- **Thin bar** (RMSNorm): `h-[22px] rounded-sm`, name rendered to the **left of the bar** in a small label rather than inside.
- **Output card** (Top-5): `rounded-xl border-2` instead of the current `rounded-md border`.

### Size variation

- Tokenizer: full width × 40px
- Embedding: 88% width × 56px (trapezoid narrows it)
- RMSNorm: 70% width × 22px (centered, label on left)
- Attention: full width × 72px (hexagon, the tallest compute block)
- SwiGLU: full width × 76px (slightly taller — it's the biggest param block)
- Final RMSNorm: 70% × 22px
- LM Head: 88% width × 56px
- Top-5: full width × ~140px

Centering: blocks narrower than the column are `mx-auto` so the center axis (and the animated particle) still lines up.

### Text placement

- Inside-clip-path blocks (trapezoid/hexagon/bowtie): center the text both axes; keep current 2-line rule (name + detail). Adjust horizontal padding to avoid clipped corners.
- RMSNorm bar: name rendered to the **left outside** of the bar, the bar itself is the visual.
- Param-count badges (top-right) stay on rectangular blocks only; for clipped shapes, move param count to a small chip **below** the block.

## Changes to other elements

- **Arrows**: keep the vertical line + `▼`, but for the hexagon/bowtie blocks, draw the line from `bottom-center` of the shape (no offset needed since shapes are centered).
- **Residual ⊕**: move from the left side of the column to **on the center axis, mid-arrow**, as a small filled circle (better matches the new shape-driven look). The two ⊕ stay in the same conceptual position (after attention, after FFN).
- **×8 dashed bracket**: keep as-is, still wraps the 6 sub-blocks.
- **Weight-tie SVG arc**: keep as-is on the right side, between LM Head and Token Embedding.
- **Animated cyan particle**: keep — y-axis distance recomputed since total column height grows slightly (~820px instead of ~760px).
- **Stat row, input strip, parameter breakdown**: untouched.
- **Colors**: untouched — same `--info` cyan / `#f59e0b` amber / `#22c55e` green / `#f97316` orange / `#a855f7` purple / `#ec4899` pink palette.

## Implementation approach

Replace the single `<Box>` component with a small set of shape primitives, all sharing the same props (color, name, detail, param):

- `<PillBox>` — Tokenizer
- `<TrapezoidBox direction="down" | "up">` — Embedding / LM Head
- `<NormBar>` — both RMSNorms (label on the left)
- `<HexBox>` — Multi-Head Attention
- `<BowtieBox>` — SwiGLU FFN
- `<OutputCard>` — Top-5

Each primitive owns its own `clip-path`, height, and width. The diagram column composition stays linear (top-to-bottom), just with the new primitives substituted in.

## Out of scope

- Colors, palette tints (unchanged)
- Stat row, input strip, parameter breakdown (unchanged)
- `_app.architecture.tsx` (untouched)
- Adding new content / numbers / blocks
