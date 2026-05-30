import { Panel, StatusDot } from "./primitives";
import { motion } from "framer-motion";

const NODES = [
  { id: "01", name: "Synthetic Data", detail: "9.2M sequences · 14 families", x: 0 },
  { id: "02", name: "Tokenization", detail: "BPE-process · 218 tokens", x: 1 },
  { id: "03", name: "Custom Vocabulary", detail: "Domain primitives + ops", x: 2 },
  { id: "04", name: "Decoder Transformer", detail: "12L · 12H · 768d · 47M", x: 3 },
  { id: "05", name: "Prediction", detail: "Next-token · KV-cache", x: 4 },
  { id: "06", name: "Validation", detail: "Constraint SAT solver", x: 5 },
  { id: "07", name: "Benchmarking", detail: "WaferBench v0.4", x: 6 },
];

export function ModelArchitecture() {
  return (
    <Panel
      title="Model Architecture"
      meta={<span>decoder-only · 47.2M params · trained from scratch</span>}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[1100px] relative">
          {/* Connection line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border-strong" />

          <div className="relative grid grid-cols-7 gap-3">
            {NODES.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative bg-card border border-border-strong p-3 z-10"
              >
                <div className="absolute -top-2 left-3 px-1.5 bg-card text-tiny font-mono text-muted-foreground">
                  {n.id}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xs font-semibold uppercase">{n.name}</span>
                  <StatusDot color={n.id === "04" ? "info" : "success"} pulse={n.id === "04"} />
                </div>
                <div className="mt-1.5 text-tiny font-mono text-muted-foreground leading-relaxed">
                  {n.detail}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Transformer internals */}
          <div className="mt-6 border border-border bg-surface p-4">
            <div className="text-tiny font-mono uppercase text-muted-foreground mb-3">
              Decoder Stack · per layer
            </div>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-card border border-border p-2">
                  <div className="text-tiny font-mono text-muted-foreground">L{(i + 1).toString().padStart(2, "0")}</div>
                  <div className="mt-1 h-1 bg-border relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${60 + Math.random() * 35}%` }}
                      transition={{ duration: 0.8, delay: i * 0.04 }}
                      className="absolute inset-y-0 bg-primary"
                    />
                  </div>
                  <div className="mt-1 text-tiny font-mono">attn·mlp</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-border border border-border">
              {[
                ["Hidden dim", "768"], ["Heads", "12"], ["Layers", "12"],
                ["Context", "512"], ["Vocab", "218"], ["Params", "47.2M"],
                ["Optim", "AdamW"], ["LR", "3e-4 cos"], ["Batch", "256"],
                ["Tokens seen", "4.7B"], ["Hardware", "A100×4"], ["Train time", "62h"],
              ].map(([k, v]) => (
                <div key={k} className="bg-card p-2">
                  <div className="text-tiny font-mono uppercase text-muted-foreground">{k}</div>
                  <div className="font-mono text-sm tabular">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
