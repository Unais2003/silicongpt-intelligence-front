import { motion } from "framer-motion";
import { Panel, StatusDot } from "./primitives";

type Row = {
  rank: number;
  name: string;
  org: string;
  top1: number;
  top5: number;
  ood: number;
  completion: number;
  latency: number; // ms
  cost: number; // USD per 1k runs
  us?: boolean;
};

const MODELS: Row[] = [
  { rank: 1, name: "SiliconGPT", org: "in-house · 47M", top1: 81.0, top5: 100.0, ood: 49.5, completion: 92.4, latency: 11, cost: 0.04, us: true },
  { rank: 2, name: "GPT-5",      org: "OpenAI",         top1: 38.4, top5: 71.2, ood: 22.1, completion: 54.6, latency: 740, cost: 12.80 },
  { rank: 3, name: "Claude 4.5", org: "Anthropic",      top1: 36.1, top5: 68.4, ood: 21.8, completion: 52.0, latency: 690, cost: 9.20 },
  { rank: 4, name: "Gemini 2.5", org: "Google",         top1: 33.8, top5: 64.0, ood: 19.4, completion: 49.3, latency: 580, cost: 6.40 },
  { rank: 5, name: "Kimi K2",    org: "Moonshot",       top1: 31.0, top5: 60.5, ood: 17.1, completion: 46.7, latency: 510, cost: 3.10 },
];

const COLS: { key: keyof Row; label: string; suffix?: string; better?: "higher" | "lower"; w: string }[] = [
  { key: "top1",       label: "Top-1",       suffix: "%",  better: "higher", w: "70px" },
  { key: "top5",       label: "Top-5",       suffix: "%",  better: "higher", w: "70px" },
  { key: "ood",        label: "OOD",         suffix: "%",  better: "higher", w: "70px" },
  { key: "completion", label: "Completion",  suffix: "%",  better: "higher", w: "80px" },
  { key: "latency",    label: "Latency",     suffix: "ms", better: "lower",  w: "70px" },
  { key: "cost",       label: "Cost / 1k",   suffix: "$",  better: "lower",  w: "80px" },
];

function bestIndex(rows: Row[], key: keyof Row, mode: "higher" | "lower") {
  let best = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i][key] as number;
    const b = rows[best][key] as number;
    if ((mode === "higher" && a > b) || (mode === "lower" && a < b)) best = i;
  }
  return best;
}

export function ModelArena() {
  const winners = Object.fromEntries(
    COLS.map((c) => [c.key, bestIndex(MODELS, c.key, c.better ?? "higher")]),
  );

  // build column widths
  const tmpl = `40px 1fr ${COLS.map((c) => c.w).join(" ")}`;

  return (
    <Panel
      title="Model Arena · WaferBench v0.4"
      meta={
        <span className="flex items-center gap-2">
          <StatusDot color="success" /> 5 systems · 8,412 prompts · 6 metrics
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
              const v = m[c.key] as number;
              const isBest = winners[c.key] === i;
              const formatted =
                c.suffix === "$"
                  ? `$${v.toFixed(2)}`
                  : c.suffix === "ms"
                    ? `${v.toFixed(0)}`
                    : v.toFixed(1);
              return (
                <span
                  key={c.key as string}
                  className={`font-mono text-xs tabular text-right ${
                    isBest ? "text-[var(--success)] font-semibold" : ""
                  }`}
                >
                  {formatted}
                  {c.suffix && c.suffix !== "$" && (
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
          <div className="text-tiny font-mono text-muted-foreground">DELTA vs FRONTIER</div>
          <div className="font-mono text-lg tabular text-[var(--success)]">+42.6 pt</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">PARAMS RATIO</div>
          <div className="font-mono text-lg tabular">1 : 4,000+</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">LATENCY ADVANTAGE</div>
          <div className="font-mono text-lg tabular text-[var(--info)]">67× faster</div>
        </div>
        <div className="bg-card p-3">
          <div className="text-tiny font-mono text-muted-foreground">COST ADVANTAGE</div>
          <div className="font-mono text-lg tabular text-[var(--info)]">320× cheaper</div>
        </div>
      </div>

      <div className="mt-3 text-tiny font-mono text-muted-foreground">
        Higher is better for accuracy metrics; lower is better for latency & cost. Best-in-column shown in green.
      </div>
    </Panel>
  );
}
