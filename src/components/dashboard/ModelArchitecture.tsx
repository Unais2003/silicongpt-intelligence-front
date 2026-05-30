import * as React from "react";
import { motion } from "framer-motion";

// ============================================================================
// Visual model-architecture diagram (GPT/LLaMA-paper style)
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

// ----- INPUT TOKEN STRIP --------------------------------------------------
const INPUT_STEPS = [
  "RECEIVE WAFER LOT",
  "PRE CLEAN WAFER",
  "RCA CLEAN 1",
  "RCA CLEAN 2",
  "HF DIP",
  "THERMAL OXIDATION",
  "DEPOSIT POLYSILICON", // active
  "POLYSILICON ANNEAL",
  "GATE LITHO",
  "GATE ETCH",
  "SD IMPLANT",
  "RTA ANNEAL",
];
const ACTIVE_IDX = 6;

function InputStrip() {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">
        Input Sequence
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {INPUT_STEPS.map((s, i) => {
          const isActive = i === ACTIVE_IDX;
          const isPast = i < ACTIVE_IDX;
          return (
            <div
              key={s}
              className="font-mono text-[10px] px-2 py-1 border whitespace-nowrap shrink-0"
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
// Helper: fill a clipped shape with a colored "border" rim by stacking a
// solid-color layer behind an inner tinted layer (CSS borders don't follow
// clip-path).
function ClippedShape({
  clip,
  width,
  height,
  color,
  children,
}: {
  clip: string;
  width: string | number;
  height: number;
  color: BoxColor;
  children: React.ReactNode;
}) {
  const c = COLORS[color];
  return (
    <div className="relative mx-auto" style={{ width, height }}>
      <div
        className="absolute inset-0"
        style={{ clipPath: clip, backgroundColor: c }}
      />
      <div
        className="absolute"
        style={{
          inset: 1.5,
          clipPath: clip,
          backgroundColor: `color-mix(in oklab, ${c} 14%, var(--card))`,
        }}
      />
      <div className="relative w-full h-full flex flex-col items-center justify-center text-center px-8">
        {children}
      </div>
    </div>
  );
}

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
      <div className="flex items-center gap-2 leading-none">
        <span className="font-mono text-xs font-semibold uppercase tracking-wide">
          {name}
        </span>
        {badge && (
          <span
            className="font-mono text-[9px] px-1.5 py-px rounded-sm"
            style={{ color: c, backgroundColor: `color-mix(in oklab, ${c} 18%, var(--card))` }}
          >
            {badge}
          </span>
        )}
      </div>
      {detail && (
        <div className="font-mono text-[10px] text-muted-foreground leading-tight mt-1">
          {detail}
        </div>
      )}
    </>
  );
}

function ParamChip({ value }: { value: string }) {
  return (
    <div className="mx-auto mt-0.5 font-mono text-[9px] text-muted-foreground tabular">
      {value} params
    </div>
  );
}

// — Tokenizer: wide pill ----------------------------------------------------
function PillBox({ name, detail, param }: { name: string; detail?: string; param?: string }) {
  const c = COLORS.cyan;
  return (
    <>
      <div
        className="relative w-full rounded-full flex items-center justify-center gap-3 px-6"
        style={{
          height: 40,
          backgroundColor: `color-mix(in oklab, ${c} 12%, var(--card))`,
          border: `1.5px solid ${c}`,
        }}
      >
        <span className="font-mono text-xs font-semibold uppercase tracking-wide">{name}</span>
        {detail && (
          <span className="font-mono text-[10px] text-muted-foreground">· {detail}</span>
        )}
      </div>
      {param && <ParamChip value={param} />}
    </>
  );
}

// — Embedding / LM Head: trapezoids ----------------------------------------
function TrapezoidBox({
  direction,
  color,
  name,
  detail,
  badge,
  param,
}: {
  direction: "down" | "up";
  color: BoxColor;
  name: string;
  detail?: string;
  badge?: string;
  param?: string;
}) {
  const clip =
    direction === "down"
      ? "polygon(8% 0, 92% 0, 100% 100%, 0 100%)"
      : "polygon(0 0, 100% 0, 92% 100%, 8% 100%)";
  return (
    <>
      <ClippedShape clip={clip} width="88%" height={56} color={color}>
        <BoxText name={name} detail={detail} badge={badge} color={color} />
      </ClippedShape>
      {param && <ParamChip value={param} />}
    </>
  );
}

// — Multi-Head Attention: tall hexagon -------------------------------------
function HexBox({
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
  return (
    <>
      <div
        className="relative mx-auto flex flex-col items-center justify-center text-center px-4"
        style={{
          width: 140,
          height: 140,
          backgroundColor: `color-mix(in oklab, ${c} 14%, var(--card))`,
          border: `2px solid ${c}`,
        }}
      >
        <BoxText name={name} detail={detail} color={color} />
      </div>
      {param && <ParamChip value={param} />}
    </>
  );
}

// — SwiGLU FFN: wide rectangle --------------------------------------------
function BowtieBox({
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
  return (
    <>
      <div
        className="relative w-full flex flex-col items-center justify-center text-center px-4"
        style={{
          height: 60,
          backgroundColor: `color-mix(in oklab, ${c} 14%, var(--card))`,
          border: `2px solid ${c}`,
        }}
      >
        <BoxText name={name} detail={detail} color={color} />
      </div>
      {param && <ParamChip value={param} />}
    </>
  );
}

// — RMSNorm: thin bar with side label --------------------------------------
function NormBar({ name }: { name: string }) {
  const c = COLORS.green;
  return (
    <div className="flex items-center gap-3 mx-auto" style={{ width: "75%" }}>
      <span
        className="font-mono text-[10px] uppercase tracking-wide shrink-0"
        style={{ color: c }}
      >
        {name}
      </span>
      <div
        className="flex-1 rounded-sm"
        style={{
          height: 10,
          backgroundColor: `color-mix(in oklab, ${c} 22%, var(--card))`,
          border: `1px solid ${c}`,
        }}
      />
    </div>
  );
}

// ----- ARROW --------------------------------------------------------------
function Arrow({ label }: { label?: string }) {
  return (
    <div className="relative h-6 w-full flex justify-center">
      <div className="w-px h-full bg-border-strong" />
      <div
        className="absolute font-mono text-[10px] text-muted-foreground -translate-x-1/2"
        style={{ left: "50%", bottom: -2 }}
      >
        ▼
      </div>
      {label && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] text-muted-foreground bg-background px-1">
          {label}
        </div>
      )}
    </div>
  );
}

// ----- RESIDUAL ADD CIRCLE (on the center axis) ---------------------------
function PlusAdd() {
  return (
    <div className="relative h-6 w-full flex justify-center items-center">
      <div className="w-px h-full bg-border-strong" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border flex items-center justify-center font-mono text-[11px] leading-none"
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
      className="relative w-full rounded-xl border-2 px-4 py-3"
      style={{ backgroundColor: tint(c, 9), borderColor: c }}
    >
      <div className="font-mono text-xs font-semibold uppercase tracking-wide mb-1.5">
        Top-5 Predictions
      </div>
      <div className="space-y-1">
        {TOP5.map((r, i) => (
          <div key={r.step} className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-muted-foreground w-3">{i + 1}</span>
            <span
              className="w-[150px] truncate"
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
              className="w-8 text-right tabular"
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
    <div className="w-full max-w-lg mx-auto">
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
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
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
  return (
    <div className="w-full">
      {/* Stat row */}
      <div className="max-w-lg mx-auto mb-4">
        <StatRow />
      </div>

      {/* Input strip */}
      <div className="max-w-lg mx-auto mb-6">
        <InputStrip />
      </div>

      {/* Diagram column */}
      <div className="relative max-w-lg mx-auto">
        {/* Weight-tie SVG arc on the right */}
        <svg
          className="absolute pointer-events-none"
          style={{ right: -54, top: 86, width: 64, height: 700 }}
          viewBox="0 0 64 700"
          fill="none"
        >
          <path
            d="M 4 690 Q 56 690 56 350 Q 56 10 4 10"
            stroke={COLORS.pink}
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text
            x="40"
            y="350"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill={COLORS.pink}
            transform="rotate(90 40 350)"
            textAnchor="middle"
          >
            ★ shared weights
          </text>
        </svg>

        {/* Animated particle on center axis */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full pointer-events-none z-20"
          style={{
            top: 0,
            backgroundColor: COLORS.cyan,
            boxShadow: `0 0 10px ${COLORS.cyan}`,
          }}
          animate={{ y: [0, 820] }}
          transition={{ duration: 3.5, ease: "linear", repeat: Infinity }}
        />

        {/* Tokenizer */}
        <PillBox name="Tokenizer" detail="202-token vocab" />
        <Arrow label="string → ID · [B, T]" />

        {/* Token Embedding */}
        <TrapezoidBox
          direction="down"
          color="amber"
          name="Token Embedding"
          detail="202 × 512"
          badge="★ tied"
          param="0.10M"
        />
        <Arrow label="[B, T, 512]" />

        {/* ×8 Dashed bracket */}
        <div
          className="relative rounded-lg p-3 pl-6"
          style={{
            border: `2px dashed var(--border-strong)`,
          }}
        >
          <div
            className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold"
            style={{
              color: COLORS.cyan,
              writingMode: "vertical-rl",
              transform: "translateY(-50%) rotate(180deg)",
            }}
          >
            × 8
          </div>

          <NormBar name="RMSNorm" />
          <Arrow />
          <HexBox
            color="orange"
            name="Multi-Head Attention"
            detail="8h · 64 · RoPE · Causal"
            param="1.05M"
          />
          <PlusAdd />
          <NormBar name="RMSNorm" />
          <Arrow />
          <BowtieBox
            color="purple"
            name="SwiGLU FFN"
            detail="512 → 1368 → 512"
            param="2.09M"
          />
          <PlusAdd />
        </div>

        <Arrow label="[B, T, 512]" />

        {/* Final RMSNorm */}
        <NormBar name="Final RMSNorm" />
        <Arrow />

        {/* LM Head */}
        <TrapezoidBox
          direction="up"
          color="pink"
          name="LM Head"
          detail="512 → 202"
          badge="★ tied"
        />
        <Arrow label="logits [B, T, 202]" />

        {/* Top-5 */}
        <Top5Box />
      </div>

      {/* Parameter breakdown */}
      <div className="mt-8">
        <ParamBreakdown />
      </div>
    </div>
  );
}
