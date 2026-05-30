import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusDot } from "./primitives";
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
  const head = step.split(/[\s_]/)[0];
  return PROCESS_STAGE[head] ?? PROCESS_STAGE[step] ?? "Process";
}

function normalizeToken(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

function parseTokens(text: string): string[] {
  return text
    .split(/[\r\n,;|]+/)
    .map(normalizeToken)
    .filter((s) => s && !s.startsWith("#"));
}

function basename(p: string | null | undefined): string {
  if (!p) return "—";
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

/* ============================================================ */
/* Modal shell                                                  */
/* ============================================================ */

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-card border border-border-strong w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
          <span className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          <button
            onClick={onClose}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </div>
  );
}

/* ============================================================ */
/* Import Toolbar                                               */
/* ============================================================ */

function ImportToolbar({
  dataset,
  setDataset,
  setSteps,
  setCursor,
}: {
  dataset: Dataset;
  setDataset: (d: Dataset) => void;
  setSteps: (s: string[]) => void;
  setCursor: (n: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [randomOpen, setRandomOpen] = useState(false);
  const [paste, setPaste] = useState("");

  // random modal state
  const [temperature, setTemperature] = useState(0.9);
  const [randPrefix, setRandPrefix] = useState("");
  const [randLoading, setRandLoading] = useState(false);
  const [randError, setRandError] = useState<string | null>(null);

  const loadDataset = (d: Dataset) => {
    setDataset(d);
    setSteps(d.steps);
    setCursor(0);
  };

  const loadPaste = () => {
    const tokens = parseTokens(paste);
    if (!tokens.length) return;
    loadDataset({
      id: "CUSTOM",
      family: "User Recipe",
      node: "—",
      description: `${tokens.length}-step custom sequence`,
      steps: tokens,
    });
    setPasteOpen(false);
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const tokens = parseTokens(text);
      if (!tokens.length) return;
      loadDataset({
        id: "CSV",
        family: f.name,
        node: `${(f.size / 1024).toFixed(1)} KB`,
        description: `${tokens.length}-step recipe imported from CSV`,
        steps: tokens,
      });
    };
    reader.readAsText(f);
  };

  const sampleRandom = async () => {
    setRandLoading(true);
    setRandError(null);
    try {
      const prefix = randPrefix ? parseTokens(randPrefix) : [];
      const r = await api.generate({ prefix, temperature });
      loadDataset({
        id: "RANDOM",
        family: "Model Sample",
        node: `T=${temperature.toFixed(2)}`,
        description: `${r.full.length}-step sample · ${
          r.is_valid ? "VALID" : "INVALID"
        }`,
        steps: r.full,
      });
      setRandomOpen(false);
    } catch (e) {
      setRandError(String(e));
    } finally {
      setRandLoading(false);
    }
  };

  const presets = Object.values(DATASETS);

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card">
      <div className="flex items-center gap-1">
        {presets.map((d) => {
          const active = d.id === dataset.id;
          return (
            <button
              key={d.id}
              onClick={() => loadDataset(d)}
              className={`px-2.5 py-1 font-mono text-tiny uppercase tracking-widest border ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-surface"
              }`}
            >
              {d.id}
            </button>
          );
        })}
      </div>

      <span className="h-5 w-px bg-border mx-1" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPasteOpen(true)}
          className="px-2.5 py-1 font-mono text-tiny uppercase tracking-widest border border-border bg-card hover:bg-surface"
        >
          ✎ Paste
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-2.5 py-1 font-mono text-tiny uppercase tracking-widest border border-border bg-card hover:bg-surface"
        >
          ↑ Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          onClick={() => setRandomOpen(true)}
          className="px-2.5 py-1 font-mono text-tiny uppercase tracking-widest border border-border bg-card hover:bg-surface"
        >
          ⚄ Random
        </button>
      </div>

      <Modal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Paste Recipe"
      >
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={8}
          placeholder={"RECEIVE WAFER\nRCA CLEAN\nGROW THERMAL OXIDE\n…"}
          className="w-full bg-background border border-border p-2 font-mono text-xs"
        />
        <div className="mt-2 text-tiny font-mono text-muted-foreground">
          Accepts newline, comma, semicolon, or `|` separators.
        </div>
        <button
          onClick={loadPaste}
          className="mt-3 w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2 hover:bg-[var(--info)]"
        >
          ▶ Load
        </button>
      </Modal>

      <Modal
        open={randomOpen}
        onClose={() => setRandomOpen(false)}
        title="Sample Recipe"
      >
        <div className="flex items-center justify-between">
          <span className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            Temperature
          </span>
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
        <div className="mt-3">
          <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            Prefix (optional)
          </div>
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
          className="mt-3 w-full bg-foreground text-background font-mono text-xs uppercase tracking-widest py-2 hover:bg-[var(--info)] disabled:opacity-50"
        >
          {randLoading ? "● Sampling…" : "▶ Sample"}
        </button>
        {randError && (
          <div className="mt-2 text-tiny font-mono text-destructive break-words">
            {randError}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============================================================ */
/* Recipe Chip Strip                                            */
/* ============================================================ */

function RecipeStrip({
  steps,
  cursor,
  setCursor,
  dataset,
  health,
}: {
  steps: string[];
  cursor: number;
  setCursor: (n: number) => void;
  dataset: Dataset;
  health: Health | null;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [cursor]);

  return (
    <div className="bg-surface border-b border-border">
      <div ref={stripRef} className="px-4 pt-4 pb-3">
        <div className="flex flex-wrap gap-[3px]">
          {steps.map((s, i) => {
            const isCursor = i === cursor;
            const isBefore = i < cursor;
            return (
              <button
                key={`${s}-${i}`}
                ref={isCursor ? activeRef : null}
                onClick={() => setCursor(i)}
                title={`${String(i + 1).padStart(2, "0")} · ${s}`}
                aria-label={`Step ${i + 1}: ${s}`}
                className={`h-3 w-3 border transition-colors ${
                  isCursor
                    ? "bg-[var(--info)] border-[var(--info)] ring-1 ring-[var(--info)] ring-offset-1 ring-offset-surface"
                    : isBefore
                      ? "bg-foreground/40 border-foreground/40 hover:bg-foreground/70"
                      : "bg-background border-border hover:bg-foreground/20"
                }`}
              />
            );
          })}
        </div>
      </div>
      <div className="px-4 pb-2 text-tiny font-mono text-muted-foreground flex flex-wrap gap-x-2">
        <span>{dataset.family} · {dataset.id} · step {cursor + 1} of {steps.length} · {basename(health?.ckpt_path ?? "no checkpoint")}</span>
        <span className="text-foreground/70">
          ▶ {String(cursor + 1).padStart(2, "0")} {steps[cursor] ?? "—"} · {stageOf(steps[cursor] ?? "")}
        </span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Tabs                                                         */
/* ============================================================ */

type TabId = "predict" | "complete" | "validate" | "anomaly" | "batch";

const TABS: { id: TabId; label: string }[] = [
  { id: "predict", label: "Next Step" },
  { id: "complete", label: "Complete" },
  { id: "validate", label: "Validate" },
  { id: "anomaly", label: "Anomaly" },
  { id: "batch", label: "Batch Eval" },
];

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="flex border-b border-border-strong bg-card overflow-x-auto">
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 font-mono text-tiny uppercase tracking-widest whitespace-nowrap ${
              active
                ? "text-[var(--info)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
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
/* TAB · Next Step                                              */
/* ============================================================ */

function PredictTab({
  steps,
  cursor,
}: {
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

  const trueNext = steps[cursor + 1] ?? null;
  const top1 = results[0] ?? null;
  const trueInTop5 = !!trueNext && results.some((r) => r.token === trueNext);

  return (
    <div className="space-y-4">
      {/* Context header */}
      <div className="space-y-1">
        <div className="text-tiny font-mono uppercase tracking-wider text-muted-foreground">
          Next-step prediction
        </div>
        <div className="text-xs font-mono text-muted-foreground leading-relaxed">
          Given step {cursor + 1} —{" "}
          <span className="text-foreground">
            "{steps[cursor] ?? "—"}"
          </span>
          , the model ranks the 5 most likely next steps.
        </div>
      </div>

      {/* Current → Next chips */}
      <div className="flex items-center gap-2 flex-wrap text-tiny font-mono">
        <span className="px-2 py-1 border border-border-strong bg-surface">
          <span className="text-muted-foreground">step {cursor + 1} · </span>
          <span className="text-foreground">{steps[cursor] ?? "—"}</span>
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="px-2 py-1 border border-dashed border-[var(--info)] text-[var(--info)]">
          step {cursor + 2} · ?
        </span>
      </div>

      {/* Ranked candidates */}
      <div className="space-y-1.5">
        {error && (
          <div className="text-xs font-mono text-destructive break-words">
            Prediction failed · {error}
          </div>
        )}
        {!error && running && results.length === 0 && (
          <>
            <div className="text-tiny font-mono text-muted-foreground">
              awaiting model…
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 bg-surface animate-pulse"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </>
        )}
        {results.map((r, i) => {
          const isTrue = !!trueNext && r.token === trueNext;
          const isTop = i === 0;
          return (
            <motion.div
              key={`${r.token}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative flex items-center gap-3 px-2 py-1.5 border-l-2 ${
                isTop
                  ? "bg-surface border-[var(--info)]"
                  : "border-transparent"
              }`}
            >
              <span
                className={`w-7 text-center font-mono text-tiny tabular px-1 py-0.5 ${
                  isTop
                    ? "bg-[var(--info)] text-background"
                    : "text-muted-foreground"
                }`}
              >
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span
                  className={`font-mono truncate shrink-0 max-w-[45%] ${
                    isTop ? "text-sm text-foreground" : "text-xs text-muted-foreground"
                  }`}
                >
                  {r.token}
                </span>
                {isTrue && (
                  <span className="text-[var(--success)] text-tiny font-mono whitespace-nowrap shrink-0">
                    ✓ actual next step
                  </span>
                )}
                <div className="flex-1 h-1.5 bg-surface overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.prob * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                    className={`h-full ${
                      isTop ? "bg-[var(--info)]" : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
              </div>
              <span
                className={`w-14 text-right font-mono tabular ${
                  isTop ? "text-sm text-foreground" : "text-xs text-muted-foreground"
                }`}
              >
                {(r.prob * 100).toFixed(1)}%
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Footer meta */}
      {results.length > 0 && !running && (
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-border-strong">
          <div className="text-tiny font-mono text-muted-foreground">
            ✓ = ground-truth next step from the recipe
            {trueNext && !trueInTop5 && (
              <span className="ml-2 text-[var(--warning,var(--destructive))]">
                · actual next step not in top 5
              </span>
            )}
          </div>
          <div className="text-tiny font-mono text-muted-foreground tabular">
            top-1 {top1 ? (top1.prob * 100).toFixed(1) : "—"}%
            {latency != null && ` · inference ${latency.toFixed(0)} ms`}
          </div>
        </div>
      )}
    </div>
  );
}


/* ============================================================ */
/* TAB · Complete                                               */
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

  return (
    <div className="space-y-4">
      <div className="text-tiny font-mono text-muted-foreground">
        Completing {prefix.length}-step prefix → generating up to 220 steps
      </div>

      <div className="flex flex-wrap gap-[3px]">
        {prefix.map((tok, i) => (
          <span
            key={`p-${i}`}
            title={`${String(i + 1).padStart(2, "0")} · ${tok}`}
            className="h-3 w-3 border border-foreground/30 bg-foreground/40"
          />
        ))}
        <span className="w-px mx-0.5 bg-border-strong" />
        {out.map((tok, i) => (
          <motion.span
            key={`g-${i}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            title={`${String(prefix.length + i + 1).padStart(2, "0")} · ${tok}`}
            className="h-3 w-3 border border-[var(--info)] bg-[var(--info)]"
          />
        ))}
        {running && (
          <span className="h-3 w-3 border border-border bg-surface animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={run}
          disabled={running}
          className="bg-foreground text-background font-mono text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-[var(--info)] disabled:opacity-50"
        >
          ▶ Run Again
        </button>
        {running && (
          <button
            onClick={stop}
            className="border border-border font-mono text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-surface"
          >
            ■ Stop
          </button>
        )}
        {latency != null && !running && !error && (
          <span className="text-tiny font-mono text-muted-foreground">
            {latency.toFixed(0)}ms · {out.length} tokens
          </span>
        )}
        {error && (
          <span className="text-tiny font-mono text-destructive break-words">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* TAB · Validate                                               */
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
  const valid = result?.is_valid === 1;

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-tiny font-mono text-destructive break-words">
          backend error · {error}
        </div>
      )}

      {result && (
        <motion.div
          key={valid ? "v" : "i"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between border p-4 ${
            valid
              ? "border-[var(--success)] bg-[var(--success)]/5"
              : "border-destructive bg-destructive/5"
          }`}
        >
          <div
            className={`font-serif text-4xl ${
              valid ? "text-[var(--success)]" : "text-destructive"
            }`}
          >
            {valid ? "✓ VALID" : "✗ INVALID"}
          </div>
          <div className="font-mono text-xs text-right">
            {valid
              ? `${allRules.length - failedIds.size}/${allRules.length || "?"} rules satisfied`
              : `${result.violations.length} violation${result.violations.length === 1 ? "" : "s"}`}
          </div>
        </motion.div>
      )}

      {running && !result && (
        <div className="h-20 bg-surface animate-pulse" />
      )}

      {result && result.violations.length > 0 && (
        <div className="space-y-2">
          {result.violations.map((v, i) => (
            <div
              key={`${v.rule}-${i}`}
              className="border-l-2 border-destructive pl-3 py-2"
            >
              <div className="font-mono text-xs font-semibold text-destructive">
                {v.rule}
              </div>
              <div className="text-xs text-foreground mt-0.5">
                {v.description}
              </div>
              <div className="text-tiny font-mono text-muted-foreground mt-0.5">
                at step {v.step_index + 1} — {v.step_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {allRules.length > 0 && (
        <div>
          <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Rules
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
            {allRules.map((r) => {
              const failed = failedIds.has(r.id);
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-2 ${
                    failed ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <span className="font-mono text-tiny w-3">
                    {failed ? "✗" : "✓"}
                  </span>
                  <span className="font-mono text-tiny">{r.id}</span>
                  <span className="text-tiny truncate opacity-70">
                    {r.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* TAB · Anomaly                                                */
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

  const normal = result?.is_valid === 1;

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-tiny font-mono text-destructive break-words">
          backend error · {error}
        </div>
      )}

      {running && !result && (
        <div className="h-20 bg-surface animate-pulse" />
      )}

      {result && (
        <>
          <motion.div
            key={normal ? "n" : "a"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between border p-4 ${
              normal
                ? "border-[var(--success)] bg-[var(--success)]/5"
                : "border-destructive bg-destructive/5"
            }`}
          >
            <div
              className={`font-serif text-4xl ${
                normal ? "text-[var(--success)]" : "text-destructive"
              }`}
            >
              ● {normal ? "NORMAL" : "ANOMALY"}
            </div>
            <div className="font-mono text-xs text-right">
              {(result.score * 100).toFixed(0)}%{" "}
              {normal ? "confidence" : "anomaly score"}
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs">
            <span>
              <span className="text-muted-foreground">NLL </span>
              <span className="tabular">{result.nll.toFixed(3)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Threshold </span>
              <span className="tabular">
                {result.threshold != null ? result.threshold.toFixed(3) : "—"}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">LM-only </span>
              <span
                className={
                  result.lm_only.is_valid
                    ? "text-[var(--success)]"
                    : "text-destructive"
                }
              >
                {result.lm_only.is_valid ? "✓" : "✗"}
              </span>
            </span>
            {result.predicted_rule && (
              <span>
                <span className="text-muted-foreground">Rule </span>
                <span>{result.predicted_rule}</span>
              </span>
            )}
          </div>

          {result.violations.length > 0 ? (
            <div className="space-y-2">
              {result.violations.map((v, i) => (
                <div
                  key={`${v.rule}-${i}`}
                  className="border-l-2 border-destructive pl-3 py-2"
                >
                  <div className="font-mono text-xs font-semibold text-destructive">
                    {v.rule}
                  </div>
                  <div className="text-xs text-foreground mt-0.5">
                    {v.description}
                  </div>
                  <div className="text-tiny font-mono text-muted-foreground mt-0.5">
                    at step {v.step_index + 1} — {v.step_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-tiny font-mono text-muted-foreground">
              No rule violations detected
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================ */
/* Metrics table — shared by Batch tab                          */
/* ============================================================ */

type Task = "nextstep" | "completion" | "anomaly";
type EvalMode = "standard" | "ood";

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
/* TAB · Batch Eval                                             */
/* ============================================================ */

type BatchResult =
  | { task: "nextstep"; mode: EvalMode; data: NextStepEval | OODEval }
  | { task: "completion"; mode: EvalMode; data: CompletionEval | OODEval }
  | { task: "anomaly"; mode: EvalMode; data: AnomalyEval | OODEval };

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
  const [mode, setMode] = useState<EvalMode>("standard");
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
      if (mode === "ood") {
        const data = await api.evalOOD(f, task);
        res = { task, mode, data } as BatchResult;
      } else if (task === "nextstep") {
        const data = await api.evalNextStep(f);
        res = { task, mode, data };
      } else if (task === "completion") {
        const data = await api.evalCompletion(f);
        res = { task, mode, data };
      } else {
        const data = await api.evalAnomaly(f);
        res = { task, mode, data };
      }
      setResult(res);
      setElapsed(Date.now() - t0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const isStandard = result?.mode === "standard";
  const standardRows: (
    | NextStepEval["rows"][number]
    | CompletionEval["rows"][number]
    | AnomalyEval["rows"][number]
  )[] = isStandard
    ? (result!.data as NextStepEval | CompletionEval | AnomalyEval).rows
    : [];
  const totalPages = Math.max(1, Math.ceil(standardRows.length / PAGE_SIZE));
  const pageRows = standardRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const n = result?.data.n ?? 0;
  const perRowMs = elapsed != null && n ? elapsed / n : null;

  const downloadPredictions = () => {
    if (!result || !isStandard) return;
    if (result.task === "nextstep") {
      const data = result.data as NextStepEval;
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
      const rows = data.rows.map((r) => {
        const cells = [r.example_id, r.family];
        for (let i = 0; i < 5; i++) {
          const p = r.predictions[i];
          cells.push(p?.token ?? "", p ? p.prob.toFixed(6) : "");
        }
        return cells;
      });
      downloadCsv("predictions_nextstep.csv", [header, ...rows]);
    } else if (result.task === "completion") {
      const data = result.data as CompletionEval;
      const header = ["EXAMPLE_ID", "FAMILY", "PREDICTED"];
      const rows = data.rows.map((r) => [
        r.example_id,
        r.family,
        r.predicted.join("|"),
      ]);
      downloadCsv("predictions_completion.csv", [header, ...rows]);
    } else {
      const data = result.data as AnomalyEval;
      const header = [
        "EXAMPLE_ID",
        "FAMILY",
        "IS_VALID",
        "SCORE",
        "PREDICTED_RULE",
        "NLL",
      ];
      const rows = data.rows.map((r) => [
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

  const csvHelp = useMemo(
    () => ({
      nextstep:
        "Next-step:  EXAMPLE_ID, FAMILY, PARTIAL_SEQUENCE (pipe-separated; optional TRUE_NEXT_STEP)",
      completion:
        "Completion: EXAMPLE_ID, FAMILY, PARTIAL_SEQUENCE (optional TRUE_SUFFIX)",
      anomaly:
        "Anomaly:    EXAMPLE_ID, FAMILY, SEQUENCE (optional IS_VALID)",
    }),
    [],
  );

  const metrics =
    result?.data.metrics as unknown as Record<
      string,
      Record<string, number>
    > | null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            Task
          </span>
          <div className="flex border border-border">
            {(["nextstep", "completion", "anomaly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTask(t)}
                className={`px-2.5 py-1 font-mono text-tiny uppercase tracking-widest border-r border-border last:border-r-0 ${
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            Mode
          </span>
          <div className="flex border border-border">
            {(["standard", "ood"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 font-mono text-tiny uppercase tracking-widest border-r border-border last:border-r-0 ${
                  mode === m
                    ? "bg-foreground text-background"
                    : "bg-card hover:bg-surface"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
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
        className="w-full border border-dashed border-border-strong bg-card hover:bg-surface py-10 font-mono text-xs uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? "● evaluating…" : "DROP CSV OR CLICK TO UPLOAD"}
      </button>

      <div className="text-tiny font-mono text-muted-foreground space-y-0.5">
        <div>{csvHelp.nextstep}</div>
        <div>{csvHelp.completion}</div>
        <div>{csvHelp.anomaly}</div>
      </div>

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

      {result && (
        <>
          <MetricsTable task={result.task} metrics={metrics} />

          <div className="text-tiny font-mono text-muted-foreground">
            {elapsed?.toFixed(0)}ms total ·{" "}
            {perRowMs != null ? perRowMs.toFixed(1) : "—"}ms per row · {n} rows
            {result.mode === "ood" && " · OOD"}
          </div>

          {isStandard && (
            <button
              onClick={downloadPredictions}
              className="bg-foreground text-background font-mono text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-[var(--info)]"
            >
              ↓ Download predictions.csv
            </button>
          )}

          {isStandard && (
            <div>
              <div className="border border-border overflow-auto max-h-[460px]">
                {result.task === "nextstep" && (
                  <PerRowNextStep rows={pageRows as NextStepEval["rows"]} />
                )}
                {result.task === "completion" && (
                  <PerRowCompletion
                    rows={pageRows as CompletionEval["rows"]}
                  />
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
                  {Math.min(standardRows.length, (page + 1) * PAGE_SIZE)} of{" "}
                  {standardRows.length}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 border border-border disabled:opacity-30"
                >
                  next →
                </button>
              </div>
            </div>
          )}
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

export function ProcessLab() {
  const [dataset, setDataset] = useState<Dataset>(DATASETS.MOSFET);
  const [steps, setSteps] = useState<string[]>(DATASETS.MOSFET.steps);
  const [cursor, setCursor] = useState(4);
  const [tab, setTab] = useState<TabId>("predict");
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch((e) => setHealthError(String(e)));
  }, []);

  useEffect(() => {
    if (cursor >= steps.length) setCursor(Math.max(0, steps.length - 1));
  }, [steps.length, cursor]);

  const healthOk = !!health?.ok;
  const healthLabel = healthError
    ? `BACKEND UNREACHABLE · ${healthError.slice(0, 60)}`
    : !health
      ? "CHECKING BACKEND…"
      : healthOk
        ? `READY · ${health.device} · vocab ${health.vocab_size}`
        : `NO CHECKPOINT — ${health.load_error ?? "unknown"}`;
  const healthTone = healthError || (health && !healthOk) ? "warning" : "success";

  return (
    <section className="px-4 md:px-6 lg:px-8 pt-6">
      <div className="border border-border-strong bg-card">
        {/* One-line header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-border bg-surface">
          <span className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            SILICON GPT · PROCESS LAB
          </span>
          <span className="flex items-center gap-2">
            <StatusDot color={healthTone} />
            <span
              className={`text-tiny font-mono ${
                healthTone === "warning"
                  ? "text-[var(--warning)]"
                  : "text-[var(--success)]"
              }`}
            >
              {healthLabel}
            </span>
          </span>
        </div>

        <ImportToolbar
          dataset={dataset}
          setDataset={setDataset}
          setSteps={setSteps}
          setCursor={setCursor}
        />

        <RecipeStrip
          steps={steps}
          cursor={cursor}
          setCursor={setCursor}
          dataset={dataset}
          health={health}
        />

        <TabBar tab={tab} setTab={setTab} />

        <div className="bg-surface">
          <div className="px-4 py-5 max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                {tab === "predict" && (
                  <PredictTab steps={steps} cursor={cursor} />
                )}
                {tab === "complete" && (
                  <CompleteTab
                    dataset={dataset}
                    steps={steps}
                    cursor={cursor}
                  />
                )}
                {tab === "validate" && <ValidateTab steps={steps} />}
                {tab === "anomaly" && <AnomalyTab steps={steps} />}
                {tab === "batch" && <BatchEvalTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
