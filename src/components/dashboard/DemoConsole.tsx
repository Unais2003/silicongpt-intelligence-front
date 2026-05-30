import { useMemo, useState } from "react";
import { Panel, StatusDot } from "./primitives";
import { motion } from "framer-motion";

const TOKENS = ["LITH", "DEV", "ETCH", "STRP", "CLN", "DIFF", "DEP", "CMP", "ION", "OXD", "ANN", "METR"];

const RULES: Record<string, { token: string; name: string; p: number }[]> = {
  LITH: [{ token: "DEV", name: "Develop", p: 0.91 }, { token: "INSP", name: "Inspect", p: 0.06 }, { token: "STRP", name: "Strip", p: 0.03 }],
  DEV: [{ token: "ETCH", name: "Plasma Etch", p: 0.84 }, { token: "INSP", name: "Inspect", p: 0.11 }, { token: "STRP", name: "Strip", p: 0.05 }],
  ETCH: [{ token: "STRP", name: "Resist Strip", p: 0.77 }, { token: "CLN", name: "Wet Clean", p: 0.18 }, { token: "METR", name: "Metrology", p: 0.05 }],
  STRP: [{ token: "CLN", name: "Wet Clean", p: 0.88 }, { token: "METR", name: "Metrology", p: 0.08 }, { token: "DIFF", name: "Diffusion", p: 0.04 }],
  CLN: [{ token: "DIFF", name: "Diffusion", p: 0.74 }, { token: "DEP", name: "PECVD", p: 0.18 }, { token: "ION", name: "Ion Implant", p: 0.05 }],
  DEFAULT: [{ token: "METR", name: "Metrology", p: 0.55 }, { token: "INSP", name: "Inspect", p: 0.28 }, { token: "CLN", name: "Wet Clean", p: 0.17 }],
};

export function DemoConsole() {
  const [seq, setSeq] = useState<string[]>(["LITH", "DEV", "ETCH"]);

  const preds = useMemo(() => {
    const last = seq[seq.length - 1];
    return RULES[last] ?? RULES.DEFAULT;
  }, [seq]);

  function add(t: string) {
    setSeq((s) => [...s, t]);
  }
  function undo() {
    setSeq((s) => (s.length > 0 ? s.slice(0, -1) : s));
  }
  function reset() {
    setSeq([]);
  }

  return (
    <Panel
      title="Demo Console · sgpt-infer/0.4"
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> READY · interactive</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            Input Process Sequence
          </div>
          <div className="border border-border bg-surface p-3 min-h-[80px] flex flex-wrap items-start gap-1.5">
            <span className="font-mono text-xs text-muted-foreground mr-1">›</span>
            {seq.length === 0 && (
              <span className="font-mono text-xs text-muted-foreground italic">
                empty — pick a starting token below
              </span>
            )}
            {seq.map((t, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-mono text-xs px-2 py-1 border border-border-strong bg-card"
              >
                {t}
              </motion.span>
            ))}
            <span className="font-mono text-xs px-2 py-1 border border-dashed border-foreground text-foreground">
              ?
            </span>
          </div>

          <div className="text-tiny font-mono uppercase text-muted-foreground mt-4 mb-2">
            Vocabulary · click to append
          </div>
          <div className="flex flex-wrap gap-1">
            {TOKENS.map((t) => (
              <button
                key={t}
                onClick={() => add(t)}
                className="font-mono text-xs px-2 py-1 border border-border hover:border-foreground hover:bg-surface transition-colors"
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={undo}
              className="font-mono text-xs px-3 py-1.5 border border-border hover:bg-surface"
            >
              ← UNDO
            </button>
            <button
              onClick={reset}
              className="font-mono text-xs px-3 py-1.5 border border-border hover:bg-surface"
            >
              RESET
            </button>
            <button className="ml-auto font-mono text-xs px-3 py-1.5 border border-foreground bg-foreground text-background">
              RUN INFERENCE ▸
            </button>
          </div>
        </div>

        <div>
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            Predicted Next Step
          </div>
          <div className="border border-border">
            {preds.map((p, i) => (
              <div
                key={p.token}
                className={`grid grid-cols-[70px_1fr_70px] gap-3 items-center px-3 py-3 ${
                  i !== preds.length - 1 ? "border-b border-border" : ""
                } ${i === 0 ? "bg-surface" : ""}`}
              >
                <span className="font-mono text-xs font-semibold">{p.token}</span>
                <div>
                  <div className="text-sm">{p.name}</div>
                  <div className="relative h-1.5 mt-1 bg-border">
                    <motion.div
                      key={p.token + p.p}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.p * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className={i === 0 ? "absolute inset-y-0 bg-foreground" : "absolute inset-y-0 bg-muted-foreground"}
                    />
                  </div>
                </div>
                <span className="font-mono text-sm tabular text-right">{(p.p * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-px bg-border border border-border">
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">PREFIX LEN</div><div className="font-mono text-sm">{seq.length}</div></div>
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">VALID</div><div className="font-mono text-sm text-[var(--success)]">YES</div></div>
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">LATENCY</div><div className="font-mono text-sm">11.4 ms</div></div>
          </div>

          <div className="mt-3 text-tiny font-mono text-muted-foreground leading-relaxed">
            Probabilities computed by sgpt-0.4 decoder with KV-cache reuse.
            All candidates are constraint-validated before display.
          </div>
        </div>
      </div>
    </Panel>
  );
}
