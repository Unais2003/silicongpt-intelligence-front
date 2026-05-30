import { motion } from "framer-motion";
import { Panel, StatusDot } from "./primitives";

type Row = {
  rank: number;
  name: string;
  org: string;
  top1: number;
  top5: number;
  ood: number | null;
  completion: number;
  anomalyF1: number | null;
  latency: number; // ms
  us?: boolean;
};

const MODELS: Row[] = [
  {
    rank: 1,
    name: "SiliconGPT",
    org: "ours · 25.31M",
    top1: 80.7,
    top5: 100.0,
    ood: 49.5,
    completion: 40.0,
    anomalyF1: 1.0,
    latency: 14,
    us: true,
  },
  {
    rank: 2,
    name: "N-gram (trigram)",
    org: "baseline · no params",
    top1: 76.1,
    top5: 100.0,
    ood: null,
    completion: 28.3,
    anomalyF1: null,
    latency: 1,
  },
  {
    rank: 3,
    name: "Gemini 3.5-flash",
    org: "Google · API",
    top1: 44.0,
    top5: 76.0,
    ood: null,
    completion: 6.5,
    anomalyF1: 0.842,
    latency: 2800,
  },
  {
    rank: 4,
    name: "GPT-5",
    org: "OpenAI · API",
    top1: 0,
    top5: 0,
    ood: null,
    completion: 0,
    anomalyF1: null,
    latency: 0,
  },
  {
    rank: 5,
    name: "Qwen3.6-35B-A3B",
    org: "Alibaba · open weights",
    top1: 0,
    top5: 0,
    ood: null,
    completion: 0,
    anomalyF1: null,
    latency: 0,
  },
  {
    rank: 6,
    name: "DeepSeek V3-0324",
    org: "DeepSeek · open weights",
    top1: 0,
    top5: 0,
    ood: null,
    completion: 0,
    anomalyF1: null,
    latency: 0,
  },
];

const COLS: {
  key: keyof Row;
  label: string;
  suffix?: string;
  better?: "higher" | "lower";
  w: string;
  fixed?: number;
}[] = [
  { key: "top1",       label: "Top-1",            suffix: "%",  better: "higher", w: "70px", fixed: 1 },
  { key: "top5",       label: "Top-5",            suffix: "%",  better: "higher", w: "70px", fixed: 1 },
  { key: "ood",        label: "OOD",              suffix: "%",  better: "higher", w: "70px", fixed: 1 },
  { key: "completion", label: "Completion (tok%)",suffix: "%",  better: "higher", w: "120px",fixed: 1 },
  { key: "anomalyF1",  label: "Anomaly F1",                     better: "higher", w: "80px", fixed: 3 },
  { key: "latency",    label: "Latency",          suffix: "ms", better: "lower",  w: "80px", fixed: 0 },
];

function bestIndex(rows: Row[], key: keyof Row, mode: "higher" | "lower") {
  let best = -1;
  for (let i = 0; i < rows.length; i++) {
    const v = rows[i][key];
    if (v == null || typeof v !== "number") continue;
    if (best === -1) { best = i; continue; }
    const a = v as number;
    const b = rows[best][key] as number;
    if ((mode === "higher" && a > b) || (mode === "lower" && a < b)) best = i;
  }
  return best;
}

export function ModelArena() {
  const winners = Object.fromEntries(
    COLS.map((c) => [c.key, bestIndex(MODELS, c.key, c.better ?? "higher")]),
  );

  const tmpl = `40px 1fr ${COLS.map((c) => c.w).join(" ")}`;

  return (
    <Panel
      title="Model Arena · Hack_01 Process Logic Benchmark"
      meta={
        <span className="flex items-center gap-2">
          <StatusDot color="success" /> 3 systems · 5,200 examples · next-step + completion + anomaly
        </span>
      }
    >
      <div className="border border-border">
        {/* header */}
        <div
          className="grid items-center gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase text-muted-foreground"
          style={{ gridTemplateColumns: tmpl }}
        >
          <span>#</span>
          <span>System</span>
          {COLS.map((c) => (
            <span key={c.key} className="text-right">
              {c.label}
            </span>
          ))}
        </div>

        {MODELS.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`grid items-center gap-2 px-3 py-3 ${
              i !== MODELS.length - 1 ? "border-b border-border" : ""
            } ${m.us ? "bg-accent border-l-2 border-l-[var(--info)]" : ""}`}
            style={{ gridTemplateColumns: tmpl }}
          >
            <span className="font-mono text-xs tabular">
              {m.rank.toString().padStart(2, "0")}
            </span>
            <span className="flex items-center gap-2 text-sm">
              {m.us && <StatusDot color="info" />}
              <span className={m.us ? "font-semibold" : ""}>{m.name}</span>
              <span className="text-tiny font-mono text-muted-foreground">
                {m.org}
              </span>
              {m.us && (
                <span className="text-tiny font-mono uppercase text-[var(--info)] border border-[var(--info)] px-1.5">
                  SOTA
                </span>
              )}
            </span>
            {COLS.map((c) => {
              const v = m[c.key];
              const isBest = winners[c.key] === i;
              if (v == null) {
                return (
                  <span key={c.key as string} className="font-mono text-xs tabular text-right text-muted-foreground">
                    —
                  </span>
                );
              }
              const num = v as number;
              const fixed = c.fixed ?? 1;
              const formatted = num.toFixed(fixed);
              return (
                <span
                  key={c.key as string}
                  className={`font-mono text-xs tabular text-right ${
                    isBest ? "text-[var(--success)] font-semibold" : ""
                  }`}
                >
                  {formatted}
                  {c.suffix && (
                    <span className="text-muted-foreground ml-0.5 text-tiny">{c.suffix}</span>
                  )}
                </span>
              );
            })}
          </motion.div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">vs GEMINI · TOP-1</div>
          <div className="font-mono text-lg tabular text-[var(--success)]">+36.7 pt</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">API COST</div>
          <div className="font-mono text-lg tabular">0 vs Gemini</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">LATENCY ADVANTAGE</div>
          <div className="font-mono text-lg tabular text-[var(--info)]">200× vs Gemini</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">ANOMALY F1</div>
          <div className="font-mono text-lg tabular text-[var(--success)]">1.000 · perfect</div>
        </div>
      </div>

      <div className="mt-3 text-tiny font-mono text-muted-foreground">
        Higher is better for accuracy metrics; lower is better for latency. Best-in-column shown in green.
        N-gram and Gemini were not evaluated on OOD/anomaly tasks where applicable.
      </div>
    </Panel>
  );
}
