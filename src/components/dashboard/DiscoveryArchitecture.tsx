import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CoScientistDiagram } from "./CoScientistDiagram";

/* ============================================================================
   How SiliconGPT was discovered — one linear story for the demo.
   1 Hero · 2 The model we started with + the problem · 3 The discovery engine
   (multi-agent loop + Experiment agent + GPU experiments + V1→final) · 4 Outcome.
   The engine diagram/tiers/results live in <CoScientistDiagram/> (reused).
   ========================================================================= */

const GREEN = "var(--success)";
const RED = "var(--destructive)";
const AMBER = "var(--warning)";
const INFO = "var(--info)";

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <Kicker>{kicker}</Kicker>
      <h2 className="font-serif text-2xl md:text-3xl mt-1 leading-tight">{title}</h2>
      {desc && (
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>
      )}
    </div>
  );
}

/* ─── BEAT 1 · HERO + research-goal → production arc ──────────────────────── */

const ARC: { k: string; v: string; tone?: "io" | "engine" | "out" }[] = [
  { k: "Research goal", v: "generalize OOD", tone: "io" },
  { k: "Config rubric", v: "OOD · buildable · no-overfit" },
  { k: "Multi-agent loop", v: "7 specialists", tone: "engine" },
  { k: "GPU experiments", v: "train + benchmark", tone: "engine" },
  { k: "Validated finding", v: "scale ↓ → OOD ↑" },
  { k: "Production model", v: "1.37M SiliconGPT", tone: "out" },
];

function Hero() {
  return (
    <section className="px-4 md:px-6 lg:px-8 pt-10 pb-12">
      <div className="max-w-6xl mx-auto">
        <Kicker>§ 01 · How SiliconGPT was discovered</Kicker>
        <h1 className="font-serif text-3xl md:text-5xl mt-2 leading-tight">
          We didn't hand-tune a model.
          <br />
          We built a system that <span className="text-[var(--info)]">discovered</span> one.
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-3xl leading-relaxed">
          Starting from a 25M from-scratch transformer, a measurement-grounded multi-agent loop —
          seven specialists plus a GPU Experiment agent — proposed, debated, and{" "}
          <span className="text-foreground">actually trained &amp; benchmarked</span> architecture
          hypotheses, and found that a <span className="text-foreground">1.37M</span> model
          generalizes better out-of-distribution. Every claim is a real measured number.
        </p>

        {/* research goal → production arc */}
        <div className="mt-8 flex flex-wrap items-stretch gap-2">
          {ARC.map((s, i) => {
            const accent =
              s.tone === "io" ? INFO : s.tone === "engine" ? AMBER : s.tone === "out" ? GREEN : undefined;
            return (
              <motion.div
                key={s.k}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2"
              >
                <div
                  className="bg-card border px-3 py-2 min-w-[150px]"
                  style={{ borderColor: accent ?? "var(--border)", borderLeftWidth: accent ? 3 : 1 }}
                >
                  <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
                    {s.k}
                  </div>
                  <div className="text-sm mt-0.5">{s.v}</div>
                </div>
                {i < ARC.length - 1 && (
                  <span className="text-muted-foreground font-mono">→</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── BEAT 2 · The model we started with + the problem ────────────────────── */

function StartingPoint() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-14 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 02 · Step 0 — before any agents"
          title="First we built a model. Then we built the system that improved it."
          desc="The multi-agent loop did not invent SiliconGPT from scratch — it refined an existing, working V1. Here is what it started from, and the problem it was pointed at."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* V1 model */}
          <div className="border border-border bg-card p-5">
            <Kicker>The V1 model</Kicker>
            <div className="font-serif text-xl mt-1">25M decoder · from scratch</div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
              {[
                ["Architecture", "8 layers · d=512"],
                ["Components", "RMSNorm · RoPE · SwiGLU"],
                ["Vocabulary", "202 step tokens"],
                ["Training data", "60K real recipes"],
                ["Families", "mosfet · igbt · ic"],
                ["Wrapper?", "none — sovereign"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-muted-foreground">{k}</span>
                  <div className="text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* The problem */}
          <div className="border border-border bg-card p-5">
            <Kicker>The problem it was pointed at</Kicker>
            <div className="font-serif text-xl mt-1">In-distribution was solved. OOD was not.</div>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <span className="text-muted-foreground">In-dist next-step top-1</span>
                <span className="font-mono tabular">
                  <span className="text-foreground">0.807</span>{" "}
                  <span className="text-muted-foreground text-xs">· a trigram ties it (saturated)</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">Held-out-family OOD top-1</span>
                <span className="font-mono tabular">
                  <span style={{ color: AMBER }}>0.4947</span>{" "}
                  <span className="text-muted-foreground text-xs">· the deciding, open metric</span>
                </span>
              </div>
              <div
                className="mt-3 border-l-2 pl-3 py-1 text-xs text-muted-foreground leading-relaxed"
                style={{ borderColor: INFO }}
              >
                More in-distribution data wouldn't help — the model already learned the local grammar.
                The open question: <span className="text-foreground">what change makes a small,
                from-scratch model generalize to an unseen 4th family?</span> That is the question we
                handed to the discovery engine.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── BEAT 3 · The discovery engine (reused diagram + tiers + results) ─────── */

function Engine() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-14 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 03 · The discovery engine"
          title="A measurement-grounded multi-agent loop."
          desc="One Supervisor orchestrates seven specialists (the six from Google's AI Co-Scientist + our GPU Experiment agent). Ideas are debated, then actually trained and benchmarked on A100s — so the tournament ranks on measured OOD, not argument. Below: the loop, the three-tier validation ladder, and every lever it tested with real numbers."
        />
        <CoScientistDiagram />
      </div>
    </section>
  );
}

/* ─── BEAT 4 · Outcome — negatives, diagnosis, what shipped ────────────────── */

const NEGATIVES: [string, string][] = [
  ["Description-init embeddings", "−0.018 OOD"],
  ["Cross-family data augmentation", "−0.018 OOD"],
  ["NoPE + augmentation", "−0.009 (NoPE alone: neutral)"],
  ["Constrained decoding", "~97% of OOD errors are valid-but-wrong"],
  ["Weight-sharing", "−0.009 OOD"],
];

const FINAL_STATS: [string, string][] = [
  ["Params", "1.37M · 18× smaller"],
  ["OOD top-1", "0.5031 · +0.008 (3-seed)"],
  ["In-dist top-1", "0.811 · no regression"],
  ["Anomaly F1", "1.000"],
  ["Validity", "~99–100%"],
];

function Outcome() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-14 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 04 · What the search concluded"
          title="One lever worked. Five didn't. And we know why."
          desc="Across two rounds, every lever touching data, embeddings, positional encoding, decoding, or weight-tying failed. Only reducing total parameters improved OOD."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* negatives */}
          <div className="border border-border bg-card p-5">
            <Kicker>Five principled negatives (each rules out a tempting direction)</Kicker>
            <div className="mt-3 space-y-1.5">
              {NEGATIVES.map(([lever, delta]) => (
                <div
                  key={lever}
                  className="flex items-baseline justify-between gap-3 text-sm border-b border-border last:border-b-0 pb-1.5 last:pb-0"
                >
                  <span className="flex items-center gap-2">
                    <span style={{ color: RED }} className="font-mono text-xs">
                      ✗
                    </span>
                    {lever}
                  </span>
                  <span className="font-mono text-xs tabular text-muted-foreground text-right">
                    {delta}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 border-l-2 pl-3 py-1 text-xs text-muted-foreground leading-relaxed"
              style={{ borderColor: AMBER }}
            >
              <span className="text-foreground">The diagnosis:</span> the OOD gap is a hard
              transition-structure residual — on an unseen family the model emits a{" "}
              <span className="text-foreground">legal</span> step, just the wrong legal one
              (~97% of errors). Excess capacity was spent memorizing non-transferable per-family
              shortcuts; shrinking the model forces it to learn structure.
            </div>
          </div>

          {/* shipped */}
          <div className="border bg-card p-5" style={{ borderColor: GREEN }}>
            <Kicker>What we shipped</Kicker>
            <div className="font-serif text-2xl mt-1" style={{ color: GREEN }}>
              SiliconGPT · 1.37M
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              the small, from-scratch model the engine discovered — trained on all three families.
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {FINAL_STATS.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-3 border-b border-border last:border-b-0 pb-1.5 last:pb-0"
                >
                  <span className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
                    {k}
                  </span>
                  <span className="font-mono text-sm tabular text-foreground">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 font-mono text-tiny text-muted-foreground">
              Better OOD · same in-dist · 18× smaller · faster — the result of a measured search,
              not a guess.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── EXPORT ───────────────────────────────────────────────────────────────── */

export function DiscoveryArchitecture() {
  return (
    <>
      <Hero />
      <StartingPoint />
      <Engine />
      <Outcome />
    </>
  );
}
