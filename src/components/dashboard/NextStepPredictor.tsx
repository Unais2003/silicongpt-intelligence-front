import { Panel, StatusDot } from "./primitives";
import { motion } from "framer-motion";

const GIVEN = ["LITH", "DEV", "ETCH", "STRP", "CLN"];

const PREDICTIONS = [
  { token: "DIFF", name: "Diffusion · POCl3", p: 0.742, top: true },
  { token: "DEP", name: "PECVD Deposition · SiO2", p: 0.183 },
  { token: "ION", name: "Ion Implant · B11", p: 0.052 },
  { token: "OXD", name: "Thermal Oxide", p: 0.018 },
  { token: "ANN", name: "RTA Anneal · 1050°C", p: 0.005 },
];

export function NextStepPredictor() {
  return (
    <Panel
      title="Next-Step Prediction Engine"
      meta={<span>ctx 5 / 512 · temp 0.0 · top-k 5</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            Given Process Prefix
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GIVEN.map((t, i) => (
              <span
                key={i}
                className="font-mono text-xs px-2 py-1 border border-border bg-surface"
              >
                {t}
              </span>
            ))}
            <span className="font-mono text-xs px-2 py-1 border border-dashed border-border-strong text-muted-foreground">
              ?
            </span>
          </div>

          <div className="mt-6 text-tiny font-mono uppercase text-muted-foreground mb-2">
            Argmax Decision
          </div>
          <div className="border border-foreground p-3 bg-card">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold">DIFF · Diffusion</span>
              <StatusDot color="success" />
            </div>
            <div className="mt-1 text-tiny font-mono text-muted-foreground">
              p = 0.742 · entropy 0.91 nats · valid under fab constraints
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-px bg-border border border-border">
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">PERPLEXITY</div><div className="font-mono text-sm">2.48</div></div>
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">LATENCY</div><div className="font-mono text-sm">11.4 ms</div></div>
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">KV-CACHE</div><div className="font-mono text-sm">3.1 KB</div></div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            Top-5 Candidate Distribution
          </div>
          <div className="border border-border">
            {PREDICTIONS.map((p, i) => (
              <div
                key={p.token}
                className={`grid grid-cols-[60px_1fr_80px_60px] items-center gap-3 px-3 py-2 ${
                  i !== PREDICTIONS.length - 1 ? "border-b border-border" : ""
                } ${p.top ? "bg-surface" : ""}`}
              >
                <span className="font-mono text-xs font-semibold">{p.token}</span>
                <div>
                  <div className="text-sm">{p.name}</div>
                  <div className="relative h-1.5 mt-1 bg-border">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.p * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className={p.top ? "absolute inset-y-0 bg-foreground" : "absolute inset-y-0 bg-muted-foreground"}
                    />
                  </div>
                </div>
                <span className="font-mono text-sm tabular text-right">{(p.p * 100).toFixed(1)}%</span>
                <span className="font-mono text-tiny text-muted-foreground text-right">
                  logit {(Math.log(p.p) * 1.5).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
