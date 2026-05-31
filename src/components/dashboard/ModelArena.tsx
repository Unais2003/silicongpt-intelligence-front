import { motion } from "framer-motion";
import { Panel, StatusDot } from "./primitives";
import { ModelLogo } from "./ModelLogo";

type Row = {
  name: string;
  org: string;
  top1: number;
  top5: number;
  ood: number | null;
  completion: number | null;
  anomalyF1: number | null;
  latency: number | null; // ms
  us?: boolean;
};

// Real measured numbers (score.py). Ours + n-gram = FULL eval (n=3600/600/1000);
// frontier LLMs sampled on 200 examples. OOD = held-out-family proxy (3-seed mean), trained model only.
const MODELS: Row[] = [
  { name: "SiliconGPT",       org: "ours · 1.37M",            top1: 81.1, top5: 100.0, ood: 50.3, completion: 40.5, anomalyF1: 1.0,   latency: 14,   us: true },
  { name: "N-gram (trigram)", org: "baseline · no params",    top1: 76.1, top5: 100.0, ood: null, completion: 28.3, anomalyF1: null,  latency: 1 },
  { name: "Gemini 3.5-flash", org: "Google · API",            top1: 55.5, top5: 78.0,  ood: null, completion: 7.6,  anomalyF1: 0.910, latency: 5300 },
  { name: "GPT-5",            org: "OpenAI · API",            top1: 52.5, top5: 72.0,  ood: null, completion: null, anomalyF1: null,  latency: 35000 },
  { name: "DeepSeek V3-0324", org: "DeepSeek · open weights",  top1: 48.0, top5: 65.0,  ood: null, completion: 5.6,  anomalyF1: 0.603, latency: 6500 },
  { name: "Qwen3.6-35B-A3B",  org: "Alibaba · open weights",   top1: 41.5, top5: 63.5,  ood: null, completion: 2.5,  anomalyF1: 0.690, latency: 1900 },
];

const COLS: {
  key: keyof Row;
  label: string;
  suffix?: string;
  better?: "higher" | "lower";
  w: string;
  fixed?: number;
  fmt?: (v: number) => string;
}[] = [
  { key: "top1",       label: "Top-1",                suffix: "%", better: "higher", w: "70px",  fixed: 1 },
  { key: "top5",       label: "Top-5",                suffix: "%", better: "higher", w: "70px",  fixed: 1 },
  { key: "ood",        label: "OOD",                  suffix: "%", better: "higher", w: "70px",  fixed: 1 },
  { key: "completion", label: "Completion (token %)", suffix: "%", better: "higher", w: "130px", fixed: 1 },
  { key: "anomalyF1",  label: "Anomaly F1",                        better: "higher", w: "80px",  fixed: 3 },
  { key: "latency",    label: "Latency",              better: "lower", w: "90px", fmt: (v) => (v < 1000 ? `${v.toFixed(0)}ms` : `${(v / 1000).toFixed(1)}s`) },
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

  const tmpl = `1fr ${COLS.map((c) => c.w).join(" ")}`;

  return (
    <Panel
      title="Model Arena · Hack_01 Process Logic Benchmark"
      meta={
        <span className="flex items-center gap-2">
          <StatusDot color="success" /> 6 systems · 5,200 eval (ours, n-gram) · 200-sample (LLMs) · next-step + completion + anomaly
        </span>
      }
    >
      <div className="border border-border">
        {/* header */}
        <div
          className="grid items-center gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase text-muted-foreground"
          style={{ gridTemplateColumns: tmpl }}
        >
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
            <span className="flex items-center gap-2 text-sm">
              {m.us && <StatusDot color="info" />}
              <ModelLogo name={m.name} />
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
              const formatted = c.fmt ? c.fmt(num) : num.toFixed(fixed);
              return (
                <span
                  key={c.key as string}
                  className={`font-mono text-xs tabular text-right ${
                    isBest ? "text-[var(--success)] font-semibold" : ""
                  }`}
                >
                  {formatted}
                  {c.suffix && !c.fmt && (
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
          <div className="font-mono text-lg tabular text-[var(--success)]">+25.6 pt</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">API COST</div>
          <div className="font-mono text-lg tabular">0 vs Gemini</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">LATENCY ADVANTAGE</div>
          <div className="font-mono text-lg tabular text-[var(--info)]">~380× vs Gemini</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">ANOMALY F1</div>
          <div className="font-mono text-lg tabular text-[var(--success)]">1.000 · perfect</div>
        </div>
      </div>

      <div className="mt-3 text-tiny font-mono text-muted-foreground leading-relaxed">
        SiliconGPT and the n-gram baseline are scored on the full 5,200-example held-out eval
        (3,600 next-step · 600 completion · 1,000 anomaly); the frontier LLMs on a 200-example sample.
        OOD measures generalization to an unseen product family, so it applies only to our trained model;
        the n-gram and GPT-5 have no anomaly score. A dash (—) means the metric was not evaluated for that
        model. Higher is better for accuracy; lower for latency; the best value in each column is green.
      </div>
    </Panel>
  );
}
