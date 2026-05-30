import { Panel, Metric } from "./primitives";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const spark = (seed: number) =>
  Array.from({ length: 24 }).map((_, i) => ({
    x: i,
    y: 50 + Math.sin(i / 2 + seed) * 8 + (i / 24) * (seed * 3),
  }));

function Spark({ data, color }: { data: { x: number; y: number }[]; color: string }) {
  return (
    <div className="h-10 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="y" stroke={color} strokeWidth={1.5} fill={`url(#g-${color})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const metrics = [
  { label: "Top-1 Accuracy", value: "80.7", suffix: "%", delta: "+2.4 vs prev checkpoint", tone: "default" as const, color: "var(--primary)", spark: spark(1) },
  { label: "Top-5 Accuracy", value: "100.0", suffix: "%", delta: "saturated · 3 families", tone: "success" as const, color: "oklch(0.6 0.16 150)", spark: spark(2) },
  { label: "OOD Accuracy", value: "49.5", suffix: "%", delta: "held-out · IC family", tone: "warning" as const, color: "oklch(0.72 0.16 75)", spark: spark(0.5) },
  { label: "Completion Validity", value: "99.7", suffix: "%", delta: "constraint-checked", tone: "success" as const, color: "oklch(0.6 0.16 150)", spark: spark(3) },
  { label: "ROC-AUC", value: "0.997", suffix: "", delta: "binary process validity", tone: "default" as const, color: "var(--primary)", spark: spark(4) },
];

export function LiveMetrics() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-t border-border">
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className={`p-5 border-r border-border last:border-r-0 ${i >= 3 ? "lg:border-r" : ""}`}
        >
          <Metric label={m.label} value={m.value} suffix={m.suffix} delta={m.delta} tone={m.tone} />
          <div className="mt-3">
            <Spark data={m.spark} color={m.color} />
          </div>
        </div>
      ))}
    </section>
  );
}
