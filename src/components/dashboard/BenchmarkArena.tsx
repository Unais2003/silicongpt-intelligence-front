import { Panel, StatusDot } from "./primitives";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const MODELS = [
  { rank: 1, name: "SiliconGPT",  params: "47M",    top1: 81.0, top5: 100.0, ood: 49.5, valid: 99.7, us: true },
  { rank: 2, name: "GPT-5",       params: "—",      top1: 38.4, top5: 71.2,  ood: 22.1, valid: 64.0 },
  { rank: 3, name: "Claude 4.5",  params: "—",      top1: 36.1, top5: 68.4,  ood: 21.8, valid: 61.2 },
  { rank: 4, name: "Gemini 2.5",  params: "—",      top1: 33.8, top5: 64.0,  ood: 19.4, valid: 58.7 },
  { rank: 5, name: "Kimi K2",     params: "—",      top1: 31.0, top5: 60.5,  ood: 17.1, valid: 55.3 },
];

const RADAR = [
  { axis: "Top-1",     SiliconGPT: 81,  Frontier: 35 },
  { axis: "Top-5",     SiliconGPT: 100, Frontier: 66 },
  { axis: "OOD",       SiliconGPT: 49,  Frontier: 20 },
  { axis: "Validity",  SiliconGPT: 99,  Frontier: 60 },
  { axis: "Grammar",   SiliconGPT: 96,  Frontier: 41 },
  { axis: "Latency",   SiliconGPT: 92,  Frontier: 38 },
];

export function BenchmarkArena() {
  return (
    <Panel
      title="Benchmark Arena · WaferBench v0.4"
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> 5 SYSTEMS · 8,412 PROMPTS</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="border border-border">
            <div className="grid grid-cols-[40px_1fr_70px_70px_70px_70px_70px] gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase text-muted-foreground">
              <span>#</span><span>System</span><span className="text-right">Params</span>
              <span className="text-right">Top-1</span><span className="text-right">Top-5</span>
              <span className="text-right">OOD</span><span className="text-right">Valid</span>
            </div>
            {MODELS.map((m, i) => (
              <div
                key={m.name}
                className={`grid grid-cols-[40px_1fr_70px_70px_70px_70px_70px] gap-2 px-3 py-2.5 items-center ${
                  i !== MODELS.length - 1 ? "border-b border-border" : ""
                } ${m.us ? "bg-surface" : ""}`}
              >
                <span className="font-mono text-xs">{m.rank.toString().padStart(2, "0")}</span>
                <span className="flex items-center gap-2 text-sm">
                  {m.us && <StatusDot color="success" />}
                  <span className={m.us ? "font-semibold" : ""}>{m.name}</span>
                  {m.us && <span className="text-tiny font-mono text-muted-foreground">SOTA</span>}
                </span>
                <span className="font-mono text-xs tabular text-right text-muted-foreground">{m.params}</span>
                <span className="font-mono text-xs tabular text-right">{m.top1.toFixed(1)}</span>
                <span className="font-mono text-xs tabular text-right">{m.top5.toFixed(1)}</span>
                <span className="font-mono text-xs tabular text-right">{m.ood.toFixed(1)}</span>
                <span className="font-mono text-xs tabular text-right">{m.valid.toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-px bg-border border border-border">
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">DELTA vs FRONTIER</div><div className="font-mono text-lg tabular text-[var(--success)]">+42.6 pt</div></div>
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">PARAMS RATIO</div><div className="font-mono text-lg tabular">1 : 4,000+</div></div>
            <div className="bg-card p-2"><div className="text-tiny font-mono text-muted-foreground">COST / 1M TOKENS</div><div className="font-mono text-lg tabular">$0.04</div></div>
          </div>
        </div>

        <div className="lg:col-span-2">
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
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-muted-foreground" /> Frontier Avg</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
