import { Panel, StatusDot } from "./primitives";
import { ModelLogo } from "./ModelLogo";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

type Row = {
  rank: number;
  name: string;
  org: string;
  top1: number;
  top5: number;
  ood: number | null;
  completion: number | null;
  anomalyF1: number | null;
  latency: number | null;
  us?: boolean;
};

// Real measured numbers (src/process_logic/score.py). Ours + n-gram = FULL held-out eval
// (n=3600 next-step / 600 completion / 1000 anomaly); frontier LLMs sampled on 200 examples (cost).
// OOD = held-out-family proxy (3-seed mean) — applies to our trained model only. "—" = not measured.
const MODELS: Row[] = [
  { rank: 1, name: "SiliconGPT",       org: "ours · 1.37M",           top1: 81.1, top5: 100.0, ood: 50.3, completion: 40.5, anomalyF1: 1.000, latency: 14,   us: true },
  { rank: 2, name: "N-gram (trigram)", org: "baseline · no params",   top1: 76.1, top5: 100.0, ood: null, completion: 28.3, anomalyF1: null,  latency: 1 },
  { rank: 3, name: "Gemini 3.5-flash", org: "Google · API",           top1: 55.5, top5: 78.0,  ood: null, completion: 7.6,  anomalyF1: 0.910, latency: null },
  { rank: 4, name: "GPT-5",            org: "OpenAI · API",           top1: 52.5, top5: 72.0,  ood: null, completion: null, anomalyF1: null,  latency: null },
  { rank: 5, name: "DeepSeek V3-0324", org: "DeepSeek · open weights", top1: 48.0, top5: 65.0,  ood: null, completion: 5.6,  anomalyF1: 0.603, latency: null },
  { rank: 6, name: "Qwen3.6-35B-A3B",  org: "Alibaba · open weights",  top1: 41.5, top5: 63.5,  ood: null, completion: 2.5,  anomalyF1: 0.690, latency: null },
];

// Each axis normalized to 0–100 (real measured values). OOD applies to our trained model
// only (LLMs aren't trained → 0). Completion = token-acc; Anomaly = F1.
const RADAR = [
  { axis: "Top-1",      SiliconGPT: 81,  Gemini: 56, DeepSeek: 48, Qwen: 42 },
  { axis: "Top-5",      SiliconGPT: 100, Gemini: 78, DeepSeek: 65, Qwen: 64 },
  { axis: "Completion", SiliconGPT: 41,  Gemini: 8,  DeepSeek: 6,  Qwen: 2 },
  { axis: "Anomaly F1", SiliconGPT: 100, Gemini: 91, DeepSeek: 60, Qwen: 69 },
  { axis: "OOD",        SiliconGPT: 50,  Gemini: 0,  DeepSeek: 0,  Qwen: 0 },
];

const RADAR_SERIES = [
  { key: "Qwen",       color: "#ec4899", fill: 0.06, sw: 1 },
  { key: "DeepSeek",   color: "#a855f7", fill: 0.06, sw: 1 },
  { key: "Gemini",     color: "#f59e0b", fill: 0.08, sw: 1 },
  { key: "SiliconGPT", color: "var(--color-primary)", fill: 0.25, sw: 1.5 },
];

export function BenchmarkRadar() {
  return (
    <Panel
      title="Hack_01 Process Logic · Radar"
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> 5 AXES · 4 MODELS</span>}
    >
      <div className="border border-border h-[320px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={RADAR}>
            <PolarGrid stroke="var(--color-grid)" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--color-muted-foreground)" }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            {RADAR_SERIES.map((s) => (
              <Radar key={s.key} dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={s.fill} strokeWidth={s.sw} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-tiny font-mono text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-primary" /> SiliconGPT</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ background: "#f59e0b" }} /> Gemini</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ background: "#a855f7" }} /> DeepSeek</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ background: "#ec4899" }} /> Qwen</span>
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
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> 6 SYSTEMS · 5,200 EVAL (ours, n-gram) · 200-SAMPLE (LLMs)</span>}
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
              <ModelLogo name={m.name} />
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
        <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">vs GEMINI · TOP-1</div><div className="font-mono text-lg tabular text-[var(--success)]">+25.6 pt</div></div>
        <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">API COST</div><div className="font-mono text-lg tabular">no cost vs Gemini</div></div>
        <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">ANOMALY F1</div><div className="font-mono text-lg tabular text-[var(--success)]">1.000</div></div>
      </div>
    </Panel>
  );
}
