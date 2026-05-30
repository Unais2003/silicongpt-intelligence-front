import * as React from "react";
import { motion } from "framer-motion";

// ============================================================================
// Compact horizontal model-architecture diagram (fits ~1060px wide, no scroll)
// ============================================================================

const COLORS = {
  cyan: "var(--info)",
  amber: "#f59e0b",
  green: "#22c55e",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
} as const;

type BoxColor = keyof typeof COLORS;

function tint(hex: string, pct = 8) {
  return `color-mix(in oklab, ${hex} ${pct}%, transparent)`;
}
function solidTint(hex: string, pct = 14) {
  return `color-mix(in oklab, ${hex} ${pct}%, var(--card))`;
}

// ----- INPUT TOKEN STRIP (vertical, sits left of Tokenizer) ---------------
const INPUT_STEPS = [
  "RECEIVE WAFER LOT",
  "PRE CLEAN WAFER",
  "RCA CLEAN 1",
  "RCA CLEAN 2",
  "HF DIP",
  "THERMAL OXIDATION",
  "DEPOSIT POLYSILICON",
  "POLYSILICON ANNEAL",
];
const ACTIVE_IDX = 6;

function InputStripVertical() {
  return (
    <div className="shrink-0" style={{ width: 116 }}>
      <div className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-1">
        Input Seq
      </div>
      <div className="flex flex-col gap-[3px]">
        {INPUT_STEPS.map((s, i) => {
          const isActive = i === ACTIVE_IDX;
          const isPast = i < ACTIVE_IDX;
          return (
            <div
              key={s}
              className="font-mono text-[8.5px] px-1.5 py-[3px] border truncate"
              style={{
                background: isActive ? COLORS.cyan : "var(--card)",
                color: isActive ? "#fff" : "var(--foreground)",
                borderColor: isActive ? COLORS.cyan : "var(--border)",
                opacity: isActive ? 1 : isPast ? 0.7 : 0.4,
              }}
            >
              {isActive ? "▶ " : ""}
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----- STAT ROW -----------------------------------------------------------
const STATS: [string, string][] = [
  ["params", "25.31M"],
  ["layers", "8"],
  ["d", "512"],
  ["heads", "8"],
  ["vocab", "202"],
  ["ctx", "256"],
];

function StatRow() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATS.map(([k, v]) => (
        <div
          key={k}
          className="font-mono text-[10px] border border-border bg-card px-2 py-1 rounded-sm"
        >
          <span className="text-muted-foreground">{k}</span>{" "}
          <span className="font-semibold">{v}</span>
        </div>
      ))}
    </div>
  );
}

// ----- SHAPE PRIMITIVES ---------------------------------------------------

function BoxText({
  name,
  detail,
  badge,
  color,
}: {
  name: string;
  detail?: string;
  badge?: string;
  color: BoxColor;
}) {
  const c = COLORS[color];
  return (
    <>
      <div className="flex items-center gap-1 leading-none">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-tight">
          {name}
        </span>
        {badge && (
          <span
            className="font-mono text-[7.5px] px-1 py-px rounded-sm"
            style={{ color: c, backgroundColor: solidTint(c, 18) }}
          >
            {badge}
          </span>
        )}
      </div>
      {detail && (
        <div className="font-mono text-[8.5px] text-muted-foreground leading-tight mt-0.5">
          {detail}
        </div>
      )}
    </>
  );
}

function ParamChip({ value }: { value: string }) {
  return (
    <div className="mx-auto mt-0.5 font-mono text-[8.5px] text-muted-foreground tabular text-center">
      {value}
    </div>
  );
}

function withParam(node: React.ReactNode, param?: string, width: number | string = "auto") {
  return (
    <div className="flex flex-col items-center shrink-0" style={{ width }}>
      {node}
      {param && <ParamChip value={param} />}
    </div>
  );
}

// — Tokenizer: pill --------------------------------------------------------
function PillBox({ name, detail }: { name: string; detail?: string }) {
  const c = COLORS.cyan;
  const W = 88;
  return withParam(
    <div
      className="rounded-full flex flex-col items-center justify-center px-2 text-center"
      style={{
        width: W,
        height: 56,
        backgroundColor: solidTint(c, 12),
        border: `1.5px solid ${c}`,
      }}
    >
      <BoxText name={name} detail={detail} color="cyan" />
    </div>,
    undefined,
    W,
  );
}

// — Embedding / LM Head: trapezoid -----------------------------------------
function TrapezoidBox({
  direction,
  color,
  name,
  detail,
  badge,
  param,
}: {
  direction: "right" | "left";
  color: BoxColor;
  name: string;
  detail?: string;
  badge?: string;
  param?: string;
}) {
  const c = COLORS[color];
  const clip =
    direction === "right"
      ? "polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%)"
      : "polygon(25% 0, 100% 0, 100% 100%, 25% 100%, 0 50%)";
  const W = 92;
  const H = 64;
  return withParam(
    <div className="relative" style={{ width: W, height: H }}>
      <div className="absolute inset-0" style={{ clipPath: clip, backgroundColor: c }} />
      <div
        className="absolute"
        style={{
          inset: 1.5,
          clipPath: clip,
          backgroundColor: solidTint(c, 14),
        }}
      />
      <div
        className="relative w-full h-full flex flex-col items-center justify-center text-center"
        style={{
          paddingLeft: direction === "left" ? 18 : 4,
          paddingRight: direction === "right" ? 18 : 4,
        }}
      >
        <BoxText name={name} detail={detail} badge={badge} color={color} />
      </div>
    </div>,
    param,
    W,
  );
}

// — Multi-Head Attention: square -------------------------------------------
function SquareBox({
  color,
  name,
  detail,
  param,
}: {
  color: BoxColor;
  name: string;
  detail?: string;
  param?: string;
}) {
  const c = COLORS[color];
  const S = 80;
  return withParam(
    <div
      className="flex flex-col items-center justify-center text-center px-1.5"
      style={{
        width: S,
        height: S,
        backgroundColor: solidTint(c, 14),
        border: `2px solid ${c}`,
      }}
    >
      <BoxText name={name} detail={detail} color={color} />
    </div>,
    param,
    S,
  );
}

// — SwiGLU FFN: tall rectangle ---------------------------------------------
function RectBox({
  color,
  name,
  detail,
  param,
}: {
  color: BoxColor;
  name: string;
  detail?: string;
  param?: string;
}) {
  const c = COLORS[color];
  const W = 70;
  const H = 88;
  return withParam(
    <div
      className="flex flex-col items-center justify-center text-center px-1.5"
      style={{
        width: W,
        height: H,
        backgroundColor: solidTint(c, 14),
        border: `2px solid ${c}`,
      }}
    >
      <BoxText name={name} detail={detail} color={color} />
    </div>,
    param,
    W,
  );
}

// — RMSNorm: vertical thin bar ---------------------------------------------
function NormBar({ name }: { name: string }) {
  const c = COLORS.green;
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className="rounded-sm"
        style={{
          width: 12,
          height: 56,
          backgroundColor: solidTint(c, 22),
          border: `1px solid ${c}`,
        }}
      />
      <span
        className="font-mono text-[8px] uppercase tracking-tight whitespace-nowrap"
        style={{ color: c }}
      >
        {name}
      </span>
    </div>
  );
}

// ----- HORIZONTAL ARROW ---------------------------------------------------
function HArrow({ label, w = 16 }: { label?: string; w?: number }) {
  return (
    <div className="relative flex items-center shrink-0" style={{ width: w, height: 64 }}>
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border-strong" />
      <div
        className="absolute font-mono text-[10px] text-muted-foreground -translate-y-1/2"
        style={{ top: "50%", right: -2 }}
      >
        ▶
      </div>
      {label && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 whitespace-nowrap font-mono text-[8.5px] text-muted-foreground bg-background px-1">
          {label}
        </div>
      )}
    </div>
  );
}

// ----- RESIDUAL ⊕ ---------------------------------------------------------
function PlusAdd() {
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 18, height: 64 }}>
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border-strong" />
      <div
        className="relative w-4 h-4 rounded-full border flex items-center justify-center font-mono text-[10px] leading-none"
        style={{
          borderColor: "var(--border-strong)",
          backgroundColor: "var(--card)",
          color: "var(--muted-foreground)",
        }}
      >
        ⊕
      </div>
    </div>
  );
}

// ----- TOP-5 PREDICTIONS --------------------------------------------------
const TOP5 = [
  { step: "POLYSILICON ANNEAL", pct: 82, top: true },
  { step: "GATE OXIDE GROWTH", pct: 9 },
  { step: "NITRIDE DEPOSITION", pct: 4 },
  { step: "RTA ANNEAL", pct: 3 },
  { step: "WAFER INSPECTION", pct: 2 },
];

function Top5Box() {
  const c = COLORS.green;
  return (
    <div
      className="relative rounded-lg border-2 px-2 py-1.5 shrink-0"
      style={{ width: 180, backgroundColor: tint(c, 9), borderColor: c }}
    >
      <div className="font-mono text-[9px] font-semibold uppercase tracking-wide mb-1">
        Top-5 Predictions
      </div>
      <div className="space-y-0.5">
        {TOP5.map((r, i) => (
          <div key={r.step} className="flex items-center gap-1 font-mono text-[8.5px]">
            <span className="text-muted-foreground w-2">{i + 1}</span>
            <span
              className="w-[68px] truncate"
              style={{ color: r.top ? c : "var(--muted-foreground)" }}
            >
              {r.step}
            </span>
            <div className="flex-1 h-1.5 bg-border/50 rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${r.pct}%` }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                className="h-full"
                style={{ backgroundColor: r.top ? c : "var(--border-strong)" }}
              />
            </div>
            <span
              className="w-6 text-right tabular"
              style={{ color: r.top ? c : "var(--muted-foreground)" }}
            >
              {r.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- PARAMETER BREAKDOWN -----------------------------------------------
const PARAM_SEGS = [
  { name: "SwiGLU", params: "16.71M", pct: 66.1, color: COLORS.purple },
  { name: "Attn", params: "8.39M", pct: 33.1, color: COLORS.orange },
  { name: "Emb", params: "0.10M", pct: 0.4, color: COLORS.amber },
  { name: "Norms", params: "0.009M", pct: 0.03, color: COLORS.green },
];

function ParamBreakdown() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between mb-1 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
        <span>Parameter Breakdown</span>
        <span>25.31M total</span>
      </div>
      <div className="flex w-full h-3 rounded-sm overflow-hidden border border-border">
        {PARAM_SEGS.map((s) => (
          <div
            key={s.name}
            title={`${s.name} · ${s.params} (${s.pct}%)`}
            style={{
              width: `${Math.max(s.pct, 1.5)}%`,
              backgroundColor: s.color,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 font-mono text-[10px]">
        {PARAM_SEGS.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-foreground">{s.name}</span>
            <span className="text-muted-foreground">
              {s.params} · {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- MAIN COMPONENT -----------------------------------------------------
export function ModelArchitecture() {
  const DIAGRAM_W = 1060;

  return (
    <div className="w-full">
      {/* Stat row */}
      <div className="max-w-2xl mx-auto mb-4">
        <StatRow />
      </div>

      {/* Compact horizontal diagram */}
      <div className="overflow-x-auto pb-2">
        <div
          className="relative mx-auto"
          style={{ minWidth: DIAGRAM_W, paddingTop: 52, paddingBottom: 12 }}
        >
          {/* Weight-tie arc on top */}
          <svg
            className="absolute pointer-events-none"
            style={{ left: 0, top: 0, width: DIAGRAM_W, height: 48 }}
            viewBox={`0 0 ${DIAGRAM_W} 48`}
            fill="none"
          >
            <path
              d={`M 245 44 Q ${DIAGRAM_W / 2} -22 820 44`}
              stroke={COLORS.pink}
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <text
              x={DIAGRAM_W / 2}
              y="12"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              fill={COLORS.pink}
              textAnchor="middle"
            >
              ★ shared weights
            </text>
          </svg>

          {/* Animated particle on center horizontal axis */}
          <motion.div
            className="absolute w-2.5 h-2.5 rounded-full pointer-events-none z-20"
            style={{
              top: 52 + 44,
              left: 0,
              backgroundColor: COLORS.cyan,
              boxShadow: `0 0 8px ${COLORS.cyan}`,
            }}
            animate={{ x: [0, DIAGRAM_W - 12] }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />

          {/* Row: input strip → tokenizer → embedding → ×8 → norm → lm head → top-5 */}
          <div className="flex items-center gap-1.5">
            <InputStripVertical />
            <HArrow w={14} />

            <PillBox name="Tokenizer" detail="202-vocab" />
            <HArrow label="[B, T]" w={20} />

            <TrapezoidBox
              direction="right"
              color="amber"
              name="Embedding"
              detail="202 × 512"
              badge="★ tied"
              param="0.10M"
            />
            <HArrow label="[B, T, 512]" w={20} />

            {/* ×8 horizontal dashed bracket */}
            <div
              className="relative flex items-center gap-1.5 rounded-lg shrink-0"
              style={{
                border: `2px dashed var(--border-strong)`,
                padding: "12px 8px 8px",
              }}
            >
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-mono text-[11px] font-semibold px-2 bg-background"
                style={{ color: COLORS.cyan }}
              >
                × 8
              </div>

              <NormBar name="RMSNorm" />
              <HArrow w={10} />
              <SquareBox
                color="orange"
                name="MH Attn"
                detail="8h · 64 · RoPE"
                param="1.05M"
              />
              <PlusAdd />
              <NormBar name="RMSNorm" />
              <HArrow w={10} />
              <RectBox
                color="purple"
                name="SwiGLU"
                detail="512→1368→512"
                param="2.09M"
              />
              <PlusAdd />
            </div>

            <HArrow w={14} />
            <NormBar name="Final Norm" />
            <HArrow w={14} />

            <TrapezoidBox
              direction="left"
              color="pink"
              name="LM Head"
              detail="512 → 202"
              badge="★ tied"
            />
            <HArrow label="logits" w={20} />

            <Top5Box />
          </div>
        </div>
      </div>

      {/* Parameter breakdown */}
      <div className="mt-6">
        <ParamBreakdown />
      </div>
    </div>
  );
}
