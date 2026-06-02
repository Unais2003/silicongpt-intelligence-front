// ---------------------------------------------------------------------------
// Panel 1: Multi-agent discovery loop — SVG diagram with explicit connections.
// Mirrors the Google AI co-scientist reference layout, extended with our
// GPU Experiment Agent as a 7th specialist with explicit wiring to the
// Supervisor and the GPU Workers.
// ---------------------------------------------------------------------------
import agentOrchestration from "@/assets/agent_orchestration.png.asset.json";

const STROKE = "var(--border-strong)";
const STROKE_MUTED = "var(--border)";
const FILL_CARD = "var(--card)";
const FILL_SURFACE = "var(--surface)";
const FG = "var(--foreground)";
const MUTED = "var(--muted-foreground)";

const IO_FILL = "color-mix(in oklab, #3b82f6 12%, var(--card))";
const IO_STROKE = "#3b82f6";
const AMBER_FILL = "color-mix(in oklab, #f59e0b 14%, var(--card))";
const AMBER_STROKE = "#f59e0b";
const RED = "#ef4444";

function Box({
  x,
  y,
  w,
  h,
  fill = FILL_CARD,
  stroke = STROKE,
  strokeWidth = 1.5,
  dashed = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "4 3" : undefined}
      rx={2}
    />
  );
}

function Label({
  x,
  y,
  children,
  size = 12,
  weight = 500,
  color = FG,
  anchor = "middle",
  family,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  weight?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  family?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      fontFamily={family}
      dominantBaseline="middle"
    >
      {children}
    </text>
  );
}

function DiscoveryLoopDiagram() {
  // Top-row boxes
  const top = [
    { x: 20, w: 110, label: "Scientist", sub: "human-in-the-loop", tone: "ortho" },
    { x: 165, w: 115, label: "Research goal", sub: undefined, tone: "io" },
    { x: 315, w: 130, label: "Configuration", sub: "evaluation rubric", tone: "agent" },
    { x: 480, w: 150, label: "Supervisor agent", sub: "orchestrates rounds", tone: "ortho" },
    { x: 830, w: 230, label: "Research overview", sub: "ranked hypotheses + chosen architecture", tone: "io" },
  ] as const;

  const TOP_Y = 40;
  const TOP_H = 58;

  // Specialists box
  const SB = { x: 200, y: 165, w: 470, h: 415 };

  // 6 agent chips
  const cellW = 200;
  const cellH = 50;
  const colX = [SB.x + 16, SB.x + 16 + cellW + 22];
  const rowY = [SB.y + 50, SB.y + 50 + 70, SB.y + 50 + 140];
  const agents = [
    { col: 0, row: 0, label: "Generation", sub: "Propose novel hypotheses" },
    { col: 1, row: 0, label: "Proximity", sub: "Cluster / de-duplicate" },
    { col: 0, row: 1, label: "Reflection", sub: "Peer-review & triage" },
    { col: 1, row: 1, label: "Meta-review", sub: "Synthesize lessons" },
    { col: 0, row: 2, label: "Ranking", sub: "Elo tournament" },
    { col: 1, row: 2, label: "Evolution", sub: "Recombine top ideas" },
  ];

  // Experiment chip
  const EXP = { x: SB.x + 16, y: SB.y + 295, w: SB.w - 32, h: 100 };

  // Workers + Context Memory
  const WK = { x: 830, y: 165, w: 230, h: 200 };
  const CM = { x: 830, y: 395, w: 230, h: 70 };

  // Additional feedback
  const FB = { x: 20, y: 165, w: 130, h: 60 };

  return (
    <svg
      viewBox="0 0 1080 720"
      className="w-full h-auto"
      role="img"
      aria-label="Multi-agent discovery loop diagram"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={MUTED} />
        </marker>
        <marker
          id="arrow-red"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={RED} opacity="0.8" />
        </marker>
        <marker
          id="arrow-amber"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={AMBER_STROKE} />
        </marker>
      </defs>

      {/* ---------- TOP ROW BOXES ---------- */}
      {top.map((b) => {
        const isIO = b.tone === "io";
        const isOrtho = b.tone === "ortho";
        return (
          <g key={b.label}>
            <Box
              x={b.x}
              y={TOP_Y}
              w={b.w}
              h={TOP_H}
              fill={isIO ? IO_FILL : isOrtho ? FILL_SURFACE : FILL_CARD}
              stroke={isIO ? IO_STROKE : STROKE}
              strokeWidth={isOrtho ? 1.8 : 1.5}
            />
            <Label x={b.x + b.w / 2} y={TOP_Y + (b.sub ? 22 : TOP_H / 2)} size={12} weight={600}>
              {b.label}
            </Label>
            {b.sub && (
              <Label x={b.x + b.w / 2} y={TOP_Y + 40} size={10} weight={400} color={MUTED}>
                {b.sub}
              </Label>
            )}
          </g>
        );
      })}

      {/* ---------- TOP-ROW ARROWS ---------- */}
      {/* Scientist → Research goal */}
      <line x1={130} y1={TOP_Y + TOP_H / 2} x2={163} y2={TOP_Y + TOP_H / 2} stroke={MUTED} markerEnd="url(#arrow)" />
      {/* Research goal → Configuration */}
      <line x1={280} y1={TOP_Y + TOP_H / 2} x2={313} y2={TOP_Y + TOP_H / 2} stroke={MUTED} markerEnd="url(#arrow)" />
      {/* Configuration → Supervisor */}
      <line x1={445} y1={TOP_Y + TOP_H / 2} x2={478} y2={TOP_Y + TOP_H / 2} stroke={MUTED} markerEnd="url(#arrow)" />
      {/* Supervisor → Research overview (long top arrow with elbow over workers) */}
      <path
        d={`M 630 ${TOP_Y + TOP_H / 2} L 828 ${TOP_Y + TOP_H / 2}`}
        stroke={MUTED}
        fill="none"
        markerEnd="url(#arrow)"
      />

      {/* ---------- FEEDBACK LOOP (Research overview → Scientist) ---------- */}
      <path
        d={`M 945 ${TOP_Y} C 945 10, 75 10, 75 ${TOP_Y}`}
        stroke={MUTED}
        strokeDasharray="5 4"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <Label x={510} y={12} size={9} color={MUTED} family="ui-monospace, monospace">
        FEEDBACK · SCIENTIST REVIEWS &amp; RE-RUNS
      </Label>

      {/* ---------- ADDITIONAL FEEDBACK BOX ---------- */}
      <Box x={FB.x} y={FB.y} w={FB.w} h={FB.h} fill={IO_FILL} stroke={IO_STROKE} />
      <Label x={FB.x + FB.w / 2} y={FB.y + 22} size={11} weight={600}>
        Additional feedback
      </Label>
      <Label x={FB.x + FB.w / 2} y={FB.y + 40} size={10} color={MUTED}>
        from scientist
      </Label>

      {/* Scientist (bottom) → Additional feedback (top) */}
      <line x1={75} y1={TOP_Y + TOP_H} x2={75} y2={FB.y} stroke={MUTED} markerEnd="url(#arrow)" />
      {/* Additional feedback → Reflection chip (curve into specialists box) */}
      <path
        d={`M ${FB.x + FB.w} ${FB.y + FB.h / 2} C 175 195, 175 ${rowY[1] + cellH / 2}, ${colX[0]} ${rowY[1] + cellH / 2}`}
        stroke={MUTED}
        fill="none"
        markerEnd="url(#arrow)"
      />

      {/* ---------- SPECIALISTS BOX ---------- */}
      <Box x={SB.x} y={SB.y} w={SB.w} h={SB.h} fill="color-mix(in oklab, var(--surface) 60%, transparent)" stroke={STROKE} strokeWidth={1.8} />
      <Label x={SB.x + 16} y={SB.y + 18} anchor="start" size={10} color={MUTED} family="ui-monospace, monospace">
        AI CO-SCIENTIST · SPECIALIZED AGENTS
      </Label>

      {/* Supervisor → into specialists box (assign agents) */}
      <line
        x1={555}
        y1={TOP_Y + TOP_H}
        x2={555}
        y2={SB.y}
        stroke={MUTED}
        markerEnd="url(#arrow)"
      />
      <Label x={605} y={130} anchor="start" size={9} color={MUTED} family="ui-monospace, monospace">
        ASSIGN AGENTS TO WORKERS
      </Label>

      {/* 6 agent chips */}
      {agents.map((a) => {
        const x = colX[a.col];
        const y = rowY[a.row];
        return (
          <g key={a.label}>
            <Box x={x} y={y} w={cellW} h={cellH} fill={FILL_CARD} stroke={STROKE_MUTED} />
            <Label x={x + cellW / 2} y={y + 18} size={11} weight={600}>
              {a.label}
            </Label>
            <Label x={x + cellW / 2} y={y + 35} size={9} color={MUTED}>
              {a.sub}
            </Label>
          </g>
        );
      })}

      {/* Bidirectional arrows between specialists */}
      {/* Horizontal pairs */}
      {rowY.map((y) => (
        <g key={`h-${y}`}>
          <line
            x1={colX[0] + cellW + 2}
            y1={y + cellH / 2}
            x2={colX[1] - 2}
            y2={y + cellH / 2}
            stroke={RED}
            opacity="0.7"
            markerStart="url(#arrow-red)"
            markerEnd="url(#arrow-red)"
          />
        </g>
      ))}
      {/* Vertical pairs (between row 0-1 and 1-2 on both columns) */}
      {[0, 1].map((rowIdx) =>
        [0, 1].map((colIdx) => (
          <line
            key={`v-${rowIdx}-${colIdx}`}
            x1={colX[colIdx] + cellW / 2}
            y1={rowY[rowIdx] + cellH + 2}
            x2={colX[colIdx] + cellW / 2}
            y2={rowY[rowIdx + 1] - 2}
            stroke={RED}
            opacity="0.7"
            markerStart="url(#arrow-red)"
            markerEnd="url(#arrow-red)"
          />
        )),
      )}
      {/* Cross diagonals between rows 0↔1 and 1↔2 */}
      {[0, 1].map((rowIdx) => (
        <g key={`x-${rowIdx}`}>
          <line
            x1={colX[0] + cellW}
            y1={rowY[rowIdx] + cellH}
            x2={colX[1]}
            y2={rowY[rowIdx + 1]}
            stroke={RED}
            opacity="0.4"
          />
          <line
            x1={colX[1]}
            y1={rowY[rowIdx] + cellH}
            x2={colX[0] + cellW}
            y2={rowY[rowIdx + 1]}
            stroke={RED}
            opacity="0.4"
          />
        </g>
      ))}

      {/* Divider between specialists and Experiment */}
      <line
        x1={SB.x + 16}
        y1={EXP.y - 10}
        x2={SB.x + SB.w - 16}
        y2={EXP.y - 10}
        stroke={AMBER_STROKE}
        strokeDasharray="4 3"
        opacity="0.6"
      />
      <Label x={SB.x + 16} y={EXP.y - 20} anchor="start" size={9} color={AMBER_STROKE} family="ui-monospace, monospace">
        + OUR ADDITION · 7TH SPECIALIST
      </Label>

      {/* Experiment chip */}
      <Box x={EXP.x} y={EXP.y} w={EXP.w} h={EXP.h} fill={AMBER_FILL} stroke={AMBER_STROKE} strokeWidth={2} />
      <Label x={EXP.x + 14} y={EXP.y + 22} anchor="start" size={13} weight={700}>
        GPU Experiment Agent
      </Label>
      {/* NEW badge */}
      <rect x={EXP.x + 165} y={EXP.y + 12} width={32} height={16} fill={AMBER_STROKE} rx={1} />
      <Label x={EXP.x + 181} y={EXP.y + 21} size={9} weight={700} color="#000" family="ui-monospace, monospace">
        NEW
      </Label>
      <Label x={EXP.x + 14} y={EXP.y + 44} anchor="start" size={10} color={MUTED}>
        Trains + benchmarks each hypothesis on GPU.
      </Label>
      <Label x={EXP.x + 14} y={EXP.y + 60} anchor="start" size={10} color={MUTED}>
        Tier 0 debate → Tier 1 smoke run → Tier 2 full 3-fold OOD on A100.
      </Label>
      <Label x={EXP.x + 14} y={EXP.y + 76} anchor="start" size={10} color={MUTED}>
        Writes measured result JSON → ingested into Elo ranking.
      </Label>

      {/* ---------- WORKERS ---------- */}
      <Box x={WK.x} y={WK.y} w={WK.w} h={WK.h} fill={FILL_SURFACE} stroke={STROKE} strokeWidth={1.8} />
      <Label x={WK.x + 12} y={WK.y + 18} anchor="start" size={10} color={MUTED} family="ui-monospace, monospace">
        GPU WORKERS
      </Label>
      {[0, 1, 2, 3].map((i) => {
        const ry = WK.y + 34 + i * 40;
        return (
          <g key={i}>
            <line x1={WK.x + 8} y1={ry - 6} x2={WK.x + WK.w - 8} y2={ry - 6} stroke={STROKE_MUTED} />
            <Label x={WK.x + 14} y={ry + 8} anchor="start" size={11} weight={500}>
              Worker · A100
            </Label>
          </g>
        );
      })}

      {/* Specialists → Workers (dispatch) */}
      <line
        x1={SB.x + SB.w}
        y1={rowY[0] + cellH / 2}
        x2={WK.x}
        y2={WK.y + 50}
        stroke={MUTED}
        markerEnd="url(#arrow)"
      />
      <Label x={(SB.x + SB.w + WK.x) / 2} y={rowY[0] - 6} size={9} color={MUTED} family="ui-monospace, monospace">
        DISPATCH
      </Label>

      {/* Experiment → Workers (heavy amber line) */}
      <path
        d={`M ${EXP.x + EXP.w} ${EXP.y + 30} C 760 ${EXP.y + 30}, 780 ${WK.y + 140}, ${WK.x} ${WK.y + 140}`}
        stroke={AMBER_STROKE}
        strokeWidth={2}
        fill="none"
        markerEnd="url(#arrow-amber)"
      />
      <Label x={745} y={EXP.y + 10} size={9} color={AMBER_STROKE} family="ui-monospace, monospace">
        SMOKE · A100
      </Label>

      {/* Workers → Research overview (results emerge) */}
      <line
        x1={945}
        y1={WK.y}
        x2={945}
        y2={TOP_Y + TOP_H}
        stroke={MUTED}
        markerEnd="url(#arrow)"
      />
      <Label x={952} y={130} anchor="start" size={9} color={MUTED} family="ui-monospace, monospace">
        RESULTS
      </Label>

      {/* ---------- CONTEXT MEMORY ---------- */}
      <Box x={CM.x} y={CM.y} w={CM.w} h={CM.h} fill={FILL_SURFACE} stroke={STROKE} strokeWidth={1.8} />
      <Label x={CM.x + CM.w / 2} y={CM.y + 24} size={12} weight={600}>
        Context Memory
      </Label>
      <Label x={CM.x + CM.w / 2} y={CM.y + 44} size={10} color={MUTED}>
        measured results · round lessons
      </Label>

      {/* Workers → Context Memory (down) */}
      <line
        x1={945}
        y1={WK.y + WK.h}
        x2={945}
        y2={CM.y}
        stroke={MUTED}
        markerEnd="url(#arrow)"
      />

      {/* Context Memory ↔ Specialists (Meta-review/Evolution feedback) */}
      <path
        d={`M ${CM.x} ${CM.y + CM.h / 2} C 760 ${CM.y + CM.h / 2}, 720 ${rowY[2] + cellH / 2}, ${SB.x + SB.w} ${rowY[2] + cellH / 2}`}
        stroke={MUTED}
        fill="none"
        strokeDasharray="4 3"
        markerEnd="url(#arrow)"
      />
      <Label x={760} y={CM.y - 6} size={9} color={MUTED} family="ui-monospace, monospace">
        LESSONS → NEXT ROUND
      </Label>
    </svg>
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
        <img
          src={agentOrchestration.url}
          alt="SiliconGPT Co-Scientist Lab discovery loop: Supervisor orchestrating Generation, Reflection, Experiment, Proximity, Ranking, Evolution, and Meta-review agents across a tiered validation ladder."
          className="w-full h-auto"
          loading="lazy"
        />
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
