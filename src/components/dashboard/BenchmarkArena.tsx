import { Panel, StatusDot } from "./primitives";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// Each axis normalized to 0–100 (real measured values, src/process_logic/score.py).
// OOD applies to our trained model only (LLMs aren't trained → 0). Completion = token-acc; Anomaly = F1.
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
