import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, StatusDot, Label } from "./primitives";

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

const DATASETS: Record<string, Dataset> = {
  MOSFET: {
    id: "MOSFET",
    family: "Power MOSFET",
    node: "0.5 µm · 6\" wafer",
    description: "Planar n-channel MOSFET, 20-step reference recipe",
    steps: [
      "RECEIVE_WAFER",
      "RCA_CLEAN",
      "THERMAL_OXIDATION",
      "PHOTORESIST",
      "ALIGN_MASK",
      "EXPOSE",
      "DEVELOP",
      "OXIDE_ETCH",
      "HARD_BAKE",
      "ION_IMPLANT_N",
      "ANNEAL_RTP",
      "GATE_OXIDE",
      "POLY_DEPOSITION",
      "POLY_ETCH",
      "SOURCE_DRAIN_IMPLANT",
      "ANNEAL_FURNACE",
      "METAL_DEPOSITION",
      "METAL_ETCH",
      "PASSIVATION",
      "CD_MEASUREMENT",
    ],
  },
  IGBT: {
    id: "IGBT",
    family: "Insulated-Gate Bipolar Transistor",
    node: "1.2 µm · 8\" wafer",
    description: "Trench IGBT with backside collector, 17-step recipe",
    steps: [
      "RECEIVE_WAFER",
      "RCA_CLEAN",
      "EPI_GROWTH",
      "FIELD_OXIDE",
      "PHOTORESIST",
      "EXPOSE",
      "DEVELOP",
      "P_BASE_IMPLANT",
      "DRIVE_IN",
      "N_PLUS_IMPLANT",
      "ANNEAL_RTP",
      "GATE_OXIDATION",
      "POLY_GATE",
      "EMITTER_METAL",
      "BACKSIDE_GRIND",
      "COLLECTOR_METAL",
      "PASSIVATION",
    ],
  },
  IC: {
    id: "IC",
    family: "CMOS Logic (BEOL+FEOL)",
    node: "28 nm · 12\" wafer",
    description: "Full CMOS flow with Cu damascene BEOL, 22-step recipe",
    steps: [
      "RECEIVE_WAFER",
      "RCA_CLEAN",
      "STI_ETCH",
      "STI_FILL",
      "CMP_OXIDE",
      "WELL_IMPLANT",
      "GATE_OXIDE",
      "POLY_DEPOSITION",
      "GATE_LITHO",
      "GATE_ETCH",
      "LDD_IMPLANT",
      "SPACER_DEPOSIT",
      "SD_IMPLANT",
      "SILICIDE",
      "ILD_DEPOSIT",
      "CONTACT_ETCH",
      "W_FILL",
      "CMP_W",
      "M1_LITHO",
      "M1_ETCH",
      "CU_DAMASCENE",
      "CMP_CU",
    ],
  },
  OOD: {
    id: "OOD",
    family: "Novel Device · Held-Out",
    node: "Sub-2 nm · research",
    description: "Out-of-distribution sample. Not seen during training.",
    steps: [
      "RECEIVE_WAFER",
      "CRYO_ETCH",
      "2D_TRANSFER_MoS2",
      "ALD_HfZrO2",
      "FERRO_ANNEAL",
      "GRAPHENE_CONTACT",
      "BEOL_AIR_GAP",
      "PHOTONIC_COUPLER",
    ],
  },
};

const PROCESS_STAGE: Record<string, string> = {
  RECEIVE: "Incoming",
  CLEAN: "Surface Prep",
  RCA: "Surface Prep",
  THERMAL: "FEOL · Oxide",
  EPI: "FEOL · Epi",
  FIELD: "FEOL · Isolation",
  STI: "FEOL · Isolation",
  WELL: "FEOL · Doping",
  GATE: "FEOL · Gate",
  POLY: "FEOL · Gate",
  ION: "FEOL · Doping",
  LDD: "FEOL · Doping",
  SD: "FEOL · Doping",
  P_BASE: "FEOL · Doping",
  N_PLUS: "FEOL · Doping",
  SOURCE: "FEOL · Doping",
  ANNEAL: "Thermal",
  DRIVE: "Thermal",
  HARD: "Lithography",
  PHOTORESIST: "Lithography",
  ALIGN: "Lithography",
  EXPOSE: "Lithography",
  DEVELOP: "Lithography",
  M1: "BEOL · Metal",
  ILD: "BEOL · Dielectric",
  CONTACT: "BEOL · Contact",
  SILICIDE: "BEOL · Contact",
  SPACER: "FEOL · Gate",
  OXIDE: "Lithography",
  METAL: "BEOL · Metal",
  W: "BEOL · Metal",
  CU: "BEOL · Metal",
  CMP: "BEOL · Planarize",
  BACKSIDE: "Backside",
  COLLECTOR: "Backside",
  EMITTER: "BEOL · Metal",
  PASSIVATION: "Final",
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
  const head = step.split("_")[0];
  return PROCESS_STAGE[head] ?? PROCESS_STAGE[step] ?? "Process";
}

/* ---------- pseudo model ---------- */

function seededRand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// universe of plausible next steps shared across datasets
const ALL_STEPS = Array.from(
  new Set(Object.values(DATASETS).flatMap((d) => d.steps)),
);

function predictTop5(prefix: string[], dataset: Dataset): { token: string; prob: number }[] {
  const seed = prefix.reduce((a, t, i) => a + t.charCodeAt(0) * (i + 11), 7);
  const rand = seededRand(seed);
  const last = prefix[prefix.length - 1] ?? "";
  const nextInDataset = dataset.steps[prefix.length];
  const candidates = ALL_STEPS.filter((s) => s !== last);
  const scored = candidates.map((s) => {
    let w = rand() * 0.4;
    if (s === nextInDataset) w += 2.2; // strong correct-answer bias
    if (last.includes("PHOTORESIST") && s.includes("ALIGN")) w += 0.6;
    if (last.includes("ALIGN") && s.includes("EXPOSE")) w += 0.8;
    if (last.includes("EXPOSE") && s.includes("DEVELOP")) w += 1.0;
    if (last.includes("DEVELOP") && s.includes("ETCH")) w += 0.7;
    if (last.includes("IMPLANT") && s.includes("ANNEAL")) w += 0.9;
    if (last.includes("METAL_DEPOSITION") && s.includes("METAL_ETCH")) w += 0.8;
    if (last.includes("CONTACT_ETCH") && s.includes("W_FILL")) w += 0.6;
    if (last.includes("W_FILL") && s.includes("CMP_W")) w += 0.7;
    return { token: s, w };
  });
  scored.sort((a, b) => b.w - a.w);
  const top = scored.slice(0, 5);
  const exps = top.map((s) => Math.exp(s.w));
  const sum = exps.reduce((a, b) => a + b, 0);
  return top.map((s, i) => ({ token: s.token, prob: exps[i] / sum }));
}

/* ============================================================ */
/* Step 1 — Import Data                                         */
/* ============================================================ */

function ImportPanel({
  dataset,
  setDataset,
  setSteps,
}: {
  dataset: Dataset;
  setDataset: (d: Dataset) => void;
  setSteps: (s: string[]) => void;
}) {
  const [mode, setMode] = useState<"demo" | "paste" | "upload">("demo");
  const [paste, setPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPaste = () => {
    const tokens = paste
      .split(/[\s,;\n]+/)
      .map((s) => s.trim().toUpperCase().replace(/\s+/g, "_"))
      .filter(Boolean);
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
      const tokens = text
        .split(/[\r\n,;]+/)
        .map((s) => s.trim().toUpperCase().replace(/\s+/g, "_"))
        .filter((s) => s && !s.startsWith("#"));
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

  return (
    <Panel
      title="Step 01 · Import Data"
      meta={<span className="flex items-center gap-2"><StatusDot color="info" /> source: {dataset.id}</span>}
    >
      <div className="grid grid-cols-3 border border-border mb-4">
        {(["demo", "paste", "upload"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-2 font-mono text-tiny uppercase tracking-widest border-r border-border last:border-r-0 ${
              mode === m ? "bg-foreground text-background" : "bg-card hover:bg-surface"
            }`}
          >
            {m === "demo" ? "Demo Dataset" : m === "paste" ? "Paste Steps" : "Upload CSV"}
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
                <div className="mt-1 text-tiny font-mono text-muted-foreground">{d.family}</div>
                <div className="text-tiny font-mono text-muted-foreground">{d.node}</div>
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
            placeholder={"RECEIVE_WAFER\nRCA_CLEAN\nTHERMAL_OXIDATION\n…"}
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
            Accepts comma, newline, or semicolon-separated tokens.
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border">
        <Label>Active Recipe</Label>
        <div className="mt-1 font-mono text-xs">{dataset.family}</div>
        <div className="text-tiny font-mono text-muted-foreground">{dataset.description}</div>
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
          {steps.length} steps · cursor @ {String(selected + 1).padStart(2, "0")}
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
                  <span className={`font-mono text-xs ${active ? "text-foreground" : ""}`}>
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

type TabId = "predict" | "complete" | "validate" | "anomaly" | "ood";

const TABS: { id: TabId; code: string; label: string }[] = [
  { id: "predict", code: "T1", label: "Predict Next Step" },
  { id: "complete", code: "T2", label: "Complete Sequence" },
  { id: "validate", code: "T3", label: "Validate Process" },
  { id: "anomaly", code: "T4", label: "Detect Anomalies" },
  { id: "ood", code: "T5", label: "OOD Analysis" },
];

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 border-y border-border-strong">
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
              <span className="text-tiny font-mono text-muted-foreground">{t.code}</span>
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
  const [results, setResults] = useState<{ token: string; prob: number }[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRunning(true);
    setResults([]);
    const t = setTimeout(() => {
      setResults(predictTop5(prefix, dataset));
      setRunning(false);
    }, 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, dataset.id, steps.length]);

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
        <Panel title="Top-5 Predicted Steps" meta={running ? "computing" : "READY"}>
          <div className="space-y-2 min-h-[260px]">
            {results.length === 0 && (
              <div className="text-tiny font-mono text-muted-foreground pulse-dot">
                sampling distribution…
              </div>
            )}
            {results.map((r, i) => (
              <motion.div
                key={r.token}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="grid grid-cols-12 items-center gap-3"
              >
                <div className="col-span-1 font-mono text-tiny text-muted-foreground">
                  #{i + 1}
                </div>
                <div className="col-span-4 font-mono text-xs">{r.token}</div>
                <div className="col-span-5 h-6 bg-background border border-border relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.prob * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
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
    const target = Math.max(4, steps.length - prefix.length);
    const buf: string[] = [];
    const tick = (i: number) => {
      if (i >= target) {
        setRunning(false);
        return;
      }
      const next = predictTop5([...prefix, ...buf], dataset)[0];
      buf.push(next.token);
      setOut([...buf]);
      timer.current = setTimeout(() => tick(i + 1), 260);
    };
    timer.current = setTimeout(() => tick(0), 200);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, dataset.id, steps.length]);

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
                sampling next token…
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

type Rule = {
  id: string;
  label: string;
  check: (seq: string[]) => { ok: boolean; offendingIdx?: number };
};

const VAL_RULES: Rule[] = [
  {
    id: "V-01",
    label: "Clean Before Deposition",
    check: (seq) => {
      for (let i = 0; i < seq.length; i++) {
        if (/DEPOSIT|EPI_|GATE_OXIDE/.test(seq[i])) {
          const before = seq.slice(Math.max(0, i - 3), i);
          if (!before.some((t) => /CLEAN|RCA|CMP/.test(t)))
            return { ok: false, offendingIdx: i };
        }
      }
      return { ok: true };
    },
  },
  {
    id: "V-02",
    label: "Lithography Before Etch",
    check: (seq) => {
      for (let i = 0; i < seq.length; i++) {
        if (/ETCH/.test(seq[i])) {
          const before = seq.slice(0, i);
          if (!before.some((t) => /EXPOSE|DEVELOP|LITHO|PHOTORESIST/.test(t)))
            return { ok: false, offendingIdx: i };
        }
      }
      return { ok: true };
    },
  },
  {
    id: "V-03",
    label: "Implant Window Exists",
    check: (seq) => {
      for (let i = 0; i < seq.length; i++) {
        if (/IMPLANT/.test(seq[i])) {
          const after = seq.slice(i + 1, i + 5);
          if (!after.some((t) => /ANNEAL|DRIVE/.test(t)))
            return { ok: false, offendingIdx: i };
        }
      }
      return { ok: true };
    },
  },
  {
    id: "V-04",
    label: "CMP Has Material",
    check: (seq) => {
      for (let i = 0; i < seq.length; i++) {
        if (/^CMP/.test(seq[i])) {
          const before = seq.slice(Math.max(0, i - 4), i);
          if (!before.some((t) => /FILL|DEPOSIT|METAL|OXIDE|CU|W_/.test(t)))
            return { ok: false, offendingIdx: i };
        }
      }
      return { ok: true };
    },
  },
  {
    id: "V-05",
    label: "Test After Passivation",
    check: (seq) => {
      const pIdx = seq.findIndex((t) => /PASSIVATION/.test(t));
      if (pIdx === -1) return { ok: true };
      const after = seq.slice(pIdx + 1);
      if (after.length === 0) return { ok: true };
      if (!after.some((t) => /MEASURE|INSPECT|CD_/.test(t)))
        return { ok: false, offendingIdx: pIdx };
      return { ok: true };
    },
  },
];

function ValidateTab({ steps }: { steps: string[] }) {
  const [results, setResults] = useState<
    { id: string; ok: boolean | null; offendingIdx?: number }[]
  >([]);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setResults(VAL_RULES.map((r) => ({ id: r.id, ok: null })));
    VAL_RULES.forEach((r, i) => {
      setTimeout(() => {
        const res = r.check(steps);
        setResults((prev) =>
          prev.map((p) =>
            p.id === r.id ? { id: r.id, ok: res.ok, offendingIdx: res.offendingIdx } : p,
          ),
        );
        if (i === VAL_RULES.length - 1) setRunning(false);
      }, 180 * (i + 1));
    });
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length, steps.join("|")]);

  const failed = results.filter((r) => r.ok === false);
  const done = results.every((r) => r.ok !== null);
  const verdict = !done ? "pending" : failed.length === 0 ? "VALID" : "INVALID";
  const offenders = new Set(failed.map((f) => f.offendingIdx).filter((x) => x != null));

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
            {results.filter((r) => r.ok === true).length}/{VAL_RULES.length} rules satisfied
          </div>
        </motion.div>

        <Panel title="Rule Trace">
          <div className="space-y-2">
            {VAL_RULES.map((r) => {
              const s = results.find((x) => x.id === r.id);
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[40px_1fr_60px] gap-2 items-center"
                >
                  <span className="font-mono text-tiny text-muted-foreground">{r.id}</span>
                  <span className="text-xs">{r.label}</span>
                  <span className="text-right font-mono text-tiny uppercase">
                    {s?.ok == null ? (
                      <span className="text-muted-foreground pulse-dot">…</span>
                    ) : s.ok ? (
                      <span className="text-[var(--success)]">✓ pass</span>
                    ) : (
                      <span className="text-destructive">✗ fail</span>
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

        {failed.length > 0 && done && (
          <Panel title="Violations">
            <div className="space-y-2">
              {failed.map((f) => {
                const rule = VAL_RULES.find((r) => r.id === f.id)!;
                return (
                  <div
                    key={f.id}
                    className="border border-destructive bg-destructive/5 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-destructive">
                        {f.id} · {rule.label}
                      </span>
                      {f.offendingIdx != null && (
                        <span className="font-mono text-tiny text-destructive">
                          step {String(f.offendingIdx + 1).padStart(2, "0")} · {steps[f.offendingIdx]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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

function AnomalyTab({ dataset, steps }: { dataset: Dataset; steps: string[] }) {
  const [scores, setScores] = useState<number[]>([]);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setScores([]);
    const buf: number[] = [];
    steps.forEach((tok, i) => {
      setTimeout(() => {
        const rand = seededRand(tok.charCodeAt(0) * 31 + i * 7 + dataset.id.length);
        let s = rand() * 0.35;
        const prev = steps[i - 1] ?? "";
        // generate higher score for unusual adjacencies
        if (/ETCH/.test(prev) && /METAL_DEP/.test(tok)) s += 0.55;
        if (/IMPLANT/.test(prev) && !/ANNEAL|DRIVE/.test(tok)) s += 0.35;
        if (/2D_|GRAPHENE|FERRO|CRYO|PHOTONIC/.test(tok)) s += 0.45;
        buf[i] = Math.min(0.98, s);
        setScores([...buf]);
        if (i === steps.length - 1) setRunning(false);
      }, 110 * (i + 1));
    });
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.join("|"), dataset.id]);

  const heat = (v: number) => {
    if (v < 0.2) return "bg-[var(--success)]/15 border-[var(--success)]/40";
    if (v < 0.45) return "bg-[var(--info)]/15 border-[var(--info)]/50";
    if (v < 0.7) return "bg-[var(--warning)]/20 border-[var(--warning)]/60";
    return "bg-destructive/25 border-destructive/70";
  };
  const sev = (v: number) =>
    v < 0.2 ? "low" : v < 0.45 ? "nominal" : v < 0.7 ? "warning" : "critical";

  const max = scores.length ? Math.max(...scores) : 0;
  const maxIdx = scores.indexOf(max);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Panel title="Anomaly Summary">
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-border p-2">
              <Label>Max Score</Label>
              <div className="font-mono text-2xl tabular text-destructive">
                {(max * 100).toFixed(0)}%
              </div>
            </div>
            <div className="border border-border p-2">
              <Label>Location</Label>
              <div className="font-mono text-2xl tabular">
                {maxIdx >= 0 ? String(maxIdx + 1).padStart(2, "0") : "—"}
              </div>
            </div>
            <div className="border border-border p-2">
              <Label>Severity</Label>
              <div className="font-mono text-xs uppercase mt-2">{sev(max)}</div>
            </div>
          </div>
        </Panel>

        <Panel title="Suspicious Steps">
          <div className="space-y-1">
            {scores
              .map((s, i) => ({ s, i }))
              .filter((x) => x.s > 0.5)
              .sort((a, b) => b.s - a.s)
              .slice(0, 6)
              .map((x) => (
                <div
                  key={x.i}
                  className="grid grid-cols-[40px_1fr_60px] items-center gap-2 border-l-2 border-destructive pl-2 py-1"
                >
                  <span className="font-mono text-tiny text-muted-foreground">
                    {String(x.i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-xs">{steps[x.i]}</span>
                  <span className="font-mono text-tiny text-destructive text-right tabular">
                    {(x.s * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            {scores.filter((s) => s > 0.5).length === 0 && !running && (
              <div className="font-mono text-tiny text-muted-foreground">
                No anomalies above threshold.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-3">
        <Panel title="Per-Step Heatmap" meta={running ? "scanning" : "complete"}>
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${Math.min(steps.length, 12)}, minmax(0, 1fr))`,
            }}
          >
            {steps.map((tok, i) => {
              const v = scores[i] ?? 0;
              return (
                <motion.div
                  key={`${tok}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  title={`${tok} · ${(v * 100).toFixed(0)}%`}
                  className={`border ${heat(v)} aspect-square min-h-[48px] flex flex-col items-center justify-center p-1`}
                >
                  <div className="font-mono text-tiny text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="font-mono text-xs tabular">{(v * 100).toFixed(0)}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 text-tiny font-mono text-muted-foreground">
            <span>0%</span>
            <div className="flex-1 h-2 bg-gradient-to-r from-[var(--success)] via-[var(--info)] via-[var(--warning)] to-destructive" />
            <span>100% anomaly</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* TAB 5 · OOD Analysis                                         */
/* ============================================================ */

function OODTab() {
  const data = useMemo(
    () => ({
      training: ["MOSFET", "IGBT"],
      testing: "IC",
      metrics: { top1: 73.8, top5: 96.4, mrr: 0.812 },
      perFamily: [
        { name: "MOSFET", top1: 92.1, top5: 100, mrr: 0.956, role: "train" },
        { name: "IGBT", top1: 88.4, top5: 99.2, mrr: 0.921, role: "train" },
        { name: "IC", top1: 73.8, top5: 96.4, mrr: 0.812, role: "test" },
        { name: "OOD-Novel", top1: 41.2, top5: 78.9, mrr: 0.527, role: "ood" },
      ],
    }),
    [],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Panel title="Training Manifest">
          <Label>Training Families</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.training.map((t) => (
              <span
                key={t}
                className="font-mono text-xs px-2 py-1 border border-[var(--success)]/60 bg-[var(--success)]/10 text-[var(--success)]"
              >
                ✓ {t}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <Label>Held-Out Test Family</Label>
            <div className="mt-2">
              <span className="font-mono text-xs px-2 py-1 border border-[var(--info)] bg-accent text-[var(--info)]">
                ◆ {data.testing}
              </span>
            </div>
          </div>
          <div className="mt-4 text-tiny font-mono text-muted-foreground">
            Model is evaluated on a process family it has never observed during
            training, measuring grammar transfer across device topologies.
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Top-1 Accuracy", value: data.metrics.top1, suffix: "%" },
            { label: "Top-5 Accuracy", value: data.metrics.top5, suffix: "%" },
            { label: "MRR", value: data.metrics.mrr * 1000, suffix: "" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-border-strong bg-card p-4"
            >
              <Label>{m.label}</Label>
              <div className="font-mono text-4xl tabular mt-1 text-[var(--info)]">
                {m.suffix === "%" ? m.value.toFixed(1) : (m.value / 1000).toFixed(3)}
                <span className="text-base text-muted-foreground">{m.suffix}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <Panel title="Per-Family Performance">
          <div className="border border-border">
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase text-muted-foreground">
              <span>Family</span>
              <span className="text-right">Role</span>
              <span className="text-right">Top-1</span>
              <span className="text-right">Top-5</span>
              <span className="text-right">MRR</span>
            </div>
            {data.perFamily.map((f, i) => (
              <div
                key={f.name}
                className={`grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-3 py-2 items-center ${
                  i !== data.perFamily.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="font-mono text-xs">{f.name}</span>
                <span className="text-right font-mono text-tiny uppercase">
                  {f.role === "train" ? (
                    <span className="text-[var(--success)]">train</span>
                  ) : f.role === "test" ? (
                    <span className="text-[var(--info)]">test</span>
                  ) : (
                    <span className="text-warning text-[var(--warning)]">ood</span>
                  )}
                </span>
                <span className="font-mono text-xs tabular text-right">{f.top1.toFixed(1)}</span>
                <span className="font-mono text-xs tabular text-right">{f.top5.toFixed(1)}</span>
                <span className="font-mono text-xs tabular text-right">{f.mrr.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Container                                                    */
/* ============================================================ */

export function ProcessLab() {
  const [dataset, setDataset] = useState<Dataset>(DATASETS.MOSFET);
  const [steps, setSteps] = useState<string[]>(DATASETS.MOSFET.steps);
  const [selected, setSelected] = useState(4);
  const [tab, setTab] = useState<TabId>("predict");

  // clamp selection when dataset changes
  useEffect(() => {
    if (selected >= steps.length) setSelected(Math.max(0, steps.length - 1));
  }, [steps.length, selected]);

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
            <span>RECIPE {dataset.id}</span>
            <span>·</span>
            <span>{steps.length} steps</span>
            <span>·</span>
            <span className="text-[var(--success)]">READY</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 px-5 py-5 border-b border-border">
          <div>
            <h2 className="font-serif text-4xl leading-tight">
              The semiconductor engineer's workstation.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Import a wafer recipe, walk the manufacturing pipeline, and drive
              SiliconGPT across five inference tasks — prediction, completion,
              validation, anomaly detection, and out-of-distribution analysis.
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
              <div className="text-sm mt-1 text-[var(--success)]">sgpt-v041-ep142</div>
            </div>
          </div>
        </div>

        {/* Step 1 + Step 2 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 p-4 border-b border-border bg-surface">
          <ImportPanel dataset={dataset} setDataset={setDataset} setSteps={setSteps} />
          <SequenceExplorer steps={steps} selected={selected} setSelected={setSelected} />
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
                <PredictTab dataset={dataset} steps={steps} cursor={selected} />
              )}
              {tab === "complete" && (
                <CompleteTab dataset={dataset} steps={steps} cursor={selected} />
              )}
              {tab === "validate" && <ValidateTab steps={steps} />}
              {tab === "anomaly" && <AnomalyTab dataset={dataset} steps={steps} />}
              {tab === "ood" && <OODTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
