import { motion } from "framer-motion";
import { useState } from "react";

/* ============================================================================
   DiscoveryArchitecture — 8 sections describing how SiliconGPT was discovered.
   Visual language: white research-paper background, thin lines,
   blue accents (system), green (validated), orange (Experiment Agent).
============================================================================ */

const BLUE = "var(--primary)";
const GREEN = "var(--success)";
const ORANGE = "#f97316";
const AMBER = "var(--warning)";
const RED = "var(--destructive)";

// ─── small primitives ───────────────────────────────────────────────────────

function Kicker({ children }: { children: React.ReactNode }) {
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
    <div className="mb-8">
      <Kicker>{kicker}</Kicker>
      <h2 className="font-serif text-3xl md:text-4xl mt-1 leading-tight">{title}</h2>
      {desc && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
          {desc}
        </p>
      )}
    </div>
  );
}

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative border border-border bg-card ${className}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1 · HERO ───────────────────────────────────────────────────────

function HeroDiagram() {
  const stages = [
    { label: "RESEARCH GOAL", glyph: "◎", color: "var(--foreground)" },
    { label: "MULTI-AGENT DISCOVERY", glyph: "⬡", color: BLUE },
    { label: "GPU BENCHMARKING", glyph: "⚡", color: ORANGE },
    { label: "ARCHITECTURE SEARCH", glyph: "⌬", color: BLUE },
    { label: "FINAL SILICONGPT", glyph: "★", color: GREEN },
  ];

  return (
    <div className="relative">
      {/* connecting line */}
      <svg
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-px pointer-events-none hidden md:block"
        preserveAspectRatio="none"
        viewBox="0 0 100 1"
      >
        <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="var(--border-strong)" strokeWidth="0.2" strokeDasharray="0.4 0.4" />
      </svg>

      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full hidden md:block"
        style={{ background: BLUE, boxShadow: `0 0 10px ${BLUE}` }}
        animate={{ left: ["2%", "98%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4">
        {stages.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-background border border-border-strong px-3 py-4 flex flex-col items-center text-center gap-2"
          >
            <div className="text-2xl leading-none" style={{ color: s.color }}>
              {s.glyph}
            </div>
            <Kicker>{`0${i + 1}`}</Kicker>
            <div className="font-mono text-[11px] uppercase tracking-wider font-semibold">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Section1Hero() {
  return (
    <section className="px-4 md:px-6 lg:px-8 pt-12 pb-16">
      <div className="max-w-5xl mx-auto">
        <Kicker>§ 01 · Discovery System</Kicker>
        <h1 className="font-serif text-5xl md:text-6xl mt-2 leading-[1.02]">
          How SiliconGPT Was Discovered.
        </h1>
        <p className="text-base text-muted-foreground mt-4 max-w-2xl leading-relaxed">
          A measurement-grounded multi-agent architecture search system inspired
          by Google's AI Co-Scientist and extended with a GPU{" "}
          <span className="text-foreground font-medium">Experiment Agent</span>{" "}
          — ideas earn their architecture by winning real benchmark runs.
        </p>

        <div className="mt-12">
          <HeroDiagram />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-12 border border-border bg-border">
          {[
            ["8", "specialized agents"],
            ["3", "validation tiers"],
            ["32+", "GPU experiments"],
            ["8.4×", "smaller, +0.017 OOD"],
          ].map(([v, k]) => (
            <div key={k} className="bg-card px-4 py-5">
              <div className="font-mono text-2xl font-semibold tabular">{v}</div>
              <Kicker>{k}</Kicker>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 2 · PIPELINE ───────────────────────────────────────────────────

type Agent = {
  id: string;
  n: string;
  label: string;
  purpose: string;
  input: string;
  output: string;
  contribution: string;
  highlight?: boolean;
};

const AGENTS: Agent[] = [
  { id: "gen", n: "01", label: "GENERATION", purpose: "Proposes novel, testable architectural hypotheses.", input: "Research goal · prior lessons · literature", output: "Hypothesis cards", contribution: "Idea breadth" },
  { id: "ref", n: "02", label: "REFLECTION", purpose: "Peer-reviews each hypothesis for novelty and feasibility.", input: "Hypothesis cards", output: "Filtered + triaged ideas (config vs code)", contribution: "Quality gate" },
  { id: "exp", n: "03", label: "EXPERIMENT", purpose: "Trains and benchmarks each surviving idea on GPU.", input: "Triaged hypotheses", output: "Measured result JSON (OOD top-1)", contribution: "Ground truth — novel agent", highlight: true },
  { id: "prx", n: "04", label: "PROXIMITY", purpose: "Clusters and de-duplicates hypotheses.", input: "Ranked + measured ideas", output: "De-duplicated cohort", contribution: "Avoids re-testing" },
  { id: "rnk", n: "05", label: "RANKING", purpose: "Elo tournament over pairwise debates and measurements.", input: "Cohort + measurements", output: "Ranked leaderboard", contribution: "Measured > simulated > reasoned" },
  { id: "evo", n: "06", label: "EVOLUTION", purpose: "Combines + refines top-ranked ideas into new hypotheses.", input: "Leaderboard top-k", output: "New hypothesis seeds", contribution: "Search depth" },
  { id: "met", n: "07", label: "META-REVIEW", purpose: "Synthesizes round-level lessons fed back to every agent.", input: "Full round trace", output: "Lessons memo", contribution: "Learning w/o backprop" },
  { id: "sup", n: "08", label: "SUPERVISOR", purpose: "Orchestrates rounds, assigns agents, decides when to stop.", input: "All signals", output: "Round plan · stop signal", contribution: "Control loop" },
];

function AgentNode({
  agent,
  active,
  onHover,
  onLeave,
}: {
  agent: Agent;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const color = agent.highlight ? ORANGE : BLUE;
  return (
    <motion.button
      type="button"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      whileHover={{ y: -2 }}
      className="relative text-left bg-card border px-3 py-3 flex flex-col gap-1 transition-shadow"
      style={{
        borderColor: agent.highlight ? color : "var(--border-strong)",
        borderWidth: agent.highlight ? 2 : 1,
        boxShadow: agent.highlight
          ? `0 0 0 1px ${color}22, 0 8px 24px -12px ${color}55`
          : active
            ? `0 0 0 1px ${color}33`
            : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <Kicker>{agent.n}</Kicker>
        {agent.highlight && (
          <span
            className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5"
            style={{ background: color, color: "#fff" }}
          >
            NEW
          </span>
        )}
      </div>
      <div className="font-mono text-[12px] font-semibold uppercase tracking-wide">
        {agent.label}
      </div>
      <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
        {agent.purpose}
      </div>
    </motion.button>
  );
}

function AgentDetail({ agent }: { agent: Agent | null }) {
  if (!agent) {
    return (
      <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
        Hover an agent to inspect its contract.
      </div>
    );
  }
  const color = agent.highlight ? ORANGE : BLUE;
  return (
    <motion.div
      key={agent.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-4 gap-4"
    >
      <div>
        <Kicker>Agent</Kicker>
        <div className="font-mono text-sm font-semibold mt-1" style={{ color }}>
          {agent.label}
        </div>
      </div>
      {[
        ["Input", agent.input],
        ["Output", agent.output],
        ["Contribution", agent.contribution],
      ].map(([k, v]) => (
        <div key={k}>
          <Kicker>{k}</Kicker>
          <div className="text-sm mt-1 leading-snug">{v}</div>
        </div>
      ))}
    </motion.div>
  );
}

function Section2Pipeline() {
  const [active, setActive] = useState<Agent | null>(null);

  return (
    <section className="px-4 md:px-6 lg:px-8 py-16 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 02 · Pipeline"
          title="The multi-agent discovery loop."
          desc="Each round flows from configuration through eight specialized agents and back. Hover any node to inspect its contract."
        />

        {/* top: config + supervisor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="bg-card border-l-2 px-4 py-3" style={{ borderLeftColor: GREEN }}>
            <Kicker>00 · Config</Kicker>
            <div className="font-mono text-[12px] font-semibold uppercase tracking-wide mt-1">
              Research Goal + Evaluation Rubric
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              The single knob that retargets the engine.
            </div>
          </div>
          <div className="bg-card border-l-2 px-4 py-3" style={{ borderLeftColor: BLUE }}>
            <Kicker>Orchestration</Kicker>
            <div className="font-mono text-[12px] font-semibold uppercase tracking-wide mt-1">
              Supervisor Agent · round controller
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Assigns agents · decides when the search has plateaued.
            </div>
          </div>
        </div>

        {/* agent grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AGENTS.map((a) => (
            <AgentNode
              key={a.id}
              agent={a}
              active={active?.id === a.id}
              onHover={() => setActive(a)}
              onLeave={() => setActive(null)}
            />
          ))}
        </div>

        {/* arrow */}
        <div className="flex items-center justify-center my-4 text-muted-foreground font-mono text-xs uppercase tracking-widest gap-2">
          <span>▼</span>
          <span>research overview</span>
          <span>▼</span>
        </div>

        {/* final */}
        <div className="bg-card border-l-2 px-4 py-3" style={{ borderLeftColor: GREEN }}>
          <Kicker>Output</Kicker>
          <div className="font-mono text-[12px] font-semibold uppercase tracking-wide mt-1">
            Ranked Hypothesis Board → Chosen Architecture
          </div>
        </div>

        {/* hover detail */}
        <div className="mt-6 border border-border bg-card px-4 py-4 min-h-[88px]">
          <AgentDetail agent={active} />
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 3 · EXPERIMENT AGENT ──────────────────────────────────────────

function Tier({
  tier,
  label,
  desc,
  color,
  badge,
}: {
  tier: string;
  label: string;
  desc: string;
  color: string;
  badge?: string;
}) {
  return (
    <div className="flex-1 bg-card border px-4 py-4 relative" style={{ borderColor: color, borderWidth: 1.5 }}>
      <div className="flex items-center justify-between">
        <Kicker>{tier}</Kicker>
        {badge && (
          <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5" style={{ background: color, color: "#fff" }}>
            {badge}
          </span>
        )}
      </div>
      <div className="font-mono text-[13px] font-semibold uppercase tracking-wide mt-1">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{desc}</div>
    </div>
  );
}

function Section3Experiment() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5" style={{ background: ORANGE, color: "#fff" }}>
            FEATURED · NOVEL
          </span>
        </div>
        <SectionTitle
          kicker="§ 03 · Experiment Agent"
          title="Ideas earn GPU time."
          desc="Hypotheses graduate through three tiers of evidence. Most ideas are killed for free; only finalists consume a full A100 run."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: tier ladder + flow */}
          <Frame className="p-6">
            <Kicker>Validation ladder</Kicker>
            <div className="mt-4 flex flex-col md:flex-row gap-3 items-stretch">
              <Tier tier="Tier 0" label="Reasoning Debate" desc="Every idea · free · LLM debate only." color={GREEN} />
              <div className="hidden md:flex items-center text-muted-foreground">▶</div>
              <Tier tier="Tier 1" label="Smoke Benchmark" desc="Shortlisted ideas · tiny/fast local train · cheap signal." color={AMBER} />
              <div className="hidden md:flex items-center text-muted-foreground">▶</div>
              <Tier tier="Tier 2" label="Full OOD" desc="Finalists only · 3-fold OOD on A100 via Slurm." color={ORANGE} badge="A100" />
            </div>

            {/* funnel */}
            <div className="mt-8">
              <Kicker>Evidence funnel</Kicker>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Cheap validation", w: 100, color: "var(--border-strong)" },
                  { label: "Shortlisted", w: 60, color: AMBER },
                  { label: "A100 evaluation", w: 30, color: ORANGE },
                  { label: "Measured evidence", w: 14, color: GREEN },
                ].map((row, i) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="w-40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </div>
                    <div className="flex-1 h-5 bg-surface border border-border relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.w}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                        className="h-full"
                        style={{ background: row.color }}
                      />
                    </div>
                    <div className="w-12 text-right font-mono text-[11px] tabular">{row.w}%</div>
                  </div>
                ))}
              </div>
            </div>
          </Frame>

          {/* Right: measured result JSON */}
          <Frame className="p-4">
            <Kicker>Output · measured result</Kicker>
            <pre className="mt-3 font-mono text-[11px] leading-relaxed bg-surface border border-border p-3 overflow-auto">
{`{
  "hypothesis_id": "h_3M_3L_d192",
  "tier": 2,
  "gpu": "A100",
  "folds": 3,
  "metrics": {
    "ood_top1": 0.5120,
    "in_dist_top1": 0.810,
    "params": 3.04e6
  },
  "verdict": "BEST_ALL_AROUND",
  "ingested_by": "ranking_agent"
}`}
            </pre>
            <div className="mt-3 text-[11px] text-muted-foreground leading-snug">
              JSON is ingested into the Elo ranking board. Measured beats simulated beats reasoned.
            </div>
          </Frame>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 4 · AGENT INTERACTION MAP ─────────────────────────────────────

function InteractionMap() {
  // 7 agents on a circle, supervisor in the middle
  const nodes = [
    { id: "GEN", x: 50, y: 8 },
    { id: "REF", x: 86, y: 25 },
    { id: "EXP", x: 92, y: 60, highlight: true },
    { id: "RNK", x: 70, y: 90 },
    { id: "EVO", x: 30, y: 90 },
    { id: "META", x: 8, y: 60 },
    { id: "SUP", x: 14, y: 25 },
  ];
  const edges: [string, string][] = [
    ["GEN", "REF"],
    ["REF", "EXP"],
    ["EXP", "RNK"],
    ["RNK", "EVO"],
    ["EVO", "META"],
    ["META", "SUP"],
    ["SUP", "GEN"],
  ];
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9", maxWidth: 760, margin: "0 auto" }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* edges */}
        {edges.map(([a, b], i) => {
          const A = pos[a];
          const B = pos[b];
          const isExp = a === "EXP" || b === "EXP";
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke={isExp ? ORANGE : "var(--border-strong)"}
                strokeWidth={isExp ? 0.4 : 0.3}
                strokeDasharray="0.6 0.6"
              />
              {/* moving particle */}
              <motion.circle
                r={0.7}
                fill={isExp ? ORANGE : BLUE}
                initial={{ cx: A.x, cy: A.y }}
                animate={{ cx: [A.x, B.x], cy: [A.y, B.y] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: i * 0.25 }}
              />
            </g>
          );
        })}
      </svg>

      {/* nodes */}
      {nodes.map((n) => (
        <div
          key={n.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-card font-mono text-[10px] uppercase tracking-widest border"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            borderColor: n.highlight ? ORANGE : "var(--border-strong)",
            color: n.highlight ? ORANGE : "var(--foreground)",
            borderWidth: n.highlight ? 1.5 : 1,
            boxShadow: n.highlight ? `0 0 14px ${ORANGE}55` : "none",
          }}
        >
          {n.id}
        </div>
      ))}
    </div>
  );
}

function Section4Interactions() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-16 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 04 · Interaction Map"
          title="A closed-loop ecosystem."
          desc="Information flows agent-to-agent. The loop is the learning signal — no gradients required."
        />
        <Frame className="p-6">
          <InteractionMap />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-2 pl-3" style={{ borderLeftColor: BLUE }}>
              <Kicker>Forward path</Kicker>
              <div className="text-sm mt-1">Generation → Reflection → Experiment → Ranking</div>
            </div>
            <div className="border-l-2 pl-3" style={{ borderLeftColor: ORANGE }}>
              <Kicker>Evolution path</Kicker>
              <div className="text-sm mt-1">Ranking → Evolution → Meta-Review → Supervisor</div>
            </div>
            <div className="border-l-2 pl-3" style={{ borderLeftColor: GREEN }}>
              <Kicker>Callout</Kicker>
              <div className="font-serif text-xl mt-1 leading-snug">
                Learning without backpropagation.
              </div>
            </div>
          </div>
        </Frame>
      </div>
    </section>
  );
}

// ─── SECTION 5 · ARCHITECTURE SEARCH RESULTS ───────────────────────────────

type Discovery = {
  size: string;
  params: number; // for x-axis (M)
  ood: number;
  inDist: number;
  decision: "REJECTED" | "ACCEPTED" | "WINNER" | "BASELINE";
  note: string;
};

const DISCOVERIES: Discovery[] = [
  { size: "25M baseline", params: 25, ood: 0.4947, inDist: 0.807, decision: "BASELINE", note: "V1 starting point" },
  { size: "6M (4L/256)", params: 6, ood: 0.5119, inDist: 0.802, decision: "ACCEPTED", note: "Confirms scale-down hypothesis" },
  { size: "3M (3L/192)", params: 3, ood: 0.5120, inDist: 0.810, decision: "WINNER", note: "Best all-around — chosen" },
  { size: "1.4M (3L/128)", params: 1.4, ood: 0.5139, inDist: 0.770, decision: "REJECTED", note: "In-dist regression" },
];

const DECISION_COLOR: Record<Discovery["decision"], string> = {
  BASELINE: "var(--muted-foreground)",
  ACCEPTED: GREEN,
  WINNER: GREEN,
  REJECTED: RED,
};

function SearchTimeline() {
  const maxP = 28;
  const minOOD = 0.49;
  const maxOOD = 0.515;
  const ySpan = maxOOD - minOOD;

  return (
    <div className="relative w-full" style={{ height: 340 }}>
      {/* grid */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((g) => (
          <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="var(--grid)" strokeWidth="0.2" />
        ))}
        {/* axis */}
        <line x1="0" y1="100" x2="100" y2="100" stroke="var(--border-strong)" strokeWidth="0.3" />
      </svg>

      {/* axis labels */}
      <div className="absolute left-0 top-0 font-mono text-tiny text-muted-foreground">OOD top-1 ↑</div>
      <div className="absolute right-0 bottom-0 font-mono text-tiny text-muted-foreground translate-y-5">params (M) →</div>

      {/* connecting evolution line */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <polyline
          points={DISCOVERIES.map((d) => {
            const x = (1 - d.params / maxP) * 95 + 2;
            const y = 100 - ((d.ood - minOOD) / ySpan) * 90 - 5;
            return `${x},${y}`;
          }).join(" ")}
          fill="none"
          stroke={BLUE}
          strokeWidth="0.3"
          strokeDasharray="0.8 0.6"
        />
      </svg>

      {/* nodes */}
      {DISCOVERIES.map((d, i) => {
        const x = (1 - d.params / maxP) * 95 + 2;
        const y = 100 - ((d.ood - minOOD) / ySpan) * 90 - 5;
        const color = DECISION_COLOR[d.decision];
        return (
          <motion.div
            key={d.size}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: color,
                boxShadow: d.decision === "WINNER" ? `0 0 0 4px ${GREEN}33` : "none",
              }}
            />
            <div className="absolute left-4 top-0 whitespace-nowrap">
              <div className="font-mono text-[10px] font-semibold">{d.size}</div>
              <div className="font-mono text-[10px] tabular" style={{ color }}>
                OOD {d.ood.toFixed(4)}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color }}>
                {d.decision}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Section5Search() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 05 · Architecture Search"
          title="The search trajectory."
          desc="Each measured run is a point. The arrow of evolution moves toward smaller, more general models."
        />
        <Frame className="p-6">
          <SearchTimeline />
        </Frame>

        <div className="mt-6 border border-border bg-card">
          <div className="grid grid-cols-[1.4fr_90px_90px_90px_140px] gap-2 px-4 py-2 border-b border-border bg-surface text-tiny font-mono uppercase tracking-widest text-muted-foreground">
            <span>Model</span>
            <span className="text-right">Params</span>
            <span className="text-right">OOD</span>
            <span className="text-right">In-dist</span>
            <span className="text-right">Decision</span>
          </div>
          {DISCOVERIES.map((d, i) => (
            <div
              key={d.size}
              className={`grid grid-cols-[1.4fr_90px_90px_90px_140px] gap-2 px-4 py-2 items-center text-sm ${i !== DISCOVERIES.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="text-foreground">
                {d.size}
                <span className="text-muted-foreground text-xs ml-2">· {d.note}</span>
              </span>
              <span className="font-mono tabular text-right text-xs">{d.params}M</span>
              <span className="font-mono tabular text-right text-xs">{d.ood.toFixed(4)}</span>
              <span className="font-mono tabular text-right text-xs">{d.inDist.toFixed(3)}</span>
              <span
                className="font-mono text-tiny uppercase tracking-widest text-right"
                style={{ color: DECISION_COLOR[d.decision] }}
              >
                {d.decision}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 6 · SCIENTIFIC CONCLUSIONS ────────────────────────────────────

const FINDINGS: { title: string; desc: string; verdict: "VALIDATED" | "REJECTED" }[] = [
  { title: "Smaller models generalize better", desc: "OOD top-1 improves as parameters drop from 25M → 1.37M.", verdict: "VALIDATED" },
  { title: "Description-init embeddings", desc: "Initializing from token descriptions hurt OOD by 0.018.", verdict: "REJECTED" },
  { title: "Cross-family data augmentation", desc: "Synthetic mixing degraded both OOD and in-distribution.", verdict: "REJECTED" },
  { title: "Weight-sharing at 1.37M", desc: "Tied transformer blocks lost 0.009 OOD top-1.", verdict: "REJECTED" },
  { title: "Constrained decoding", desc: "Hard masking did not improve measured downstream metrics.", verdict: "REJECTED" },
  { title: "Parameter reduction", desc: "The only lever that produced a measured OOD gain.", verdict: "VALIDATED" },
];

function Section6Conclusions() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-16 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 06 · Findings"
          title="What the system concluded."
          desc="Six measured conclusions from two rounds of search. Most popular tricks were rejected."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FINDINGS.map((f) => {
            const validated = f.verdict === "VALIDATED";
            const color = validated ? GREEN : RED;
            return (
              <Frame key={f.title} className="p-4 border-l-2" >
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ background: color }}
                />
                <div className="flex items-center justify-between">
                  <Kicker>{validated ? "Confirmed" : "Rejected"}</Kicker>
                  <span
                    className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5"
                    style={{ background: color, color: "#fff" }}
                  >
                    {f.verdict}
                  </span>
                </div>
                <div className="font-serif text-lg mt-2 leading-snug">{f.title}</div>
                <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{f.desc}</div>
              </Frame>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 7 · FINAL MODEL CARD ──────────────────────────────────────────

function FinalArchitecture() {
  const blocks = [
    { label: "Input Sequence", detail: "process tokens", color: "var(--border-strong)" },
    { label: "Tokenizer", detail: "202-vocab", color: BLUE },
    { label: "Embedding", detail: "d=192", color: BLUE },
    { label: "Decoder ×3", detail: "RoPE · SwiGLU · RMSNorm", color: ORANGE, big: true },
    { label: "RMSNorm", detail: "final norm", color: GREEN },
    { label: "LM Head", detail: "tied weights", color: BLUE },
    { label: "Top-5 Predictions", detail: "next process step", color: GREEN },
  ];

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className="bg-card border flex items-center"
          style={{
            borderColor: b.color,
            borderLeftWidth: b.big ? 3 : 1.5,
            padding: b.big ? "16px 16px" : "10px 14px",
          }}
        >
          <div className="flex-1">
            <div className="font-mono text-[12px] font-semibold uppercase tracking-wide">{b.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{b.detail}</div>
          </div>
          {b.big && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500">
              core
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Section7Final() {
  const stats: [string, string][] = [
    ["Params", "~3.04M"],
    ["Layers", "3"],
    ["Hidden", "192"],
    ["Heads", "4"],
    ["Vocab", "202"],
    ["Ctx", "256"],
    ["Position", "RoPE"],
    ["OOD top-1", "0.5120"],
  ];

  return (
    <section className="px-4 md:px-6 lg:px-8 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 07 · Final Model"
          title="The chosen architecture."
          desc="The model that emerged from the search — small, RoPE-positioned, tied embeddings."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <Frame className="p-6">
            <Kicker>Forward pass</Kicker>
            <div className="mt-4">
              <FinalArchitecture />
            </div>
          </Frame>

          <Frame className="p-6">
            <Kicker>Model card</Kicker>
            <div className="mt-4 grid grid-cols-2 gap-px bg-border border border-border">
              {stats.map(([k, v]) => (
                <div key={k} className="bg-card px-3 py-3">
                  <Kicker>{k}</Kicker>
                  <div className="font-mono text-base font-semibold tabular mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              8.4× smaller than V1 baseline · +0.017 OOD top-1 · matches in-distribution accuracy.
            </div>
          </Frame>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 8 · COMPLETE SYSTEM MAP ───────────────────────────────────────

function Section8SystemMap() {
  const stages = [
    { label: "RESEARCH GOAL", color: "var(--foreground)" },
    { label: "MULTI-AGENT DISCOVERY", color: BLUE },
    { label: "EXPERIMENT AGENT", color: ORANGE, highlight: true },
    { label: "ARCHITECTURE SEARCH", color: BLUE },
    { label: "BENCHMARKING", color: AMBER },
    { label: "FINAL SILICONGPT", color: GREEN },
    { label: "INFERENCE PLATFORM", color: BLUE },
    { label: "SEMICONDUCTOR PREDICTIONS", color: GREEN },
  ];

  return (
    <section className="px-4 md:px-6 lg:px-8 py-16 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          kicker="§ 08 · System Map"
          title="From research goal to production prediction."
          desc="The complete pipeline, end-to-end."
        />

        <Frame className="p-6">
          <div className="relative">
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full hidden md:block z-10"
              style={{ background: ORANGE, boxShadow: `0 0 12px ${ORANGE}` }}
              animate={{ left: ["1%", "99%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <div className="flex flex-col md:flex-row items-stretch gap-2">
              {stages.map((s, i) => (
                <div key={s.label} className="flex md:flex-1 items-center gap-2">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex-1 bg-background border px-3 py-4 text-center"
                    style={{
                      borderColor: s.highlight ? ORANGE : "var(--border-strong)",
                      borderWidth: s.highlight ? 2 : 1,
                      boxShadow: s.highlight ? `0 0 0 1px ${ORANGE}33` : "none",
                    }}
                  >
                    <Kicker>{`STEP ${String(i + 1).padStart(2, "0")}`}</Kicker>
                    <div
                      className="font-mono text-[11px] font-semibold uppercase tracking-wide mt-1 leading-snug"
                      style={{ color: s.color }}
                    >
                      {s.label}
                    </div>
                  </motion.div>
                  {i < stages.length - 1 && (
                    <span className="hidden md:block text-muted-foreground text-xs">▶</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Frame>

        <p className="text-center mt-6 font-mono text-tiny uppercase tracking-widest text-muted-foreground">
          SiliconGPT is not a transformer. It is the artifact of a measurement-grounded discovery system.
        </p>
      </div>
    </section>
  );
}

// ─── EXPORT ────────────────────────────────────────────────────────────────

export function DiscoveryArchitecture() {
  return (
    <div className="bg-background">
      <Section1Hero />
      <Section2Pipeline />
      <Section3Experiment />
      <Section4Interactions />
      <Section5Search />
      <Section6Conclusions />
      <Section7Final />
      <Section8SystemMap />
    </div>
  );
}
