
## Goal

Flip the architecture diagram from a vertical column to a **horizontal left-to-right flow** so the whole model fits on one page without scrolling vertically. Same shapes, same colors, same content — only the axis changes. Single file: `src/components/dashboard/ModelArchitecture.tsx`.

## Horizontal flow

```
[Tokenizer] ▶ [Embed] ▶ ╔ × 8 ════════════════════════════════╗ ▶ [Norm] ▶ [LM Head] ▶ [Top-5]
                        ║ [Norm] ▶ [Attn] ⊕ [Norm] ▶ [FFN] ⊕ ║
                        ╚════════════════════════════════════╝
                                          ↑
                              ★ shared weights arc (top)
```

Everything lives on **one row** at desktop. The ×8 dashed bracket also runs horizontally; its label moves to the **top** of the bracket (`× 8` in normal orientation, no rotation). The Top-5 panel sits at the **right end** of the row as the output.

## Block changes (only orientation, sizes adjusted to fit width)

| Block | New shape/size |
|---|---|
| Tokenizer (pill) | unchanged shape — width 130, height 40 |
| Embedding (down-trapezoid) | rotated 90° → trapezoid points right (`polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)` — house pointing right). 110 × 70 |
| RMSNorm (thin bar) | rotated to **vertical thin bar** — name above, 14×70 bar. Keeps the "lightweight" feel without breaking horizontal rhythm |
| Multi-Head Attention (square) | unchanged — 120 × 120 |
| SwiGLU FFN (rect) | rotated to **tall rectangle** — 90 × 120 (was 100% × 60). Same param chip below |
| LM Head | mirror-house pointing left? Better: keep as right-pointing house but in pink (matches embedding's "projection" idea). 110 × 70 |
| Top-5 panel | unchanged shape; size 220 × 150 (tighter than current) |
| ⊕ residual | small circle inline on the horizontal arrow line, same as before |

The two NormBars inside the bracket become small vertical bars so they don't dominate horizontally.

## Arrows

- Replace vertical `Arrow` with `HArrow` — horizontal line + `▶` arrowhead, label rendered **above** the line.
- All tensor shape labels (`[B, T]`, `[B, T, 512]`, `logits [B, T, 202]`) sit above their arrow.

## ×8 bracket

- Becomes a `flex flex-row items-center gap-3` container with `border: 2px dashed` and rounded corners.
- The `× 8` label moves to the **top-center** of the bracket (small chip absolutely positioned at `-top-2.5` with `bg-background px-2`), upright text in cyan.
- Children inside (Norm ▶ Attn ⊕ Norm ▶ FFN ⊕) flow left-to-right.

## Weight-tie arc

- SVG repositioned to span **above** the row, from the top of LM Head back to the top of Token Embedding. Curve bows upward (an arch). Label "★ shared weights" sits at the apex.
- Implementation: an SVG absolutely positioned above the diagram, width = diagram width, height ~50px, with a quadratic-Bezier arch path in pink dashed.

## Animated particle

- Animate `x` (instead of `y`) from left edge of Tokenizer to right edge of Top-5. `duration: 3.5, repeat: Infinity, ease: linear`. Lives on the center horizontal axis.

## Fit / overflow

- Outer wrapper: `overflow-x-auto` so on viewports narrower than the diagram it horizontally scrolls instead of wrapping. Diagram itself sized with `min-w-[1100px]` so all blocks stay on one row at our 1106px preview viewport.
- Stat row + input strip stay above, full width, unchanged.
- Parameter breakdown bar stays below, unchanged.

## Implementation

- Add a `HArrow` component and reuse existing shape primitives, just changing the `width`/`height` props passed in.
- Modify `NormBar` to render vertically (label on top + vertical thin bar).
- Modify `TrapezoidBox` to accept a `direction: "right" | "left"` instead of `"down" | "up"` — update clip-paths accordingly.
- Replace the diagram column JSX with a single flex row inside an `overflow-x-auto` wrapper.
- Re-tune the particle and weight-tie SVG coordinates for the new layout.

## Out of scope

- Stat row, input strip, parameter breakdown (unchanged)
- Colors, content, results section, `_app.architecture.tsx`
