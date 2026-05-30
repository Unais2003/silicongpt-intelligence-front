type NodeAccent =
  | "config"
  | "supervisor"
  | "agent"
  | "experiment"
  | "final";

const ACCENT: Record<NodeAccent, string> = {
  config: "border-emerald-600 bg-emerald-950/20",
  supervisor: "border-border-strong bg-surface font-semibold",
  agent: "border-border bg-card",
  experiment: "border-amber-500 border-2 bg-amber-950/20",
  final: "border-blue-600 bg-blue-950/20",
};

type AgentNode = {
  n: string;
  label: string;
  glyph: string;
  detail: string;
  accent: NodeAccent;
  badge?: string;
};

const NODES: AgentNode[] = [
  {
    n: "0",
    label: "CONFIG",
    glyph: "⚙",
    accent: "config",
    detail:
      "Research goal + evaluation rubric — the one knob that retargets the engine",
  },
  {
    n: "1",
    label: "SUPERVISOR",
    glyph: "⬡",
    accent: "supervisor",
    detail: "Orchestrates each round · assigns agents · decides when to stop",
  },
  {
    n: "2",
    label: "GENERATION",
    glyph: "💡",
    accent: "agent",
    detail:
      "Proposes novel, testable hypotheses grounded in literature + prior lessons",
  },
  {
    n: "3",
    label: "REFLECTION",
    glyph: "🔍",
    accent: "agent",
    detail:
      "Peer-reviews each idea · filters flawed/non-novel · triages: config-expressible vs needs-code",
  },
  {
    n: "4",
    label: "EXPERIMENT",
    glyph: "🧪",
    accent: "experiment",
    badge: "NEW",
    detail:
      "Trains + benchmarks each idea on GPU — smoke run → full 3-fold OOD on A100 — writes a measured result record",
  },
  {
    n: "5",
    label: "PROXIMITY",
    glyph: "⬡",
    accent: "agent",
    detail:
      "Clusters and de-duplicates hypotheses so the tournament doesn't re-test the same idea",
  },
  {
    n: "6",
    label: "RANKING",
    glyph: "🏆",
    accent: "agent",
    detail: "Elo tournament · pairwise debates · measured > simulated > reasoned",
  },
  {
    n: "7",
    label: "EVOLUTION",
    glyph: "🧬",
    accent: "agent",
    detail: "Combines + refines the top-ranked ideas into brand-new hypotheses",
  },
  {
    n: "8",
    label: "META-REVIEW",
    glyph: "📝",
    accent: "agent",
    detail:
      "Synthesizes each round's lessons · fed back into every agent next round ('learning without back-propagation')",
  },
  {
    n: "9",
    label: "FINAL OUTPUT",
    glyph: "🎯",
    accent: "final",
    detail: "Ranked hypothesis board + research overview + chosen architecture",
  },
];

function Node({ node }: { node: AgentNode }) {
  return (
    <div
      className={`relative w-full max-w-md px-4 py-3 border ${ACCENT[node.accent]} flex items-start gap-3`}
    >
      <div className="text-lg leading-none mt-0.5">{node.glyph}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
            {node.n.padStart(2, "0")}
          </span>
          <span className="font-medium text-sm text-foreground">
            {node.label}
          </span>
          {node.badge && (
            <span className="bg-amber-500 text-black font-mono text-[10px] px-1.5 py-0.5 uppercase">
              {node.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed mt-1">
          {node.detail}
        </div>
      </div>
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center text-muted-foreground py-1">
      <div className="text-sm leading-none">▼</div>
      {label && (
        <div className="font-mono text-tiny uppercase tracking-widest mt-1">
          {label}
        </div>
      )}
    </div>
  );
}

function ForkBetweenReflectionAndExperiment() {
  return (
    <div className="w-full max-w-md flex items-stretch gap-3 py-2 text-muted-foreground">
      <div className="flex-1 flex flex-col items-center">
        <div className="text-sm leading-none">▼</div>
        <div className="font-mono text-tiny uppercase tracking-widest mt-1 text-center">
          config-expressible
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <div className="text-sm leading-none">▼</div>
        <div className="font-mono text-tiny uppercase tracking-widest mt-1 text-center">
          needs new code
        </div>
        <div className="mt-2 px-2 py-1 border border-border bg-card font-mono text-tiny uppercase tracking-widest text-foreground">
          BUILD KNOB
        </div>
        <div className="text-sm leading-none mt-1">▼</div>
      </div>
    </div>
  );
}

function MainPipeline() {
  return (
    <div className="relative flex flex-col items-center">
      {/* Feedback loop dashed line on the left */}
      <div
        className="hidden md:flex absolute top-[12%] bottom-[12%] left-2 lg:left-6 flex-col items-center pointer-events-none"
        aria-hidden
      >
        <div className="text-muted-foreground text-sm leading-none">▲</div>
        <div className="flex-1 border-l border-dashed border-border-strong" />
        <div className="mt-2 -ml-4 lg:-ml-2 rotate-[-90deg] font-mono text-tiny uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          next round · meta-review feeds every agent
        </div>
      </div>

      {NODES.slice(0, 4).map((node, i) => (
        <div key={node.n} className="w-full flex flex-col items-center">
          <Node node={node} />
          {i < 3 && <Arrow />}
        </div>
      ))}

      <ForkBetweenReflectionAndExperiment />

      {/* EXPERIMENT */}
      <Node node={NODES[4]} />
      <Arrow />
      <Node node={NODES[5]} />
      <Arrow />
      <Node node={NODES[6]} />
      <Arrow />
      <Node node={NODES[7]} />
      <Arrow />
      <Node node={NODES[8]} />
      <Arrow label="plateau / max rounds reached" />
      <Node node={NODES[9]} />
    </div>
  );
}

function TierLadder() {
  const tiers = [
    {
      tier: "TIER 0",
      label: "DEBATE",
      bg: "bg-emerald-950/30 border-emerald-700/60",
      lines: ["Every idea", "Free · reasoning only"],
    },
    {
      tier: "TIER 1",
      label: "SMOKE RUN",
      bg: "bg-amber-950/30 border-amber-700/60",
      lines: ["Shortlisted ideas", "Tiny/fast local train · cheap signal"],
    },
    {
      tier: "TIER 2",
      label: "FULL OOD",
      bg: "bg-orange-950/30 border-orange-700/60",
      lines: ["Finalists only", "3-fold OOD on A100 (Slurm)"],
      badge: "A100",
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-2">
        {tiers.map((t, i) => (
          <div key={t.tier} className="flex md:items-stretch md:flex-1 gap-2">
            <div
              className={`flex-1 px-3 py-3 border ${t.bg} flex flex-col`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
                    {t.tier}
                  </div>
                  <div className="font-medium text-sm text-foreground">
                    {t.label}
                  </div>
                </div>
                {t.badge && (
                  <span className="bg-orange-500 text-black font-mono text-[10px] px-1.5 py-0.5 uppercase">
                    {t.badge}
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-0.5">
                {t.lines.map((l) => (
                  <div
                    key={l}
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    {l}
                  </div>
                ))}
              </div>
              {i === 1 && (
                <div className="mt-3 pt-2 border-t border-dashed border-red-500/40 flex items-center gap-2">
                  <span className="text-red-500 text-xs">▼</span>
                  <span className="font-mono text-tiny uppercase tracking-widest text-red-500">
                    clearly bad
                  </span>
                  <span className="px-1.5 py-0.5 border border-red-500/60 bg-red-950/30 text-red-400 font-mono text-tiny uppercase">
                    DROPPED
                  </span>
                </div>
              )}
            </div>
            {i < tiers.length - 1 && (
              <div className="hidden md:flex items-center text-muted-foreground">
                ▶
              </div>
            )}
          </div>
        ))}
        <div className="hidden md:flex items-center text-muted-foreground">
          ▶
        </div>
        <div className="md:flex-1 px-3 py-3 border border-blue-700/60 bg-blue-950/30 flex flex-col">
          <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
            MEASURED RESULT
          </div>
          <div className="font-medium text-sm text-foreground">JSON</div>
          <div className="mt-2 space-y-0.5">
            <div className="text-xs text-muted-foreground leading-relaxed">
              → ingested into the Elo ranking board
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              measured &gt; simulated &gt; reasoned
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 font-mono text-tiny text-muted-foreground">
        GPU is the binding constraint. Ideas earn their way up the ladder — only
        finalists consume a full A100 run.
      </div>
    </div>
  );
}

type Verdict =
  | "WINNER"
  | "BEST ALL-AROUND"
  | "REJECTED"
  | "NEUTRAL"
  | "BASELINE"
  | "IN-DIST REGRESSION";

const VERDICT_COLOR: Record<Verdict, string> = {
  WINNER: "text-emerald-400",
  "BEST ALL-AROUND": "text-emerald-400",
  REJECTED: "text-red-400",
  NEUTRAL: "text-amber-400",
  "IN-DIST REGRESSION": "text-amber-400",
  BASELINE: "text-muted-foreground",
};

const RESULTS: {
  lever: string;
  ood: string;
  vs: string;
  verdict: Verdict;
  bold?: boolean;
}[] = [
  { lever: "Control — 25M baseline", ood: "0.4947", vs: "—", verdict: "BASELINE" },
  {
    lever: "Cross-family data augmentation",
    ood: "0.4767",
    vs: "−0.018",
    verdict: "REJECTED",
  },
  {
    lever: "NoPE (no positional encoding)",
    ood: "0.4983",
    vs: "+0.004",
    verdict: "NEUTRAL",
  },
  {
    lever: "Scale down to ~6M",
    ood: "0.5119",
    vs: "+0.017",
    verdict: "WINNER",
    bold: true,
  },
  {
    lever: "Scale ~3M (3L / 192-dim)",
    ood: "0.5120",
    vs: "+0.017",
    verdict: "BEST ALL-AROUND",
    bold: true,
  },
  {
    lever: "Scale 1.4M (3L / 128-dim)",
    ood: "0.5139",
    vs: "+0.019",
    verdict: "IN-DIST REGRESSION",
  },
  {
    lever: "Weight-sharing at 3M",
    ood: "0.5033",
    vs: "−0.009",
    verdict: "REJECTED",
  },
  {
    lever: "Description-init embeddings",
    ood: "—",
    vs: "−0.018",
    verdict: "REJECTED",
  },
];

function ResultsTable() {
  return (
    <div className="border border-border bg-card">
      <div className="px-3 py-2 border-b border-border bg-surface flex items-center justify-between">
        <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
          What the system discovered — 2 rounds
        </div>
      </div>
      <div className="grid grid-cols-[1fr_90px_90px_140px] gap-2 px-3 py-2 border-b border-border bg-surface/60 text-tiny font-mono uppercase tracking-widest text-muted-foreground">
        <span>Lever tested</span>
        <span className="text-right">OOD top-1</span>
        <span className="text-right">vs baseline</span>
        <span className="text-right">Verdict</span>
      </div>
      {RESULTS.map((r, i) => (
        <div
          key={r.lever}
          className={`grid grid-cols-[1fr_90px_90px_140px] gap-2 px-3 py-2 items-center text-sm ${
            i !== RESULTS.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <span className={r.bold ? "text-foreground font-medium" : "text-foreground"}>
            {r.lever}
          </span>
          <span
            className={`font-mono tabular text-right text-xs ${r.bold ? "text-foreground font-semibold" : "text-foreground"}`}
          >
            {r.ood}
          </span>
          <span
            className={`font-mono tabular text-right text-xs ${r.bold ? "text-foreground font-semibold" : "text-muted-foreground"}`}
          >
            {r.vs}
          </span>
          <span
            className={`font-mono text-tiny uppercase tracking-widest text-right ${VERDICT_COLOR[r.verdict]}`}
          >
            {r.verdict}
          </span>
        </div>
      ))}
    </div>
  );
}

function ArchitectureDiff() {
  const rows: { prop: string; before: string; after: string }[] = [
    { prop: "Size", before: "25M · 8L · d=512", after: "~3M · 3L · d=192" },
    { prop: "OOD top-1", before: "0.4947", after: "0.512 (+0.017)" },
    { prop: "In-dist top-1", before: "0.807", after: "~0.81" },
    { prop: "Augmentation", before: "—", after: "none (rejected)" },
    { prop: "Weight-sharing", before: "no", after: "no (rejected)" },
  ];
  return (
    <div className="border border-border bg-card">
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase tracking-widest text-muted-foreground">
        <span>Property</span>
        <span>Before (V1)</span>
        <span>After (Final)</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.prop}
          className={`grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-2 text-sm items-center ${
            i !== rows.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <span className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
            {r.prop}
          </span>
          <span className="text-muted-foreground text-xs font-mono tabular">
            {r.before}
          </span>
          <span className="text-foreground text-sm font-semibold font-mono tabular">
            {r.after}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CoScientistDiagram() {
  return (
    <div className="mt-6 space-y-10">
      {/* Panel 1 — Main pipeline */}
      <div className="border border-border bg-card p-6">
        <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground mb-4">
          Pipeline · 8 agents + supervisor + config
        </div>
        <MainPipeline />
      </div>

      {/* Panel 2 — Tier ladder */}
      <div className="border border-border bg-card p-6">
        <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground mb-4">
          Experiment agent · validation tiers
        </div>
        <TierLadder />
      </div>

      {/* Panel 3 — Results */}
      <div className="space-y-4">
        <ResultsTable />
        <ArchitectureDiff />
      </div>
    </div>
  );
}
