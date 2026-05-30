import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, StatusDot, Label } from "./primitives";
import {
  api,
  type AnomalyEval,
  type AnomalyResult,
  type CompletionEval,
  type Health,
  type NextStepEval,
  type OODEval,
  type Prediction,
  type Violation,
} from "@/lib/api";

/* ============================================================ */
/* Domain data                                                  */
/* ============================================================ */

type Dataset = {
  id: string;
  family: string;
  node: string;
  description: string;
  steps: string[];
};

// IMPORTANT: tokens use SPACES (real backend vocab), not underscores.
const DATASETS: Record<string, Dataset> = {
  MOSFET: {
    id: "MOSFET",
    family: "Power MOSFET",
    node: "0.5 µm · 6\" wafer",
    description: "Planar n-channel MOSFET, 23-step reference recipe",
    steps: [
      "RECEIVE WAFER",
      "RCA CLEAN",
      "GROW THERMAL OXIDE",
      "DEPOSIT POLYSILICON",
      "PHOTORESIST COAT",
      "ALIGN MASK LEVEL 1",
      "EXPOSE LITHO LEVEL 1",
      "DEVELOP PHOTORESIST",
      "ETCH POLYSILICON",
      "STRIP PHOTORESIST",
      "IMPLANT N+",
      "ANNEAL DOPANTS",
      "DEPOSIT ILD",
      "CMP ILD",
      "PHOTORESIST COAT",
      "ALIGN MASK LEVEL 2",
      "EXPOSE LITHO LEVEL 2",
      "DEVELOP PHOTORESIST",
      "ETCH CONTACT",
      "DEPOSIT METAL 1",
      "ETCH METAL 1",
      "DEPOSIT PASSIVATION",
      "ELECTRICAL TEST",
    ],
  },
  IGBT: {
    id: "IGBT",
    family: "Insulated-Gate Bipolar Transistor",
    node: "1.2 µm · 8\" wafer",
    description: "Trench IGBT with backside collector, 18-step recipe",
    steps: [
      "RECEIVE WAFER",
      "RCA CLEAN",
      "DEPOSIT EPI LAYER",
      "GROW FIELD OXIDE",
      "PHOTORESIST COAT",
      "ALIGN MASK LEVEL 1",
      "EXPOSE LITHO LEVEL 1",
      "DEVELOP PHOTORESIST",
      "IMPLANT P-BASE",
      "DRIVE IN",
      "GROW GATE OXIDE",
      "DEPOSIT POLYSILICON",
      "ETCH POLYSILICON",
      "DEPOSIT METAL 1",
      "BACKSIDE GRIND",
      "DEPOSIT BACKSIDE METAL",
      "DEPOSIT PASSIVATION",
      "ELECTRICAL TEST",
    ],
  },
  IC: {
    id: "IC",
    family: "CMOS Logic (FEOL + BEOL)",
    node: "28 nm · 12\" wafer",
    description: "Full CMOS flow with damascene BEOL, 23-step recipe",
    steps: [
      "RECEIVE WAFER",
      "RCA CLEAN",
      "ETCH STI",
      "DEPOSIT STI OXIDE",
      "CMP OXIDE",
      "IMPLANT WELL",
      "GROW GATE OXIDE",
      "DEPOSIT POLYSILICON",
      "PHOTORESIST COAT",
      "ALIGN MASK LEVEL 1",
      "EXPOSE LITHO LEVEL 1",
      "DEVELOP PHOTORESIST",
      "ETCH POLYSILICON",
      "IMPLANT LDD",
      "DEPOSIT SPACER",
      "IMPLANT S/D",
      "ANNEAL DOPANTS",
      "DEPOSIT ILD",
      "ETCH CONTACT",
      "DEPOSIT METAL 1",
      "ETCH METAL 1",
      "DEPOSIT PASSIVATION",
      "ELECTRICAL TEST",
    ],
  },
  OOD: {
    id: "OOD",
    family: "Novel Device · Held-Out",
    node: "Sub-2 nm · research",
    description:
      "Out-of-distribution sample. Tokens are illustrative — most will resolve to <UNK>.",
    steps: [
      "RECEIVE WAFER",
      "CRYO ETCH",
      "2D TRANSFER MoS2",
      "ALD HfZrO2",
      "FERRO ANNEAL",
      "GRAPHENE CONTACT",
      "BEOL AIR GAP",
      "PHOTONIC COUPLER",
    ],
  },
};

const PROCESS_STAGE: Record<string, string> = {
  RECEIVE: "Incoming",
  RCA: "Surface Prep",
  CLEAN: "Surface Prep",
  GROW: "FEOL · Oxide",
  THERMAL: "FEOL · Oxide",
  EPI: "FEOL · Epi",
  FIELD: "FEOL · Isolation",
  STI: "FEOL · Isolation",
  WELL: "FEOL · Doping",
  GATE: "FEOL · Gate",
  POLY: "FEOL · Gate",
  POLYSILICON: "FEOL · Gate",
  IMPLANT: "FEOL · Doping",
  LDD: "FEOL · Doping",
  ANNEAL: "Thermal",
  DRIVE: "Thermal",
  PHOTORESIST: "Lithography",
  ALIGN: "Lithography",
  EXPOSE: "Lithography",
  DEVELOP: "Lithography",
  STRIP: "Lithography",
  HARD: "Lithography",
  CMP: "BEOL · Planarize",
  ILD: "BEOL · Dielectric",
  CONTACT: "BEOL · Contact",
  SILICIDE: "BEOL · Contact",
  SPACER: "FEOL · Gate",
  METAL: "BEOL · Metal",
  ETCH: "Etch",
  DEPOSIT: "Deposition",
  W: "BEOL · Metal",
  CU: "BEOL · Metal",
  BACKSIDE: "Backside",
  COLLECTOR: "Backside",
  EMITTER: "BEOL · Metal",
  PASSIVATION: "Final",
  ELECTRICAL: "Metrology",
  CD: "Metrology",
  CRYO: "Novel",
  "2D": "Novel · 2D",
  ALD: "Novel · ALD",
  FERRO: "Novel · Ferro",
  GRAPHENE: "Novel · Contact",
  BEOL: "Novel · BEOL",
  PHOTONIC: "Novel · Photonic",
};

function stageOf(step: string): string {
  // Tokens are space-separated; fall back to underscore for legacy / OOD.
  const head = step.split(/[\s_]/)[0];
  return PROCESS_STAGE[head] ?? PROCESS_STAGE[step] ?? "Process";
}

// Normalize a raw user-pasted token: trim, collapse whitespace, uppercase.
// Spaces inside the token are PRESERVED — the backend vocab uses them.
function normalizeToken(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

/* ============================================================ */
/* Step 1 — Import Data                                         */
/* ============================================================ */

type ImportMode = "demo" | "paste" | "upload" | "random";

function ImportPanel({
  dataset,
  setDataset,
  setSteps,
}: {
  dataset: Dataset;
  setDataset: (d: Dataset) => void;
  setSteps: (s: string[]) => void;
}) {
  const [mode, setMode] = useState<ImportMode>("demo");
  const [paste, setPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Random mode state
  const [temperature, setTemperature] = useState(0.9);
  const [randPrefix, setRandPrefix] = useState("");
  const [randLoading, setRandLoading] = useState(false);
  const [randError, setRandError] = useState<string | null>(null);

  const parseTokens = (text: string) =>
    text
      .split(/[\r\n,;|]+/)
      .map(normalizeToken)
      .filter((s) => s && !s.startsWith("#"));

  const loadPaste = () => {
    const tokens = parseTokens(paste);
    if (tokens.length) {
      setDataset({
        id: "CUSTOM",
        family: "User Recipe",
        node: "—",
        description: `${tokens.length}-step custom sequence`,
        steps: tokens,
      });
      setSteps(tokens);
    }
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const tokens = parseTokens(text);
      if (tokens.length) {
        setDataset({
          id: "CSV",
          family: f.name,
          node: `${(f.size / 1024).toFixed(1)} KB`,
          description: `${tokens.length}-step recipe imported from CSV`,
          steps: tokens,
        });
        setSteps(tokens);
      }
    };
    reader.readAsText(f);
  };

  const sampleRandom = async () => {
    setRandLoading(true);
    setRandError(null);
    try {
      const prefix = randPrefix ? parseTokens(randPrefix) : [];
      const r = await api.generate({ prefix, temperature });
      setDataset({
        id: "RANDOM",
        family: "Model Sample",
        node: `T=${temperature.toFixed(2)}`,
        description: `${r.full.length}-step random sample · ${
          r.is_valid ? "VALID" : "INVALID"
        }`,
        steps: r.full,
      });
      setSteps(r.full);
    } catch (e) {
      setRandError(String(e));
    } finally {
      setRandLoading(false);
    }
  };

  return (
    <Panel
      title="Step 01 · Import Data"
      meta={
        <span className="flex items-center gap-2">
          <StatusDot color="info" /> source: {dataset.id}
        </span>
      }
    >
      <div className="grid grid-cols-4 border border-border mb-4">
        {(["demo", "paste", "upload", "random"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2 py-2 font-mono text-tiny uppercase tracking-widest border-r border-border last:border-r-0 ${
              mode === m
                ? "bg-foreground text-background"
                : "bg-card hover:bg-surface"
            }`}
          >
            {m === "demo"
              ? "Demo"
              : m === "paste"
                ? "Paste"
                : m === "upload"
                  ? "CSV"
                  : "Random"}
          </button>
        ))}
      </div>

      {mode === "demo" && (
        <div className="grid grid-cols-2 gap-2">
          {Object.values(DATASETS).map((d) => {
            const active = d.id === dataset.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setDataset(d);
                  setSteps(d.steps);
                }}
                className={`text-left border p-3 transition-colors ${
                  active
                    ? "border-[var(--info)] bg-accent"
                    : "border-border bg-card hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold">{d.id}</span>
                  <span className="text-tiny font-mono text-muted-foreground tabular">
                    {d.steps.length} steps
                  </span>
                </div>
                <div className="mt-1 text-tiny font-mono text-muted-foreground">
                  {d.family}
                </div>
                <div className="text-tiny font-mono text-muted-foreground">
                  {d.node}
                </div>
                {d.id === "OOD" && (
                  <div className="mt-2 text-tiny font-mono text-[var(--warning)]">
                    ⚠ demo only — most tokens not in trained vocab
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {mode === "paste" && (
        <div className="space-y-2">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={6}
            placeholder={"RECEIVE WAFER\nRCA CLEAN\nGROW THERMAL OXIDE\n…"}
            className="w-full bg-background border border-border p-2 font-mono text-xs"
          />
          <button
            onClick={loadPaste}
            className="w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2 hover:bg-[var(--info)]"
          >
            ▶ Load Sequence
          </button>
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-border-strong bg-card hover:bg-surface py-8 font-mono text-xs uppercase tracking-widest"
          >
            ⬆ Drop CSV / TXT · one step per line
          </button>
          <div className="text-tiny font-mono text-muted-foreground">
            Accepts comma, newline, semicolon, or `|` separators.
          </div>
        </div>
      )}

      {mode === "random" && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="font-mono text-xs tabular">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={1.4}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full mt-1"
            />
            <div className="flex justify-between text-tiny font-mono text-muted-foreground mt-0.5">
              <span>0.40 · sharp</span>
              <span>1.40 · creative</span>
            </div>
          </div>
          <div>
            <Label>Starting prefix (optional)</Label>
            <textarea
              value={randPrefix}
              onChange={(e) => setRandPrefix(e.target.value)}
              rows={3}
              placeholder={"RECEIVE WAFER\nRCA CLEAN"}
              className="mt-1 w-full bg-background border border-border p-2 font-mono text-xs"
            />
          </div>
          <button
            onClick={sampleRandom}
            disabled={randLoading}
            className="w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2 hover:bg-[var(--info)] disabled:opacity-50"
          >
            {randLoading ? "● Sampling…" : "▶ Sample New Recipe"}
          </button>
          {randError && (
            <div className="text-tiny font-mono text-destructive break-words">
              {randError}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border">
        <Label>Active Recipe</Label>
        <div className="mt-1 font-mono text-xs">{dataset.family}</div>
        <div className="text-tiny font-mono text-muted-foreground">
          {dataset.description}
        </div>
      </div>
    </Panel>
  );
}

/* ============================================================ */
/* Step 2 — Sequence Explorer                                   */
/* ============================================================ */

function SequenceExplorer({
  steps,
  selected,
  setSelected,
}: {
  steps: string[];
  selected: number;
  setSelected: (i: number) => void;
}) {
  return (
    <Panel
      title="Step 02 · Sequence Explorer"
      meta={
        <span className="flex items-center gap-2">
          <StatusDot color="success" />
          {steps.length} steps · cursor @{" "}
          {String(selected + 1).padStart(2, "0")}
        </span>
      }
    >
      <div className="max-h-[520px] overflow-auto pr-1">
        <div className="relative pl-6">
          <div className="absolute left-[10px] top-1 bottom-1 w-px bg-border-strong" />
          {steps.map((s, i) => {
            const active = i === selected;
            return (
              <button
                key={`${s}-${i}`}
                onClick={() => setSelected(i)}
                className="block w-full text-left relative py-2"
              >
                <div
                  className={`absolute -left-[1px] top-1/2 -translate-y-1/2 h-3 w-3 border ${
                    active
                      ? "bg-[var(--info)] border-[var(--info)]"
                      : "bg-card border-border-strong"
                  }`}
                />
                <div
                  className={`grid grid-cols-[40px_1fr_120px] gap-2 items-center pl-3 py-1.5 border ${
                    active
                      ? "border-[var(--info)] bg-accent"
                      : "border-transparent hover:bg-surface"
                  }`}
                >
                  <span className="font-mono text-tiny text-muted-foreground tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`font-mono text-xs ${active ? "text-foreground" : ""}`}
                  >
                    {s}
                  </span>
                  <span className="text-right text-tiny font-mono uppercase tracking-widest text-muted-foreground">
                    {stageOf(s)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

/* ============================================================ */
/* Step 3 — Task Tabs                                           */
/* ============================================================ */

type TabId =
  | "predict"
  | "complete"
  | "validate"
  | "anomaly"
  | "ood"
  | "batch";

const TABS: { id: TabId; code: string; label: string }[] = [
  { id: "predict", code: "T1", label: "Predict Next Step" },
  { id: "complete", code: "T2", label: "Complete Sequence" },
  { id: "validate", code: "T3", label: "Validate Process" },
  { id: "anomaly", code: "T4", label: "Detect Anomalies" },
  { id: "ood", code: "T5", label: "OOD Analysis" },
  { id: "batch", code: "T6", label: "Batch Eval (CSV)" },
];

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-y border-border-strong">
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative text-left px-4 py-3 border-r border-border last:border-r-0 ${
              active ? "bg-accent" : "bg-card hover:bg-surface"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-tiny font-mono text-muted-foreground">
                {t.code}
              </span>
              <span
                className={`text-tiny font-mono uppercase tracking-widest ${
                  active ? "text-[var(--info)]" : "text-foreground"
                }`}
              >
                {t.label}
              </span>
            </div>
            {active && (
              <motion.div
                layoutId="processlab-tab-underline"
                className="absolute left-0 right-0 bottom-0 h-[2px] bg-[var(--info)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================ */
/* TAB 1 · Predict Next Step                                    */
/* ============================================================ */

function PredictTab({
  dataset,
  steps,
  cursor,
}: {
  dataset: Dataset;
  steps: string[];
  cursor: number;
}) {
  const prefix = steps.slice(0, cursor + 1);
  const [results, setResults] = useState<Prediction[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRunning(true);
    setResults([]);
    setError(null);
    api
      .predictNextStep(prefix, 5)
      .then((r) => {
        if (cancelled) return;
        setResults(r.predictions);
        setLatency(r.latency_ms);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setRunning(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, steps.join("|")]);

  const trueNext = dataset.steps[cursor + 1] ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <Panel title="Current Context">
          <Label>Cursor</Label>
          <div className="mt-1 font-mono text-xs">
            step {String(cursor + 1).padStart(2, "0")} / {steps.length}
          </div>
          <div className="mt-3">
            <Label>Last 4 Tokens</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {prefix.slice(-4).map((t, i) => (
                <span
                  key={i}
                  className="font-mono text-xs px-2 py-1 bg-card border border-border-strong"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <Label>Family</Label>
              <div className="mt-0.5">{dataset.family}</div>
            </div>
            <div>
              <Label>Node</Label>
              <div className="mt-0.5">{dataset.node}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-3">
        <Panel
          title="Top-5 Predicted Steps"
          meta={
            error
              ? "ERROR"
              : running
                ? "computing"
                : latency != null
                  ? `READY · ${latency.toFixed(0)} ms`
                  : "READY"
          }
        >
          <div className="space-y-2 min-h-[260px]">
            {error && (
              <div className="text-tiny font-mono text-destructive break-words">
                backend error · {error}
              </div>
            )}
            {!error && results.length === 0 && (
              <div className="text-tiny font-mono text-muted-foreground pulse-dot">
                sampling distribution…
              </div>
            )}
            {results.map((r, i) => {
              const isTrue = trueNext && r.token === trueNext;
              return (
                <motion.div
                  key={`${r.token}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-12 items-center gap-3"
                >
                  <div className="col-span-1 font-mono text-tiny text-muted-foreground">
                    #{i + 1}
                  </div>
                  <div
                    className={`col-span-4 font-mono text-xs ${
                      isTrue ? "text-[var(--success)] font-semibold" : ""
                    }`}
                  >
                    {r.token}
                    {isTrue && (
                      <span className="ml-1 text-tiny text-[var(--success)]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="col-span-5 h-6 bg-background border border-border relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.prob * 100}%` }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.06,
                        ease: "easeOut",
                      }}
                      className={`h-full ${
                        i === 0 ? "bg-[var(--info)]" : "bg-[var(--info)]/40"
                      }`}
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono text-xs tabular">
                    {(r.prob * 100).toFixed(1)}%
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* TAB 2 · Complete Sequence                                    */
/* ============================================================ */

function CompleteTab({
  dataset,
  steps,
  cursor,
}: {
  dataset: Dataset;
  steps: string[];
  cursor: number;
}) {
  const prefix = steps.slice(0, cursor + 1);
  const [out, setOut] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  const stop = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    cancelled.current = true;
    setRunning(false);
  };
  useEffect(() => () => stop(), []);

  const reveal = (tokens: string[]) => {
    const buf: string[] = [];
    let i = 0;
    const step = () => {
      if (cancelled.current || i >= tokens.length) {
        setRunning(false);
        return;
      }
      buf.push(tokens[i]);
      setOut([...buf]);
      i += 1;
      revealTimer.current = setTimeout(step, 180);
    };
    step();
  };

  const run = async () => {
    stop();
    cancelled.current = false;
    setOut([]);
    setError(null);
    setRunning(true);
    try {
      const r = await api.complete(prefix, { greedy: true });
      setLatency(r.latency_ms);
      reveal(r.generated);
    } catch (e) {
      setError(String(e));
      setRunning(false);
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, dataset.id, steps.join("|")]);

  const all = [...prefix, ...out];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2">
        <Panel title="Prefix · Locked">
          <div className="space-y-1 max-h-[420px] overflow-auto">
            {prefix.map((t, i) => (
              <div
                key={i}
                className="grid grid-cols-[32px_1fr] gap-2 items-center font-mono text-xs"
              >
                <span className="text-muted-foreground tabular">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={run}
              disabled={running}
              className="flex-1 bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2 hover:bg-[var(--info)] disabled:opacity-50"
            >
              {running ? "● Streaming…" : "▶ Generate"}
            </button>
            <button
              onClick={stop}
              disabled={!running}
              className="px-3 bg-card border border-border font-mono text-xs uppercase disabled:opacity-50"
            >
              ■
            </button>
          </div>
          {latency != null && !running && !error && (
            <div className="mt-2 text-tiny font-mono text-muted-foreground">
              backend · {latency.toFixed(0)} ms · {out.length} tokens
            </div>
          )}
          {error && (
            <div className="mt-2 text-tiny font-mono text-destructive break-words">
              {error}
            </div>
          )}
        </Panel>
      </div>

      <div className="lg:col-span-3">
        <Panel
          title="Predicted Pipeline"
          meta={running ? "streaming" : `${out.length} generated`}
        >
          <div className="space-y-1 max-h-[460px] overflow-auto pr-1">
            {all.map((tok, i) => {
              const isGen = i >= prefix.length;
              return (
                <motion.div
                  key={`${tok}-${i}`}
                  initial={isGen ? { opacity: 0, x: -12 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-12 items-center gap-2"
                >
                  <div className="col-span-1 text-right font-mono text-tiny text-muted-foreground tabular">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div
                      className={`h-3 w-3 ${
                        isGen
                          ? "bg-[var(--info)] border border-[var(--info)]"
                          : "bg-card border border-border-strong"
                      }`}
                    />
                  </div>
                  <div
                    className={`col-span-7 font-mono text-xs ${
                      isGen ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tok}
                  </div>
                  <div className="col-span-3 text-tiny font-mono uppercase tracking-widest">
                    {isGen ? (
                      <span className="text-[var(--info)]">predicted</span>
                    ) : (
                      <span className="text-muted-foreground">prefix</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {running && (
              <div className="font-mono text-tiny text-[var(--info)] pulse-dot pl-10 pt-1">
                streaming next token…
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* TAB 3 · Validate Process                                     */
/* ============================================================ */

function ValidateTab({ steps }: { steps: string[] }) {
  const [allRules, setAllRules] = useState<
    { id: string; description: string }[]
  >([]);
  const [result, setResult] = useState<{
    is_valid: number;
    violations: Violation[];
    n_steps: number;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .rules()
      .then((r) => setAllRules(r.rules))
      .catch(() => setAllRules([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRunning(true);
    setResult(null);
    setError(null);
    api
      .validate(steps)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setRunning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [steps]);

  const failedIds = new Set(result?.violations.map((v) => v.rule) ?? []);
  const offenders = new Set(
    result?.violations.map((v) => v.step_index).filter((x) => x != null) ?? [],
  );
  const verdict = running
    ? "pending"
    : !result
      ? "pending"
      : result.is_valid
        ? "VALID"
        : "INVALID";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <motion.div
          key={verdict}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border p-5 ${
            verdict === "VALID"
              ? "border-[var(--success)] bg-[var(--success)]/5"
              : verdict === "INVALID"
                ? "border-destructive bg-destructive/5"
                : "border-border-strong"
          }`}
        >
          <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            QC Verdict
          </div>
          <div
            className={`mt-1 font-serif text-5xl ${
              verdict === "VALID"
                ? "text-[var(--success)]"
                : verdict === "INVALID"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {verdict}
          </div>
          <div className="mt-2 font-mono text-tiny text-muted-foreground">
            {result
              ? `${allRules.length - failedIds.size}/${allRules.length || "?"} rules satisfied · ${result.n_steps} steps`
              : "awaiting backend…"}
          </div>
        </motion.div>

        <Panel title="Rule Trace">
          <div className="space-y-2">
            {allRules.length === 0 && !running && (
              <div className="font-mono text-tiny text-muted-foreground">
                no rules loaded
              </div>
            )}
            {allRules.map((r) => {
              const failed = failedIds.has(r.id);
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[60px_1fr_60px] gap-2 items-center"
                >
                  <span className="font-mono text-tiny text-muted-foreground">
                    {r.id}
                  </span>
                  <span className="text-xs">{r.description}</span>
                  <span className="text-right font-mono text-tiny uppercase">
                    {running || !result ? (
                      <span className="text-muted-foreground pulse-dot">…</span>
                    ) : failed ? (
                      <span className="text-destructive">✗ fail</span>
                    ) : (
                      <span className="text-[var(--success)]">✓ pass</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Panel title="Highlighted Sequence">
          {error && (
            <div className="mb-2 text-tiny font-mono text-destructive break-words">
              backend error · {error}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {steps.map((tok, i) => {
              const bad = offenders.has(i);
              return (
                <span
                  key={i}
                  className={`font-mono text-xs px-2 py-1 border ${
                    bad
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="text-muted-foreground mr-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {tok}
                </span>
              );
            })}
          </div>
        </Panel>

        {result && result.violations.length > 0 && (
          <Panel title="Violations">
            <div className="space-y-2">
              {result.violations.map((v, i) => (
                <div
                  key={`${v.rule}-${i}`}
                  className="border border-destructive bg-destructive/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-destructive">
                      {v.rule} · {v.description}
                    </span>
                    <span className="font-mono text-tiny text-destructive">
                      step {String(v.step_index + 1).padStart(2, "0")} ·{" "}
                      {v.step_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* TAB 4 · Anomaly Detection                                    */
/* ============================================================ */

function AnomalyTab({ steps }: { steps: string[] }) {
  const [result, setResult] = useState<AnomalyResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRunning(true);
    setResult(null);
    setError(null);
    api
      .anomaly(steps, true)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setRunning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [steps]);

  const offenders = new Set(
    result?.violations.map((v) => v.step_index).filter((x) => x != null) ?? [],
  );

  const verdict = result ? (result.is_valid ? "NORMAL" : "ANOMALY") : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <motion.div
          key={verdict ?? "loading"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border p-5 ${
            verdict === "NORMAL"
              ? "border-[var(--success)] bg-[var(--success)]/5"
              : verdict === "ANOMALY"
                ? "border-destructive bg-destructive/5"
                : "border-border-strong"
          }`}
        >
          <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            Anomaly Verdict
          </div>
          <div
            className={`mt-1 font-serif text-5xl ${
              verdict === "NORMAL"
                ? "text-[var(--success)]"
                : verdict === "ANOMALY"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {verdict ?? "…"}
          </div>
          <div className="mt-2 font-mono text-tiny text-muted-foreground">
            {result
              ? `confidence ${(result.score * 100).toFixed(0)}%`
              : running
                ? "running detector…"
                : ""}
          </div>
        </motion.div>

        <Panel title="Diagnostics">
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-border p-2">
              <Label>NLL</Label>
              <div className="font-mono text-xl tabular mt-1">
                {result ? result.nll.toFixed(3) : "—"}
              </div>
            </div>
            <div className="border border-border p-2">
              <Label>Threshold</Label>
              <div className="font-mono text-xl tabular mt-1">
                {result?.threshold != null
                  ? result.threshold.toFixed(3)
                  : "—"}
              </div>
            </div>
            <div className="border border-border p-2">
              <Label>LM-only</Label>
              <div className="font-mono text-xs uppercase mt-2">
                {result
                  ? result.lm_only.is_valid
                    ? "normal"
                    : "anomaly"
                  : "—"}
              </div>
            </div>
          </div>
          {result?.predicted_rule && (
            <div className="mt-3 text-tiny font-mono text-muted-foreground">
              predicted rule · {result.predicted_rule}
            </div>
          )}
        </Panel>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Panel
          title="Sequence · Violations Highlighted"
          meta={running ? "scanning" : "complete"}
        >
          {error && (
            <div className="mb-2 text-tiny font-mono text-destructive break-words">
              backend error · {error}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {steps.map((tok, i) => {
              const bad = offenders.has(i);
              return (
                <span
                  key={i}
                  className={`font-mono text-xs px-2 py-1 border ${
                    bad
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="text-muted-foreground mr-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {tok}
                </span>
              );
            })}
          </div>
        </Panel>

        {result && result.violations.length > 0 && (
          <Panel title="Violations">
            <div className="space-y-2">
              {result.violations.map((v, i) => (
                <div
                  key={`${v.rule}-${i}`}
                  className="border border-destructive bg-destructive/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-destructive">
                      {v.rule} · {v.description}
                    </span>
                    <span className="font-mono text-tiny text-destructive">
                      step {String(v.step_index + 1).padStart(2, "0")} ·{" "}
                      {v.step_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Metrics table — shared by OOD and Batch tabs                 */
/* ============================================================ */

type Task = "nextstep" | "completion" | "anomaly";

const METRIC_COLUMNS: Record<Task, { key: string; label: string }[]> = {
  nextstep: [
    { key: "top1", label: "Top-1" },
    { key: "top3", label: "Top-3" },
    { key: "top5", label: "Top-5" },
    { key: "mrr", label: "MRR" },
    { key: "n", label: "N" },
  ],
  completion: [
    { key: "exact_match", label: "Exact" },
    { key: "norm_edit_dist", label: "NED" },
    { key: "token_acc", label: "Token Acc" },
    { key: "n", label: "N" },
  ],
  anomaly: [
    { key: "acc", label: "Acc" },
    { key: "precision", label: "Prec" },
    { key: "recall", label: "Recall" },
    { key: "f1", label: "F1" },
    { key: "roc_auc", label: "ROC-AUC" },
    { key: "rule_attr", label: "Rule Attr" },
    { key: "n", label: "N" },
  ],
};

function MetricsTable({
  task,
  metrics,
}: {
  task: Task;
  metrics: Record<string, Record<string, number>> | null;
}) {
  const cols = METRIC_COLUMNS[task];
  if (!metrics) {
    return (
      <div className="font-mono text-tiny text-muted-foreground">
        no metrics available
      </div>
    );
  }
  const familyKeys = Object.keys(metrics);
  const ordered = [
    ...familyKeys.filter((k) => k.toUpperCase() === "ALL"),
    ...familyKeys.filter((k) => k.toUpperCase() !== "ALL"),
  ];

  return (
    <div className="border border-border overflow-auto">
      <div
        className="grid gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase text-muted-foreground"
        style={{
          gridTemplateColumns: `1fr ${cols.map(() => "80px").join(" ")}`,
        }}
      >
        <span>Family</span>
        {cols.map((c) => (
          <span key={c.key} className="text-right">
            {c.label}
          </span>
        ))}
      </div>
      {ordered.map((fam, i) => {
        const row = metrics[fam] ?? {};
        const isAll = fam.toUpperCase() === "ALL";
        return (
          <div
            key={fam}
            className={`grid gap-2 px-3 py-2 items-center ${
              i !== ordered.length - 1 ? "border-b border-border" : ""
            } ${isAll ? "bg-accent/50" : ""}`}
            style={{
              gridTemplateColumns: `1fr ${cols.map(() => "80px").join(" ")}`,
            }}
          >
            <span
              className={`font-mono text-xs ${isAll ? "text-[var(--info)] font-semibold" : ""}`}
            >
              {fam}
            </span>
            {cols.map((c) => {
              const v = row[c.key];
              const display =
                v == null
                  ? "—"
                  : c.key === "n"
                    ? Math.round(v).toString()
                    : v.toFixed(3);
              return (
                <span
                  key={c.key}
                  className="font-mono text-xs tabular text-right"
                >
                  {display}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================ */
/* TAB 5 · OOD Analysis                                         */
/* ============================================================ */

function OODTab() {
  const [task, setTask] = useState<Task>("nextstep");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OODEval | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    if (!f) return;
    setLoading(true);
    setError(null);
    setResult(null);
    api
      .evalOOD(f, task)
      .then(setResult)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Panel title="Held-Out Evaluation">
          <div className="text-tiny font-mono text-muted-foreground leading-relaxed">
            Upload an OOD evaluation CSV. The backend scores per-family and
            returns an `ALL` row plus per-family breakdown. Use the same CSV
            schema as Batch Eval for the chosen task.
          </div>
          <div className="mt-3 space-y-2">
            <Label>Task</Label>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value as Task)}
              className="w-full bg-background border border-border font-mono text-xs px-2 py-2"
            >
              <option value="nextstep">Next-step</option>
              <option value="completion">Completion</option>
              <option value="anomaly">Anomaly</option>
            </select>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full border border-dashed border-border-strong bg-card hover:bg-surface py-6 font-mono text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "● scoring…" : "⬆ Upload OOD CSV"}
            </button>
            {error && (
              <div className="text-tiny font-mono text-destructive break-words">
                {error}
              </div>
            )}
          </div>
        </Panel>

        {result && (
          <Panel title="Family Counts">
            <div className="space-y-1">
              {Object.entries(result.family_counts).map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-[1fr_60px] font-mono text-xs"
                >
                  <span>{k}</span>
                  <span className="text-right tabular text-muted-foreground">
                    {v}
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border grid grid-cols-[1fr_60px] font-mono text-xs">
                <span className="text-[var(--info)]">TOTAL</span>
                <span className="text-right tabular">{result.n}</span>
              </div>
            </div>
          </Panel>
        )}
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Panel title="Per-Family Metrics" meta={result ? `n=${result.n}` : ""}>
          {!result && !loading && (
            <div className="font-mono text-tiny text-muted-foreground">
              upload a CSV to compute metrics.
            </div>
          )}
          {loading && (
            <div className="font-mono text-tiny text-[var(--info)] pulse-dot">
              evaluating…
            </div>
          )}
          {result && (
            <MetricsTable
              task={task}
              metrics={
                result.metrics as unknown as Record<
                  string,
                  Record<string, number>
                > | null
              }
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* TAB 6 · Batch Eval (CSV)                                     */
/* ============================================================ */

type BatchResult =
  | { task: "nextstep"; data: NextStepEval }
  | { task: "completion"; data: CompletionEval }
  | { task: "anomaly"; data: AnomalyEval };

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function downloadCsv(filename: string, rows: string[][]) {
  const text = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function nedFromTokens(a: string[], b: string[]): number {
  // Levenshtein on tokens, normalized by max(len). Returns 0..1.
  const m = a.length;
  const n = b.length;
  if (!m && !n) return 0;
  if (!m || !n) return 1;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n] / Math.max(m, n);
}

function BatchEvalTab() {
  const [task, setTask] = useState<Task>("nextstep");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [page, setPage] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 50;

  const onFile = async (f: File | null) => {
    if (!f) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPage(0);
    setElapsed(null);
    const t0 = Date.now();
    try {
      let res: BatchResult;
      if (task === "nextstep") {
        const data = await api.evalNextStep(f);
        res = { task, data };
      } else if (task === "completion") {
        const data = await api.evalCompletion(f);
        res = { task, data };
      } else {
        const data = await api.evalAnomaly(f);
        res = { task, data };
      }
      setResult(res);
      setElapsed(Date.now() - t0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const downloadPredictions = () => {
    if (!result) return;
    if (result.task === "nextstep") {
      const header = [
        "EXAMPLE_ID",
        "FAMILY",
        "PRED_1",
        "PROB_1",
        "PRED_2",
        "PROB_2",
        "PRED_3",
        "PROB_3",
        "PRED_4",
        "PROB_4",
        "PRED_5",
        "PROB_5",
      ];
      const rows = result.data.rows.map((r) => {
        const cells = [r.example_id, r.family];
        for (let i = 0; i < 5; i++) {
          const p = r.predictions[i];
          cells.push(p?.token ?? "", p ? p.prob.toFixed(6) : "");
        }
        return cells;
      });
      downloadCsv("predictions_nextstep.csv", [header, ...rows]);
    } else if (result.task === "completion") {
      const header = ["EXAMPLE_ID", "FAMILY", "PREDICTED"];
      const rows = result.data.rows.map((r) => [
        r.example_id,
        r.family,
        r.predicted.join("|"),
      ]);
      downloadCsv("predictions_completion.csv", [header, ...rows]);
    } else {
      const header = [
        "EXAMPLE_ID",
        "FAMILY",
        "IS_VALID",
        "SCORE",
        "PREDICTED_RULE",
        "NLL",
      ];
      const rows = result.data.rows.map((r) => [
        r.example_id,
        r.family,
        String(r.is_valid),
        r.score.toFixed(6),
        r.predicted_rule ?? "",
        r.nll.toFixed(6),
      ]);
      downloadCsv("predictions_anomaly.csv", [header, ...rows]);
    }
  };

  const rows = result?.data.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const perRowMs = elapsed != null && rows.length ? elapsed / rows.length : null;

  const csvHelp = useMemo(
    () => ({
      nextstep:
        "EXAMPLE_ID, FAMILY, PARTIAL_SEQUENCE  (+ optional TRUE_NEXT_STEP). SEQUENCE cells use `|` separators.",
      completion:
        "EXAMPLE_ID, FAMILY, PARTIAL_SEQUENCE  (+ optional TRUE_SUFFIX, COMPLETION_FRACTION). SEQUENCE cells use `|` separators.",
      anomaly:
        "EXAMPLE_ID, FAMILY, SEQUENCE  (+ optional IS_VALID, RULE_VIOLATED). SEQUENCE cells use `|` separators.",
    }),
    [],
  );

  return (
    <div className="space-y-4">
      <Panel
        title="Batch Eval · Upload CSV"
        meta={
          loading
            ? "running"
            : result
              ? `${result.data.n} rows · ${elapsed?.toFixed(0)} ms`
              : "idle"
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
          <div className="space-y-3">
            <Label>Task</Label>
            <div className="grid grid-cols-3 border border-border">
              {(["nextstep", "completion", "anomaly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTask(t)}
                  className={`px-2 py-2 font-mono text-tiny uppercase tracking-widest border-r border-border last:border-r-0 ${
                    task === t
                      ? "bg-foreground text-background"
                      : "bg-card hover:bg-surface"
                  }`}
                >
                  {t === "nextstep"
                    ? "Next-step"
                    : t === "completion"
                      ? "Completion"
                      : "Anomaly"}
                </button>
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full border border-dashed border-border-strong bg-card hover:bg-surface py-6 font-mono text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "● evaluating…" : "⬆ Choose CSV"}
            </button>
            {result && (
              <button
                onClick={downloadPredictions}
                className="w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2 hover:bg-[var(--info)]"
              >
                ⬇ Download predictions.csv
              </button>
            )}
            {loading && (
              <div className="h-1 bg-border relative overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-1/3 bg-[var(--info)]"
                />
              </div>
            )}
            {error && (
              <div className="text-tiny font-mono text-destructive break-words">
                {error}
              </div>
            )}
          </div>
          <div className="border border-border bg-card p-3">
            <Label>Expected CSV columns · {task}</Label>
            <div className="mt-1 font-mono text-tiny text-muted-foreground leading-relaxed">
              {csvHelp[task]}
            </div>
          </div>
        </div>
      </Panel>

      {result && (
        <>
          <Panel title="Per-Family Metrics" meta={`n=${result.data.n}`}>
            <MetricsTable
              task={result.task}
              metrics={
                result.data.metrics as unknown as Record<
                  string,
                  Record<string, number>
                > | null
              }
            />
          </Panel>

          <Panel title="Latency">
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-border p-2">
                <Label>Total</Label>
                <div className="font-mono text-2xl tabular mt-1">
                  {elapsed?.toFixed(0)} ms
                </div>
              </div>
              <div className="border border-border p-2">
                <Label>Per-row avg</Label>
                <div className="font-mono text-2xl tabular mt-1">
                  {perRowMs != null ? perRowMs.toFixed(1) + " ms" : "—"}
                </div>
              </div>
              <div className="border border-border p-2">
                <Label>Rows</Label>
                <div className="font-mono text-2xl tabular mt-1">
                  {rows.length}
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Per-Row Results"
            meta={`page ${page + 1} / ${totalPages}`}
          >
            <div className="border border-border overflow-auto max-h-[460px]">
              {result.task === "nextstep" && (
                <PerRowNextStep rows={pageRows as NextStepEval["rows"]} />
              )}
              {result.task === "completion" && (
                <PerRowCompletion rows={pageRows as CompletionEval["rows"]} />
              )}
              {result.task === "anomaly" && (
                <PerRowAnomaly rows={pageRows as AnomalyEval["rows"]} />
              )}
            </div>
            <div className="flex items-center justify-between mt-3 font-mono text-xs">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-border disabled:opacity-30"
              >
                ← prev
              </button>
              <span className="text-muted-foreground">
                rows {page * PAGE_SIZE + 1}–
                {Math.min(rows.length, (page + 1) * PAGE_SIZE)} of {rows.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-border disabled:opacity-30"
              >
                next →
              </button>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function PerRowNextStep({ rows }: { rows: NextStepEval["rows"] }) {
  return (
    <table className="w-full text-xs font-mono">
      <thead className="bg-surface text-tiny uppercase text-muted-foreground">
        <tr>
          <th className="text-left px-3 py-2">Example</th>
          <th className="text-left px-3 py-2">Family</th>
          <th className="text-left px-3 py-2">Top-5 Predictions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.example_id}-${i}`} className="border-t border-border">
            <td className="px-3 py-2 align-top">{r.example_id}</td>
            <td className="px-3 py-2 align-top text-muted-foreground">
              {r.family}
            </td>
            <td className="px-3 py-2">
              <div className="flex flex-wrap gap-1">
                {r.predictions.map((p, j) => {
                  const hit = r.true_next_step && p.token === r.true_next_step;
                  return (
                    <span
                      key={j}
                      className={`px-1.5 py-0.5 border ${
                        hit
                          ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                          : "border-border bg-card"
                      }`}
                    >
                      {p.token}{" "}
                      <span className="text-muted-foreground">
                        {(p.prob * 100).toFixed(0)}%
                      </span>
                    </span>
                  );
                })}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PerRowCompletion({ rows }: { rows: CompletionEval["rows"] }) {
  return (
    <table className="w-full text-xs font-mono">
      <thead className="bg-surface text-tiny uppercase text-muted-foreground">
        <tr>
          <th className="text-left px-3 py-2">Example</th>
          <th className="text-left px-3 py-2">Family</th>
          <th className="text-left px-3 py-2">Predicted</th>
          <th className="text-left px-3 py-2">True suffix</th>
          <th className="text-right px-3 py-2">NED</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const ned = r.true_suffix
            ? nedFromTokens(r.predicted, r.true_suffix)
            : null;
          return (
            <tr key={`${r.example_id}-${i}`} className="border-t border-border">
              <td className="px-3 py-2 align-top">{r.example_id}</td>
              <td className="px-3 py-2 align-top text-muted-foreground">
                {r.family}
              </td>
              <td className="px-3 py-2 align-top">{r.predicted.join(" › ")}</td>
              <td className="px-3 py-2 align-top text-muted-foreground">
                {r.true_suffix ? r.true_suffix.join(" › ") : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular">
                {ned != null ? ned.toFixed(3) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PerRowAnomaly({ rows }: { rows: AnomalyEval["rows"] }) {
  return (
    <table className="w-full text-xs font-mono">
      <thead className="bg-surface text-tiny uppercase text-muted-foreground">
        <tr>
          <th className="text-left px-3 py-2">Example</th>
          <th className="text-left px-3 py-2">Family</th>
          <th className="text-center px-3 py-2">Valid</th>
          <th className="text-right px-3 py-2">Score</th>
          <th className="text-left px-3 py-2">Predicted Rule</th>
          <th className="text-center px-3 py-2">True</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.example_id}-${i}`} className="border-t border-border">
            <td className="px-3 py-2">{r.example_id}</td>
            <td className="px-3 py-2 text-muted-foreground">{r.family}</td>
            <td className="px-3 py-2 text-center">
              {r.is_valid ? (
                <span className="text-[var(--success)]">✓</span>
              ) : (
                <span className="text-destructive">✗</span>
              )}
            </td>
            <td className="px-3 py-2 text-right tabular">
              {r.score.toFixed(3)}
            </td>
            <td className="px-3 py-2 text-muted-foreground">
              {r.predicted_rule || "—"}
            </td>
            <td className="px-3 py-2 text-center text-muted-foreground">
              {r.true_is_valid == null ? (
                "—"
              ) : r.true_is_valid ? (
                <span className="text-[var(--success)]">✓</span>
              ) : (
                <span className="text-destructive">✗</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ============================================================ */
/* Container                                                    */
/* ============================================================ */

function basename(p: string | null | undefined): string {
  if (!p) return "—";
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

export function ProcessLab() {
  const [dataset, setDataset] = useState<Dataset>(DATASETS.MOSFET);
  const [steps, setSteps] = useState<string[]>(DATASETS.MOSFET.steps);
  const [selected, setSelected] = useState(4);
  const [tab, setTab] = useState<TabId>("predict");
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch((e) => setHealthError(String(e)));
  }, []);

  // clamp selection when steps change
  useEffect(() => {
    if (selected >= steps.length) setSelected(Math.max(0, steps.length - 1));
  }, [steps.length, selected]);

  const healthOk = !!health?.ok;
  const healthLabel = healthError
    ? `BACKEND UNREACHABLE · ${healthError.slice(0, 60)}`
    : !health
      ? "CHECKING BACKEND…"
      : healthOk
        ? `READY · ${health.device} · vocab ${health.vocab_size}`
        : `NO CHECKPOINT — ${health.load_error ?? "unknown"}`;

  return (
    <section className="px-4 md:px-6 lg:px-8 pt-10">
      <div className="border border-border-strong bg-card">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <StatusDot color="info" />
            <span className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
              § Lab · Primary Workstation
            </span>
            <span className="text-tiny font-mono text-muted-foreground">/</span>
            <span className="text-tiny font-mono text-[var(--info)] uppercase tracking-widest">
              Process Lab
            </span>
          </div>
          <div className="flex items-center gap-4 text-tiny font-mono text-muted-foreground">
            <span className="flex items-center gap-2">
              <StatusDot
                color={
                  healthError || (health && !healthOk) ? "warning" : "success"
                }
              />
              <span
                className={
                  healthError || (health && !healthOk)
                    ? "text-[var(--warning)]"
                    : "text-[var(--success)]"
                }
              >
                {healthLabel}
              </span>
            </span>
            <span>·</span>
            <span>RECIPE {dataset.id}</span>
            <span>·</span>
            <span>{steps.length} steps</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 px-5 py-5 border-b border-border">
          <div>
            <h2 className="font-serif text-4xl leading-tight">
              The semiconductor engineer's workstation.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Import a wafer recipe, walk the manufacturing pipeline, and drive
              SiliconGPT across six inference tasks — prediction, completion,
              validation, anomaly detection, OOD analysis, and batch evaluation.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 font-mono">
            <div>
              <Label>Active Family</Label>
              <div className="text-sm mt-1">{dataset.family}</div>
            </div>
            <div>
              <Label>Cursor</Label>
              <div className="text-sm mt-1 text-[var(--info)]">
                {String(selected + 1).padStart(2, "0")} / {steps.length}
              </div>
            </div>
            <div>
              <Label>Checkpoint</Label>
              <div
                className={`text-sm mt-1 ${
                  healthOk ? "text-[var(--success)]" : "text-muted-foreground"
                }`}
              >
                {health?.ckpt_path
                  ? basename(health.ckpt_path)
                  : healthError
                    ? "offline"
                    : "loading…"}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1 + Step 2 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 p-4 border-b border-border bg-surface">
          <ImportPanel
            dataset={dataset}
            setDataset={setDataset}
            setSteps={setSteps}
          />
          <SequenceExplorer
            steps={steps}
            selected={selected}
            setSelected={setSelected}
          />
        </div>

        {/* Step 3 — task tabs */}
        <TabBar tab={tab} setTab={setTab} />
        <div className="p-5 bg-surface min-h-[560px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {tab === "predict" && (
                <PredictTab
                  dataset={dataset}
                  steps={steps}
                  cursor={selected}
                />
              )}
              {tab === "complete" && (
                <CompleteTab
                  dataset={dataset}
                  steps={steps}
                  cursor={selected}
                />
              )}
              {tab === "validate" && <ValidateTab steps={steps} />}
              {tab === "anomaly" && <AnomalyTab steps={steps} />}
              {tab === "ood" && <OODTab />}
              {tab === "batch" && <BatchEvalTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
