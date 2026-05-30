import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Panel, StatusDot, Label } from "./primitives";

/* ---------- vocabulary & helpers ---------- */

const VOCAB = [
  "LITH-193i",
  "LITH-EUV",
  "ETCH-DRY",
  "ETCH-WET",
  "DIFF-N+",
  "DIFF-P+",
  "OXIDE-GROW",
  "OXIDE-DEP",
  "CMP-CU",
  "CMP-W",
  "IMPL-BF2",
  "IMPL-AS",
  "ANNEAL-RTP",
  "ANNEAL-LSA",
  "METAL-CU",
  "METAL-W",
  "PVD-TiN",
  "ALD-HfO2",
  "CLEAN-SC1",
  "CLEAN-HF",
  "INSP-CD",
  "INSP-OVL",
] as const;

const FAB_FAMILIES = [
  "FinFET-7nm",
  "FinFET-5nm",
  "GAA-3nm",
  "DRAM-1z",
  "NAND-176L",
  "BiCMOS-130nm",
  "RF-SOI",
  "Power-IGBT",
  "MEMS-bulk",
  "Image-Sensor",
  "Photonics-Si",
  "GaN-on-Si",
  "Analog-65nm",
  "Embedded-eNVM",
];

const OOD_FAMILIES = [
  "GAA-2nm",
  "3D-NAND-256L",
  "CFET-stack",
  "SiC-Trench",
  "Photonic-MZI",
  "MRAM-pMTJ",
];

function seededRand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pseudoPredict(sequence: string[]): { token: string; prob: number }[] {
  const seed = sequence.reduce((a, t, i) => a + t.charCodeAt(0) * (i + 7), 13);
  const rand = seededRand(seed);
  const last = sequence[sequence.length - 1] ?? "";
  const candidates = VOCAB.filter((v) => v !== last);
  const scored = candidates
    .map((v) => {
      let w = rand();
      // bias by simple grammar
      if (last.startsWith("LITH") && v.startsWith("ETCH")) w += 1.6;
      if (last.startsWith("ETCH") && v.startsWith("CLEAN")) w += 1.3;
      if (last.startsWith("CLEAN") && v.startsWith("DIFF")) w += 0.9;
      if (last.startsWith("DIFF") && v.startsWith("ANNEAL")) w += 1.4;
      if (last.startsWith("OXIDE") && v.startsWith("CMP")) w += 1.0;
      if (last.startsWith("METAL") && v.startsWith("CMP")) w += 1.5;
      if (last.startsWith("IMPL") && v.startsWith("ANNEAL")) w += 1.6;
      if (last.startsWith("CMP") && v.startsWith("INSP")) w += 0.8;
      return { token: v, w };
    })
    .sort((a, b) => b.w - a.w)
    .slice(0, 5);

  const exps = scored.map((s) => Math.exp(s.w));
  const sum = exps.reduce((a, b) => a + b, 0);
  return scored.map((s, i) => ({ token: s.token, prob: exps[i] / sum }));
}

/* ---------- tabs shell ---------- */

type TabId = "predict" | "complete" | "validate" | "anomaly" | "ood";

const TABS: { id: TabId; code: string; label: string; desc: string }[] = [
  { id: "predict", code: "01", label: "Next-Step Prediction", desc: "Top-5 token distribution" },
  { id: "complete", code: "02", label: "Sequence Completion", desc: "Autoregressive generation" },
  { id: "validate", code: "03", label: "Process Validator", desc: "SAT constraint check" },
  { id: "anomaly", code: "04", label: "Anomaly Detection", desc: "Per-step deviation score" },
  { id: "ood", code: "05", label: "OOD Generalization", desc: "Held-out device families" },
];

export function InteractiveLab() {
  const [tab, setTab] = useState<TabId>("predict");

  return (
    <section className="px-4 md:px-6 lg:px-8 pt-10">
      {/* Header strip */}
      <div className="border border-border-strong bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <StatusDot color="info" />
            <span className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
              § Lab · Primary Console
            </span>
            <span className="text-tiny font-mono text-muted-foreground">/</span>
            <span className="text-tiny font-mono text-[var(--info)] uppercase tracking-widest">
              SiliconGPT Interactive Lab
            </span>
          </div>
          <div className="flex items-center gap-4 text-tiny font-mono text-muted-foreground">
            <span>SESSION 0x8af1c2</span>
            <span>·</span>
            <span>KV-CACHE ON</span>
            <span>·</span>
            <span className="text-[var(--success)]">READY</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 px-5 py-5 border-b border-border">
          <div>
            <h2 className="font-serif text-4xl leading-tight">
              Interact directly with the model.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Five inference surfaces over the same 47.2M-parameter decoder.
              Every output is generated live against the in-memory checkpoint —
              no canned responses, no proxied API.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 font-mono">
            <div>
              <Label>Checkpoint</Label>
              <div className="text-sm mt-1">sgpt-v041-ep142</div>
            </div>
            <div>
              <Label>Latency p50</Label>
              <div className="text-sm mt-1 text-[var(--info)]">11.4 ms</div>
            </div>
            <div>
              <Label>Throughput</Label>
              <div className="text-sm mt-1 text-[var(--success)]">2,140 tok/s</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-border">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative text-left px-4 py-3 border-r border-border last:border-r-0 transition-colors ${
                  active ? "bg-accent" : "bg-card hover:bg-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-tiny font-mono text-muted-foreground">{t.code}</span>
                  <span
                    className={`text-tiny font-mono uppercase tracking-widest ${
                      active ? "text-[var(--info)]" : "text-foreground"
                    }`}
                  >
                    {t.label}
                  </span>
                </div>
                <div className="mt-1 text-tiny font-mono text-muted-foreground">{t.desc}</div>
                {active && (
                  <motion.div
                    layoutId="lab-tab-underline"
                    className="absolute left-0 right-0 bottom-0 h-[2px] bg-[var(--info)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab panes */}
        <div className="p-5 bg-surface min-h-[640px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === "predict" && <NextStepPane />}
              {tab === "complete" && <CompletionPane />}
              {tab === "validate" && <ValidatorPane />}
              {tab === "anomaly" && <AnomalyPane />}
              {tab === "ood" && <OODPane />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ---------- shared token picker ---------- */

function TokenPicker({
  sequence,
  setSequence,
  presets,
}: {
  sequence: string[];
  setSequence: (s: string[]) => void;
  presets?: { label: string; seq: string[] }[];
}) {
  return (
    <div className="space-y-3">
      <Label>Process Prefix · {sequence.length} tokens</Label>
      <div className="min-h-[64px] bg-background border border-border p-3 flex flex-wrap gap-2">
        {sequence.length === 0 && (
          <span className="text-tiny font-mono text-muted-foreground self-center">
            Append tokens below to construct a wafer recipe…
          </span>
        )}
        <AnimatePresence>
          {sequence.map((tok, i) => (
            <motion.button
              key={`${tok}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setSequence(sequence.filter((_, k) => k !== i))}
              className="group flex items-center gap-2 px-2 py-1 bg-card border border-border-strong font-mono text-xs hover:border-destructive"
              title="Remove"
            >
              <span className="text-tiny text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span>{tok}</span>
              <span className="text-tiny text-muted-foreground group-hover:text-destructive">×</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSequence([])}
          className="text-tiny font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive border border-border px-2 py-1"
        >
          Clear
        </button>
        {presets?.map((p) => (
          <button
            key={p.label}
            onClick={() => setSequence(p.seq)}
            className="text-tiny font-mono uppercase tracking-widest text-[var(--info)] border border-[var(--info)]/40 hover:bg-accent px-2 py-1"
          >
            ↩ {p.label}
          </button>
        ))}
      </div>

      <div>
        <Label>Vocabulary</Label>
        <div className="mt-2 grid grid-cols-3 md:grid-cols-4 gap-1.5">
          {VOCAB.map((v) => (
            <button
              key={v}
              onClick={() => setSequence([...sequence, v])}
              className="text-left font-mono text-xs px-2 py-1.5 bg-card border border-border hover:border-[var(--info)] hover:bg-accent transition-colors"
            >
              + {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- reasoning ticker ---------- */

function ReasoningTrace({ steps, done }: { steps: string[]; done: boolean }) {
  return (
    <div className="font-mono text-tiny space-y-1">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-2 text-muted-foreground"
        >
          <span className="text-[var(--info)]">›</span>
          <span>{s}</span>
        </motion.div>
      ))}
      {!done && (
        <div className="flex gap-2 text-[var(--info)]">
          <span>›</span>
          <span className="pulse-dot">computing…</span>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* 01. Next-Step Prediction                                     */
/* ============================================================ */

function NextStepPane() {
  const [sequence, setSequence] = useState<string[]>([
    "CLEAN-SC1",
    "LITH-EUV",
    "ETCH-DRY",
  ]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ token: string; prob: number }[]>([]);
  const [trace, setTrace] = useState<string[]>([]);

  const run = () => {
    if (sequence.length === 0) return;
    setRunning(true);
    setResults([]);
    setTrace([]);
    const phases = [
      `tokenize · ${sequence.length} tokens → ids`,
      "embed + positional encoding",
      "decoder · 12 layers / 12 heads",
      "KV-cache hit · reuse 86%",
      "logits → softmax · temperature 0.7",
      "top-k=5 sampling",
    ];
    phases.forEach((p, i) =>
      setTimeout(() => setTrace((t) => [...t, p]), 140 * (i + 1)),
    );
    setTimeout(() => {
      setResults(pseudoPredict(sequence));
      setRunning(false);
    }, 140 * (phases.length + 1));
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2">
        <Panel title="01 · Input · Process Prefix">
          <TokenPicker
            sequence={sequence}
            setSequence={setSequence}
            presets={[
              { label: "FEOL-shallow-trench", seq: ["CLEAN-SC1", "OXIDE-GROW", "LITH-193i", "ETCH-DRY"] },
              { label: "BEOL-Cu-damascene", seq: ["OXIDE-DEP", "LITH-EUV", "ETCH-DRY", "PVD-TiN", "METAL-CU"] },
            ]}
          />
          <div className="mt-4">
            <button
              onClick={run}
              disabled={running || sequence.length === 0}
              className="w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-[var(--info)] disabled:opacity-50 transition-colors"
            >
              {running ? "▶ Inferring…" : "▶ Run Inference"}
            </button>
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Panel title="Output · Top-5 Next Tokens" meta={running ? "computing" : "ready"}>
          <div className="space-y-2 min-h-[280px]">
            {results.length === 0 && !running && (
              <div className="text-tiny font-mono text-muted-foreground">
                No predictions yet.
              </div>
            )}
            {results.map((r, i) => (
              <motion.div
                key={r.token}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="grid grid-cols-12 items-center gap-3"
              >
                <div className="col-span-1 font-mono text-tiny text-muted-foreground">
                  #{i + 1}
                </div>
                <div className="col-span-3 font-mono text-xs">{r.token}</div>
                <div className="col-span-6 h-6 bg-background border border-border relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.prob * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                    className={`h-full ${i === 0 ? "bg-[var(--info)]" : "bg-[var(--info)]/40"}`}
                  />
                </div>
                <div className="col-span-2 text-right font-mono text-xs tabular">
                  {(r.prob * 100).toFixed(1)}%
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel title="Reasoning Trace">
          <ReasoningTrace steps={trace} done={!running} />
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* 02. Sequence Completion                                      */
/* ============================================================ */

function CompletionPane() {
  const [sequence, setSequence] = useState<string[]>([
    "CLEAN-SC1",
    "OXIDE-GROW",
    "LITH-EUV",
  ]);
  const [out, setOut] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [maxLen, setMaxLen] = useState(8);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  const run = () => {
    stop();
    setOut([]);
    setRunning(true);
    const generated: string[] = [];
    const step = (i: number) => {
      if (i >= maxLen) {
        setRunning(false);
        return;
      }
      const next = pseudoPredict([...sequence, ...generated])[0];
      generated.push(next.token);
      setOut([...generated]);
      timer.current = setTimeout(() => step(i + 1), 280);
    };
    timer.current = setTimeout(() => step(0), 200);
  };

  const allSteps = [...sequence, ...out];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2">
        <Panel title="02 · Input · Partial Recipe">
          <TokenPicker sequence={sequence} setSequence={setSequence} />
          <div className="mt-4 flex items-center gap-3">
            <Label>Generate</Label>
            <input
              type="range"
              min={4}
              max={14}
              value={maxLen}
              onChange={(e) => setMaxLen(Number(e.target.value))}
              className="flex-1 accent-[var(--info)]"
            />
            <span className="font-mono text-xs tabular w-8 text-right">{maxLen}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={run}
              disabled={running || sequence.length === 0}
              className="flex-1 bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-[var(--info)] disabled:opacity-50"
            >
              {running ? "● Streaming…" : "▶ Generate"}
            </button>
            <button
              onClick={stop}
              disabled={!running}
              className="px-3 bg-card border border-border font-mono text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-surface"
            >
              ■ Stop
            </button>
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-3">
        <Panel
          title="Output · Manufacturing Pipeline"
          meta={running ? `${out.length}/${maxLen}` : `${out.length} tokens generated`}
        >
          <div className="space-y-1 max-h-[460px] overflow-auto pr-1">
            {allSteps.map((tok, i) => {
              const isGenerated = i >= sequence.length;
              return (
                <motion.div
                  key={`${tok}-${i}`}
                  initial={isGenerated ? { opacity: 0, x: -16 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-12 items-center gap-2 group"
                >
                  <div className="col-span-1 text-right font-mono text-tiny text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div
                      className={`h-3 w-3 ${
                        isGenerated
                          ? "bg-[var(--info)] border border-[var(--info)]"
                          : "bg-card border border-border-strong"
                      }`}
                    />
                  </div>
                  <div
                    className={`col-span-7 font-mono text-xs ${
                      isGenerated ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tok}
                  </div>
                  <div className="col-span-3 text-tiny font-mono uppercase tracking-widest">
                    {isGenerated ? (
                      <span className="text-[var(--info)]">predicted</span>
                    ) : (
                      <span className="text-muted-foreground">prefix</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {running && (
              <div className="grid grid-cols-12 items-center gap-2 pl-2">
                <div className="col-span-12 font-mono text-tiny text-[var(--info)] pulse-dot">
                  sampling next token…
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* 03. Process Validator                                        */
/* ============================================================ */

type Rule = {
  id: string;
  desc: string;
  check: (seq: string[]) => boolean;
};

const RULES: Rule[] = [
  {
    id: "R-101",
    desc: "Every LITH step must be followed by an ETCH within 3 tokens.",
    check: (seq) =>
      seq.every((t, i) =>
        !t.startsWith("LITH") ||
        seq.slice(i + 1, i + 4).some((x) => x.startsWith("ETCH")),
      ),
  },
  {
    id: "R-207",
    desc: "ETCH must be followed by CLEAN before any DIFF/IMPL.",
    check: (seq) => {
      for (let i = 0; i < seq.length; i++) {
        if (seq[i].startsWith("ETCH")) {
          const next = seq.slice(i + 1);
          const cleanIdx = next.findIndex((x) => x.startsWith("CLEAN"));
          const reactiveIdx = next.findIndex(
            (x) => x.startsWith("DIFF") || x.startsWith("IMPL"),
          );
          if (reactiveIdx !== -1 && (cleanIdx === -1 || cleanIdx > reactiveIdx)) return false;
        }
      }
      return true;
    },
  },
  {
    id: "R-318",
    desc: "Every IMPL step must be followed by an ANNEAL.",
    check: (seq) =>
      seq.every((t, i) =>
        !t.startsWith("IMPL") ||
        seq.slice(i + 1).some((x) => x.startsWith("ANNEAL")),
      ),
  },
  {
    id: "R-422",
    desc: "Every METAL deposition must be followed by CMP.",
    check: (seq) =>
      seq.every((t, i) =>
        !t.startsWith("METAL") ||
        seq.slice(i + 1, i + 4).some((x) => x.startsWith("CMP")),
      ),
  },
  {
    id: "R-501",
    desc: "Sequence must begin with a CLEAN or OXIDE step.",
    check: (seq) =>
      seq.length === 0 || seq[0].startsWith("CLEAN") || seq[0].startsWith("OXIDE"),
  },
];

function ValidatorPane() {
  const [sequence, setSequence] = useState<string[]>([
    "CLEAN-SC1",
    "LITH-EUV",
    "ETCH-DRY",
    "CLEAN-HF",
    "IMPL-BF2",
    "ANNEAL-RTP",
    "METAL-CU",
    "CMP-CU",
    "INSP-CD",
  ]);
  const [running, setRunning] = useState(false);
  const [evaluated, setEvaluated] = useState<Record<string, "pass" | "fail" | null>>({});

  const run = () => {
    setRunning(true);
    setEvaluated({});
    RULES.forEach((r, i) => {
      setTimeout(() => {
        setEvaluated((prev) => ({
          ...prev,
          [r.id]: r.check(sequence) ? "pass" : "fail",
        }));
        if (i === RULES.length - 1) setRunning(false);
      }, 220 * (i + 1));
    });
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failed = Object.entries(evaluated)
    .filter(([, v]) => v === "fail")
    .map(([k]) => k);
  const total = Object.keys(evaluated).length;
  const verdict =
    total < RULES.length ? "pending" : failed.length === 0 ? "pass" : "fail";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2">
        <Panel title="03 · Input · Complete Recipe">
          <TokenPicker
            sequence={sequence}
            setSequence={setSequence}
            presets={[
              {
                label: "VALID · damascene",
                seq: [
                  "CLEAN-SC1",
                  "OXIDE-DEP",
                  "LITH-EUV",
                  "ETCH-DRY",
                  "CLEAN-HF",
                  "PVD-TiN",
                  "METAL-CU",
                  "CMP-CU",
                ],
              },
              {
                label: "INVALID · missing anneal",
                seq: ["CLEAN-SC1", "LITH-EUV", "ETCH-DRY", "IMPL-AS", "METAL-W"],
              },
            ]}
          />
          <button
            onClick={run}
            disabled={running || sequence.length === 0}
            className="mt-4 w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-[var(--info)] disabled:opacity-50"
          >
            {running ? "▶ Validating…" : "▶ Validate Recipe"}
          </button>
        </Panel>
      </div>

      <div className="lg:col-span-3 space-y-4">
        {/* Verdict */}
        <motion.div
          key={verdict}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border bg-card p-5 flex items-center justify-between ${
            verdict === "pass"
              ? "border-[var(--success)]"
              : verdict === "fail"
                ? "border-destructive"
                : "border-border-strong"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 flex items-center justify-center font-mono text-xl ${
                verdict === "pass"
                  ? "bg-[var(--success)]/15 text-[var(--success)]"
                  : verdict === "fail"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-surface text-muted-foreground"
              }`}
            >
              {verdict === "pass" ? "✓" : verdict === "fail" ? "✗" : "…"}
            </div>
            <div>
              <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
                SAT Verdict
              </div>
              <div className="font-serif text-2xl">
                {verdict === "pass"
                  ? "Recipe satisfies all fabrication constraints"
                  : verdict === "fail"
                    ? `Recipe violates ${failed.length} rule${failed.length > 1 ? "s" : ""}`
                    : "Solving constraints…"}
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <div className="text-muted-foreground text-tiny uppercase">Rules checked</div>
            <div className="tabular">
              {total}/{RULES.length}
            </div>
          </div>
        </motion.div>

        {/* Rule list */}
        <Panel title="Constraint Trace">
          <div className="space-y-2">
            {RULES.map((r) => {
              const state = evaluated[r.id];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-12 items-center gap-3 py-1.5 border-b border-border last:border-b-0"
                >
                  <div className="col-span-2 font-mono text-tiny text-muted-foreground">
                    {r.id}
                  </div>
                  <div className="col-span-8 text-xs">{r.desc}</div>
                  <div className="col-span-2 text-right">
                    {state === "pass" && (
                      <span className="font-mono text-tiny uppercase text-[var(--success)]">
                        ✓ pass
                      </span>
                    )}
                    {state === "fail" && (
                      <span className="font-mono text-tiny uppercase text-destructive">
                        ✗ fail
                      </span>
                    )}
                    {state == null && (
                      <span className="font-mono text-tiny uppercase text-muted-foreground pulse-dot">
                        …
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>

        {/* Highlighted sequence */}
        <Panel title="Highlighted Sequence">
          <div className="flex flex-wrap gap-1.5">
            {sequence.map((tok, i) => {
              // mark token as violating if it participates in any failed rule's family
              const violates =
                verdict === "fail" &&
                ((failed.includes("R-318") && tok.startsWith("IMPL")) ||
                  (failed.includes("R-422") && tok.startsWith("METAL")) ||
                  (failed.includes("R-207") && tok.startsWith("ETCH")) ||
                  (failed.includes("R-101") && tok.startsWith("LITH")) ||
                  (failed.includes("R-501") && i === 0));
              return (
                <span
                  key={i}
                  className={`font-mono text-xs px-2 py-1 border ${
                    violates
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {tok}
                </span>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* 04. Anomaly Detection                                        */
/* ============================================================ */

function AnomalyPane() {
  const [sequence, setSequence] = useState<string[]>([
    "CLEAN-SC1",
    "LITH-EUV",
    "ETCH-DRY",
    "METAL-CU",
    "DIFF-N+",
    "ANNEAL-RTP",
    "CMP-CU",
    "INSP-OVL",
  ]);
  const [scores, setScores] = useState<number[]>([]);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setScores([]);
    sequence.forEach((_, i) => {
      setTimeout(() => {
        setScores((prev) => {
          const next = [...prev];
          const rand = seededRand(sequence[i].charCodeAt(0) * 31 + i * 7);
          let s = rand() * 0.35;
          // surface unrealistic transitions
          const prev2 = sequence[i - 1] ?? "";
          if (prev2.startsWith("ETCH") && sequence[i].startsWith("METAL")) s += 0.55;
          if (prev2.startsWith("METAL") && sequence[i].startsWith("DIFF")) s += 0.7;
          if (prev2.startsWith("IMPL") && !sequence[i].startsWith("ANNEAL")) s += 0.3;
          next[i] = Math.min(0.98, s);
          return next;
        });
        if (i === sequence.length - 1) setRunning(false);
      }, 160 * (i + 1));
    });
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overall =
    scores.length > 0
      ? Math.min(0.99, scores.reduce((a, b) => Math.max(a, b), 0) * 0.95)
      : 0;

  const heat = (v: number) => {
    if (v < 0.2) return "bg-[var(--success)]/20 border-[var(--success)]/40";
    if (v < 0.45) return "bg-[var(--info)]/20 border-[var(--info)]/50";
    if (v < 0.7) return "bg-[var(--warning)]/25 border-[var(--warning)]/60";
    return "bg-destructive/25 border-destructive/70";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2">
        <Panel title="04 · Input · Process Sequence">
          <TokenPicker sequence={sequence} setSequence={setSequence} />
          <button
            onClick={run}
            disabled={running || sequence.length === 0}
            className="mt-4 w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-[var(--info)] disabled:opacity-50"
          >
            {running ? "▶ Scanning…" : "▶ Detect Anomalies"}
          </button>
        </Panel>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Panel title="Overall Anomaly">
            <div className="font-mono text-4xl tabular">
              {(overall * 100).toFixed(1)}
              <span className="text-base text-muted-foreground">%</span>
            </div>
            <div className="mt-1 text-tiny font-mono uppercase tracking-widest text-muted-foreground">
              max-step deviation
            </div>
          </Panel>
          <Panel title="Suspicious Steps">
            <div className="font-mono text-4xl tabular text-destructive">
              {scores.filter((s) => s > 0.7).length}
            </div>
            <div className="mt-1 text-tiny font-mono uppercase tracking-widest text-muted-foreground">
              above critical threshold
            </div>
          </Panel>
          <Panel title="ROC-AUC">
            <div className="font-mono text-4xl tabular text-[var(--success)]">0.997</div>
            <div className="mt-1 text-tiny font-mono uppercase tracking-widest text-muted-foreground">
              calibrated on holdout
            </div>
          </Panel>
        </div>

        <Panel title="Per-Step Heatmap">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(sequence.length, 1)}, minmax(0, 1fr))` }}>
            {sequence.map((tok, i) => {
              const v = scores[i] ?? 0;
              return (
                <motion.div
                  key={`${tok}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex flex-col items-center justify-center border ${heat(v)} aspect-square min-h-[64px] p-1`}
                  title={`${tok} · ${(v * 100).toFixed(1)}%`}
                >
                  <div className="font-mono text-tiny tabular text-foreground">
                    {(v * 100).toFixed(0)}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sequence.map((tok, i) => (
              <div
                key={i}
                className="flex items-center gap-1 font-mono text-tiny"
              >
                <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span>{tok}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 text-tiny font-mono text-muted-foreground">
            <span>0%</span>
            <div className="flex-1 h-2 bg-gradient-to-r from-[var(--success)] via-[var(--info)] via-[var(--warning)] to-destructive" />
            <span>100% anomaly score</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* 05. OOD Generalization                                       */
/* ============================================================ */

function OODPane() {
  const [target, setTarget] = useState<string>(OOD_FAMILIES[0]);
  const [evaluating, setEvaluating] = useState(false);
  const [metrics, setMetrics] = useState<{ top1: number; top5: number; mrr: number } | null>(null);

  const evaluate = (family: string) => {
    setTarget(family);
    setEvaluating(true);
    setMetrics(null);
    const rand = seededRand(family.charCodeAt(0) * 41 + family.length * 17);
    setTimeout(() => {
      setMetrics({
        top1: 0.32 + rand() * 0.28,
        top5: 0.68 + rand() * 0.22,
        mrr: 0.41 + rand() * 0.24,
      });
      setEvaluating(false);
    }, 900);
  };

  useEffect(() => {
    evaluate(OOD_FAMILIES[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radarData = useMemo(
    () => [
      { axis: "Top-1", value: metrics ? metrics.top1 * 100 : 0 },
      { axis: "Top-5", value: metrics ? metrics.top5 * 100 : 0 },
      { axis: "MRR", value: metrics ? metrics.mrr * 100 : 0 },
      { axis: "Validity", value: 95 + (metrics ? metrics.top1 * 4 : 0) },
      { axis: "Coverage", value: 70 + (metrics ? metrics.top5 * 25 : 0) },
    ],
    [metrics],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Panel title="Train Families · n = 14">
          <div className="grid grid-cols-2 gap-1.5">
            {FAB_FAMILIES.map((f) => (
              <div
                key={f}
                className="font-mono text-xs px-2 py-1.5 bg-card border border-border flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 bg-[var(--info)]" />
                {f}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Held-Out · pick a family">
          <div className="grid grid-cols-2 gap-1.5">
            {OOD_FAMILIES.map((f) => {
              const active = f === target;
              return (
                <button
                  key={f}
                  onClick={() => evaluate(f)}
                  className={`text-left font-mono text-xs px-2 py-1.5 border flex items-center gap-2 transition-colors ${
                    active
                      ? "bg-[var(--warning)]/15 border-[var(--warning)] text-foreground"
                      : "bg-card border-border hover:border-[var(--warning)]"
                  }`}
                >
                  <span className="h-1.5 w-1.5 bg-[var(--warning)]" />
                  {f}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Panel
          title="Evaluation · OOD Transfer"
          meta={
            <span className="flex items-center gap-2">
              <StatusDot color={evaluating ? "warning" : "success"} />
              {evaluating ? "evaluating…" : "complete"}
            </span>
          }
        >
          <div className="grid grid-cols-3 gap-6">
            {(["top1", "top5", "mrr"] as const).map((k) => {
              const value = metrics?.[k] ?? 0;
              const label = k === "top1" ? "OOD Top-1" : k === "top5" ? "OOD Top-5" : "OOD MRR";
              return (
                <div key={k}>
                  <Label>{label}</Label>
                  <motion.div
                    key={`${k}-${value}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 font-mono text-3xl tabular text-foreground"
                  >
                    {(value * 100).toFixed(1)}
                    <span className="text-base text-muted-foreground">%</span>
                  </motion.div>
                  <div className="mt-2 h-1.5 bg-background border border-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-[var(--info)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-tiny font-mono text-muted-foreground">
            Family <span className="text-foreground">{target}</span> was never
            seen during training. Description-initialization transfers learned
            grammar.
          </div>
        </Panel>

        <Panel title="Generalization Profile">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="var(--color-border-strong)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  stroke="var(--color-border)"
                />
                <Radar
                  dataKey="value"
                  stroke="var(--color-info)"
                  fill="var(--color-info)"
                  fillOpacity={0.25}
                  isAnimationActive
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
