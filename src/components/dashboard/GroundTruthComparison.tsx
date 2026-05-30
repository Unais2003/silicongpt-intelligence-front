import { motion } from "framer-motion";
import { Panel, StatusDot, Label } from "./primitives";

const GROUND_TRUTH = [
  "DEPOSIT POLYSILICON",
  "POLYSILICON ANNEAL",
  "ALIGN MASK LEVEL 2",
  "EXPOSE LITHO LEVEL 2",
  "DEVELOP PHOTORESIST",
  "POLYSILICON ETCH",
  "STRIP PHOTORESIST",
  "CLEAN AFTER POLY ETCH",
  "IMPLANT SOURCE DRAIN",
  "RAPID THERMAL ANNEAL",
];

const PREDICTED = [
  "DEPOSIT POLYSILICON",
  "POLYSILICON ANNEAL",
  "ALIGN MASK LEVEL 2",
  "EXPOSE LITHO LEVEL 2",
  "DEVELOP PHOTORESIST",
  "POLYSILICON ETCH DRY", // ← mismatch: model predicted DRY variant
  "STRIP PHOTORESIST",
  "CLEAN AFTER POLY ETCH",
  "IMPLANT SOURCE DRAIN",
  "RAPID THERMAL ANNEAL",
];

export function GroundTruthComparison() {
  const matches = GROUND_TRUTH.map((t, i) => t === PREDICTED[i]);
  const correct = matches.filter(Boolean).length;
  const acc = (correct / matches.length) * 100;

  return (
    <Panel
      title="Ground Truth Comparison · MOSFET reference recipe"
      meta={
        <span className="flex items-center gap-2">
          <StatusDot color={acc >= 80 ? "success" : "warning"} />
          {correct}/{matches.length} match · {acc.toFixed(0)}% sequence accuracy
        </span>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_220px] gap-4">
        {/* Ground truth column */}
        <div className="border border-border">
          <div className="px-3 py-2 border-b border-border bg-surface flex items-center justify-between">
            <span className="text-tiny font-mono uppercase tracking-widest">
              Ground Truth
            </span>
            <span className="text-tiny font-mono text-muted-foreground">
              fab golden recipe
            </span>
          </div>
          {GROUND_TRUTH.map((t, i) => (
            <div
              key={i}
              className={`grid grid-cols-[36px_1fr] gap-2 px-3 py-2 items-center ${
                i !== GROUND_TRUTH.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="font-mono text-tiny text-muted-foreground tabular">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs">{t}</span>
            </div>
          ))}
        </div>

        {/* Prediction column */}
        <div className="border border-border">
          <div className="px-3 py-2 border-b border-border bg-surface flex items-center justify-between">
            <span className="text-tiny font-mono uppercase tracking-widest text-[var(--info)]">
              SiliconGPT
            </span>
            <span className="text-tiny font-mono text-muted-foreground">
              greedy decode · T=0.0
            </span>
          </div>
          {PREDICTED.map((t, i) => {
            const ok = matches[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[36px_1fr_24px] gap-2 px-3 py-2 items-center ${
                  i !== PREDICTED.length - 1 ? "border-b border-border" : ""
                } ${ok ? "" : "bg-destructive/5"}`}
              >
                <span className="font-mono text-tiny text-muted-foreground tabular">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`font-mono text-xs ${
                    ok ? "" : "text-destructive line-through decoration-destructive/40"
                  }`}
                >
                  {t}
                </span>
                <span
                  className={`font-mono text-xs text-right ${
                    ok ? "text-[var(--success)]" : "text-destructive"
                  }`}
                >
                  {ok ? "✓" : "✗"}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Scorecard */}
        <div className="flex flex-col gap-3">
          <div className="border border-foreground p-4">
            <Label>Exact Match</Label>
            <div className="font-mono text-5xl font-semibold tabular mt-1">
              {acc.toFixed(0)}<span className="text-2xl text-muted-foreground">%</span>
            </div>
            <div className="text-tiny font-mono text-muted-foreground mt-1">
              token-level alignment
            </div>
          </div>

          <div className="border border-border p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <Label>✓ Hits</Label>
              <div className="font-mono text-xl tabular text-[var(--success)]">
                {correct}
              </div>
            </div>
            <div>
              <Label>✗ Miss</Label>
              <div className="font-mono text-xl tabular text-destructive">
                {matches.length - correct}
              </div>
            </div>
            <div>
              <Label>Total</Label>
              <div className="font-mono text-xl tabular">{matches.length}</div>
            </div>
          </div>

          <div className="border border-border p-3 text-tiny font-mono text-muted-foreground space-y-1">
            <div className="text-foreground">Disagreement audit</div>
            {matches
              .map((ok, i) => ({ ok, i }))
              .filter((x) => !x.ok)
              .map((x) => (
                <div key={x.i} className="flex justify-between">
                  <span className="text-muted-foreground">@{String(x.i + 1).padStart(2, "0")}</span>
                  <span className="text-foreground">
                    {GROUND_TRUTH[x.i]} → <span className="text-destructive">{PREDICTED[x.i]}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
