import { Panel, StatusDot } from "./primitives";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

type Row = {
  rank: number;
  name: string;
  org: string;
  top1: number;
  top5: number;
  ood: number | null;
  completion: number;
  anomalyF1: number | null;
  latency: number;
  us?: boolean;
};

const MODELS: Row[] = [
  { rank: 1, name: "SiliconGPT",       org: "ours · 25.31M",        top1: 80.7, top5: 100.0, ood: 49.5, completion: 40.0, anomalyF1: 1.000, latency: 14,   us: true },
  { rank: 2, name: "N-gram (trigram)", org: "baseline · no params", top1: 76.1, top5: 100.0, ood: null, completion: 28.3, anomalyF1: null,  latency: 1 },
  { rank: 3, name: "Gemini 3.5-flash", org: "Google · API",         top1: 44.0, top5: 76.0,  ood: null, completion: 6.5,  anomalyF1: 0.842, latency: 2800 },
];

const RADAR = [
  { axis: "Top-1",      SiliconGPT: 81,  Frontier: 44 },
  { axis: "Top-5",      SiliconGPT: 100, Frontier: 76 },
  { axis: "OOD",        SiliconGPT: 50,  Frontier: 0 },
  { axis: "Validity",   SiliconGPT: 100, Frontier: 92 },
  { axis: "Anomaly F1", SiliconGPT: 100, Frontier: 84 },
  { axis: "Latency",    SiliconGPT: 95,  Frontier: 10 },
];

export function BenchmarkRadar() {
  return (
    <Panel
      title="Hack_01 Process Logic · Radar"
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> 6 AXES</span>}
    >
      <div className="border border-border h-[320px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={RADAR}>
            <PolarGrid stroke="var(--color-grid)" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--color-muted-foreground)" }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="Frontier" stroke="var(--color-muted-foreground)" fill="var(--color-muted-foreground)" fillOpacity={0.15} strokeWidth={1} />
            <Radar dataKey="SiliconGPT" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} strokeWidth={1.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 text-tiny font-mono text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-primary" /> SiliconGPT</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-muted-foreground" /> Gemini 3.5-flash</span>
      </div>
    </Panel>
  );
}

function num(v: number | null, fixed = 1, suffix = "") {
  if (v == null) return "—";
  return v.toFixed(fixed) + suffix;
}

export function BenchmarkArena() {
  return (
    <Panel
      title="Benchmark · Hack_01 Process Logic"
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> 3 SYSTEMS · 5,200 EXAMPLES</span>}
    >
      <div className="border border-border">
        <div className="grid grid-cols-[40px_1fr_70px_70px_70px_90px_80px] gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase text-muted-foreground">
          <span>#</span><span>System</span>
          <span className="text-right">Top-1</span>
          <span className="text-right">Top-5</span>
          <span className="text-right">OOD</span>
          <span className="text-right">Compl.</span>
          <span className="text-right">Anom. F1</span>
        </div>
        {MODELS.map((m, i) => (
          <div
            key={m.name}
            className={`grid grid-cols-[40px_1fr_70px_70px_70px_90px_80px] gap-2 px-3 py-2.5 items-center ${
              i !== MODELS.length - 1 ? "border-b border-border" : ""
            } ${m.us ? "bg-surface" : ""}`}
          >
            <span className="font-mono text-xs">{m.rank.toString().padStart(2, "0")}</span>
            <span className="flex items-center gap-2 text-sm">
              {m.us && <StatusDot color="success" />}
              <span className={m.us ? "font-semibold" : ""}>{m.name}</span>
              <span className="text-tiny font-mono text-muted-foreground">{m.org}</span>
              {m.us && <span className="text-tiny font-mono text-muted-foreground">SOTA</span>}
            </span>
            <span className="font-mono text-xs tabular text-right">{num(m.top1)}</span>
            <span className="font-mono text-xs tabular text-right">{num(m.top5)}</span>
            <span className="font-mono text-xs tabular text-right">{num(m.ood)}</span>
            <span className="font-mono text-xs tabular text-right">{num(m.completion)}</span>
            <span className="font-mono text-xs tabular text-right">{num(m.anomalyF1, 3)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-px bg-border border border-border">
        <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">vs GEMINI · TOP-1</div><div className="font-mono text-lg tabular text-[var(--success)]">+36.7 pt</div></div>
        <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">API COST</div><div className="font-mono text-lg tabular">no cost vs Gemini</div></div>
        <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">ANOMALY F1</div><div className="font-mono text-lg tabular text-[var(--success)]">1.000</div></div>
      </div>
    </Panel>
  );
}
