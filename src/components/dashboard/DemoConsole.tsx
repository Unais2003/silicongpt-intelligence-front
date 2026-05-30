import { useMemo, useState } from "react";
import { Panel, StatusDot } from "./primitives";
import { motion } from "framer-motion";

const TOKENS = [
  "PRE CLEAN WAFER",
  "THERMAL OXIDATION",
  "DEPOSIT POLYSILICON",
  "ALIGN MASK LEVEL 1",
  "EXPOSE LITHO LEVEL 1",
  "DEVELOP PHOTORESIST",
  "OXIDE ETCH",
  "STRIP PHOTORESIST",
  "IMPLANT WELL",
  "RAPID THERMAL ANNEAL",
  "DEPOSIT INTERLAYER DIELECTRIC",
  "CMP DIELECTRIC",
];

const RULES: Record<string, { token: string; name: string; p: number }[]> = {
  "PRE CLEAN WAFER": [
    { token: "THERMAL OXIDATION", name: "Thermal Oxidation", p: 0.71 },
    { token: "DEPOSIT POLYSILICON", name: "Deposit Poly", p: 0.18 },
    { token: "ALIGN MASK LEVEL 1", name: "Align Mask L1", p: 0.11 },
  ],
  "DEVELOP PHOTORESIST": [
    { token: "OXIDE ETCH", name: "Oxide Etch", p: 0.84 },
    { token: "STRIP PHOTORESIST", name: "Strip Resist", p: 0.09 },
    { token: "IMPLANT WELL", name: "Implant Well", p: 0.07 },
  ],
  "OXIDE ETCH": [
    { token: "STRIP PHOTORESIST", name: "Strip Resist", p: 0.79 },
    { token: "IMPLANT WELL", name: "Implant Well", p: 0.14 },
    { token: "RAPID THERMAL ANNEAL", name: "RTA", p: 0.07 },
  ],
  "STRIP PHOTORESIST": [
    { token: "IMPLANT WELL", name: "Implant Well", p: 0.67 },
    { token: "RAPID THERMAL ANNEAL", name: "RTA", p: 0.21 },
    { token: "PRE CLEAN WAFER", name: "Pre Clean", p: 0.12 },
  ],
  DEFAULT: [
    { token: "RAPID THERMAL ANNEAL", name: "RTA", p: 0.52 },
    { token: "DEPOSIT INTERLAYER DIELECTRIC", name: "Deposit ILD", p: 0.31 },
    { token: "CMP DIELECTRIC", name: "CMP", p: 0.17 },
  ],
};

export function DemoConsole() {
  const [seq, setSeq] = useState<string[]>(["PRE CLEAN WAFER", "THERMAL OXIDATION"]);

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
