// ---------------------------------------------------------------------------
// Panel 1: Multi-agent discovery loop (2D block diagram)
// Mirrors the Google AI co-scientist reference layout, extended with our
// GPU Experiment Agent as a 7th specialist inside the same box.
// ---------------------------------------------------------------------------

function Chip({
  label,
  sub,
  tone = "agent",
  badge,
  className = "",
}: {
  label: string;
  sub?: string;
  tone?: "agent" | "io" | "orchestrator" | "experiment" | "feedback";
  badge?: string;
  className?: string;
}) {
  const toneCls = {
    agent: "border-border bg-card",
    io: "border-blue-600/60 bg-blue-950/20",
    orchestrator: "border-border-strong bg-surface",
    experiment: "border-amber-500 border-2 bg-amber-950/20",
    feedback: "border-blue-600/40 bg-blue-950/10",
  }[tone];
  return (
    <div className={`px-3 py-2 border ${toneCls} ${className}`}>
      <div className="flex items-center gap-2">
        <div className="font-medium text-xs text-foreground leading-tight">
          {label}
        </div>
        {badge && (
          <span className="bg-amber-500 text-black font-mono text-[9px] px-1 py-px uppercase">
            {badge}
          </span>
        )}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

const SPECIALIST_ROWS: { a: { label: string; sub: string }; b: { label: string; sub: string } }[] = [
  {
    a: { label: "Generation", sub: "Propose novel hypotheses" },
    b: { label: "Proximity", sub: "Cluster / de-duplicate" },
  },
  {
    a: { label: "Reflection", sub: "Peer-review & triage" },
    b: { label: "Meta-review", sub: "Synthesize round lessons" },
  },
  {
    a: { label: "Ranking", sub: "Elo tournament · pairwise" },
    b: { label: "Evolution", sub: "Recombine top ideas" },
  },
];

function SpecialistsBox() {
  return (
    <div className="border border-border-strong bg-card/40 p-4">
      <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground mb-3">
        AI co-scientist · specialized agents
      </div>

      <div className="space-y-1">
        {SPECIALIST_ROWS.map((row, i) => (
          <div key={row.a.label}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Chip label={row.a.label} sub={row.a.sub} />
              <div className="text-red-500/70 text-sm select-none text-center">⇄</div>
              <Chip label={row.b.label} sub={row.b.sub} />
            </div>
            {i < SPECIALIST_ROWS.length - 1 && (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1 text-red-500/60 text-sm">
                <span className="text-center">⇅</span>
                <span className="opacity-50">╳</span>
                <span className="text-center">⇅</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* GPU Experiment Agent — our addition */}
      <div className="mt-4 pt-4 border-t border-dashed border-amber-500/40">
        <div className="font-mono text-[9px] uppercase tracking-widest text-amber-500/80 mb-2">
          + our addition · 7th specialist
        </div>
        <Chip
          tone="experiment"
          badge="NEW"
          label="GPU Experiment Agent"
          sub="Trains + benchmarks each idea on GPU · smoke run → full 3-fold OOD on A100 · writes measured result to Context Memory"
        />
      </div>
    </div>
  );
}

function DiscoveryLoopDiagram() {
  return (
    <div className="space-y-4">
      {/* TOP ROW: Scientist → Research goal → Configuration → Supervisor → Research overview */}
      <div className="hidden lg:grid grid-cols-[auto_16px_auto_16px_auto_16px_auto_16px_1fr] items-center gap-1">
        <Chip tone="orchestrator" label="Scientist" sub="human-in-the-loop" />
        <span className="text-muted-foreground text-center">▶</span>
        <Chip tone="io" label="Research goal" />
        <span className="text-muted-foreground text-center">▶</span>
        <Chip tone="agent" label="Configuration" sub="evaluation rubric" />
        <span className="text-muted-foreground text-center">▶</span>
        <Chip tone="orchestrator" label="Supervisor agent" sub="orchestrates rounds" />
        <span className="text-muted-foreground text-center">▶</span>
        <Chip
          tone="io"
          label="Research overview"
          sub="ranked hypotheses + chosen architecture"
        />
      </div>

      {/* Feedback arc */}
      <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
        <span className="text-xs">◀</span>
        <div className="flex-1 border-t border-dashed border-border-strong" />
        <span className="font-mono text-[9px] uppercase tracking-widest">
          feedback loop · Scientist reviews & re-runs
        </span>
        <div className="flex-1 border-t border-dashed border-border-strong" />
      </div>

      {/* MIDDLE: feedback | specialists | workers */}
      <div className="hidden lg:grid grid-cols-[170px_24px_1fr_24px_180px] gap-2 items-stretch">
        <div className="flex flex-col justify-center">
          <Chip tone="feedback" label="Additional feedback" sub="from scientist" />
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-2 text-center">
            ─── feeds reflection ───▶
          </div>
        </div>
        <div className="flex items-center justify-center text-muted-foreground text-lg">▶</div>

        <div className="flex flex-col">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1 text-center">
            ▼ assign agents to workers
          </div>
          <SpecialistsBox />
        </div>

        <div className="flex flex-col items-center justify-around text-muted-foreground text-sm">
          <span>◀──▶</span>
          <span className="font-mono text-[9px] uppercase tracking-wider rotate-90 whitespace-nowrap">
            dispatch · results
          </span>
          <span>◀──▶</span>
        </div>

        <div className="flex flex-col gap-3 justify-between">
          <div className="border border-border-strong bg-surface">
            <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
              GPU workers
            </div>
            <div className="px-2 py-1 text-xs text-foreground">Worker · A100</div>
            <div className="px-2 py-1 text-xs text-foreground border-t border-border">Worker · A100</div>
            <div className="px-2 py-1 text-xs text-foreground border-t border-border">Worker · A100</div>
            <div className="px-2 py-1 text-xs text-foreground border-t border-border">Worker · A100</div>
          </div>
          <Chip
            tone="orchestrator"
            label="Context Memory"
            sub="measured results · round lessons"
          />
        </div>
      </div>

      {/* MOBILE / TABLET fallback — vertical stack */}
      <div className="lg:hidden flex flex-col items-stretch gap-2">
        <Chip tone="orchestrator" label="Scientist" sub="human-in-the-loop" />
        <div className="text-center text-muted-foreground text-xs">▼</div>
        <Chip tone="io" label="Research goal" />
        <div className="text-center text-muted-foreground text-xs">▼</div>
        <Chip tone="agent" label="Configuration" sub="evaluation rubric" />
        <div className="text-center text-muted-foreground text-xs">▼</div>
        <Chip tone="orchestrator" label="Supervisor agent" sub="assigns agents to workers" />
        <div className="text-center text-muted-foreground text-xs">▼</div>
        <Chip tone="feedback" label="Additional feedback" sub="from scientist · feeds reflection" />
        <div className="text-center text-muted-foreground text-xs">▼</div>
        <SpecialistsBox />
        <div className="text-center text-muted-foreground text-xs">▼ dispatch · results</div>
        <div className="border border-border-strong bg-surface">
          <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
            GPU workers
          </div>
          <div className="px-2 py-1 text-xs text-foreground">Worker · A100 × 4</div>
        </div>
        <Chip tone="orchestrator" label="Context Memory" sub="measured results · round lessons" />
        <div className="text-center text-muted-foreground text-xs">▼</div>
        <Chip tone="io" label="Research overview" sub="ranked hypotheses + chosen architecture" />
        <div className="text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground pt-1">
          ↻ feedback loop · scientist reviews & re-runs
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel 2: Experiment Agent · validation tiers
// ---------------------------------------------------------------------------

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
    { prop: "Size", before: "25M · 8L · d=512", after: "1.37M · 3L · d=192" },
    { prop: "OOD top-1", before: "0.4947", after: "0.5031 (+0.008, 3-seed mean)" },
    { prop: "In-dist top-1", before: "0.807", after: "0.811" },
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
      {/* Panel 1 — Multi-agent discovery loop */}
      <div className="border border-border bg-card p-6">
        <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground mb-4">
          Multi-agent discovery loop · 6 specialists + GPU Experiment Agent
        </div>
        <DiscoveryLoopDiagram />
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
