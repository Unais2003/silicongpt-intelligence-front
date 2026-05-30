import { Panel, StatusDot } from "./primitives";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const TRAIN_FAMILIES = ["mosfet", "igbt", "ic"];

const HELDOUT = [
  { name: "IC family (held out)", acc: 0.497 },
];

const FOLDS = [
  { fold: "Train: mosfet+igbt", inDist: 81.5, outDist: 49.7 },
  { fold: "Test: IC (OOD)",     inDist: 0,    outDist: 49.7 },
];

export function OODDashboard() {
  return (
    <Panel
      title="Out-of-Distribution Generalization"
      meta={<span className="flex items-center gap-2"><StatusDot color="info" /> IC HELD OUT · train on mosfet+igbt · test IC</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            Training Families · 3 total
          </div>
          <div className="grid grid-cols-2 gap-px bg-border border border-border">
            {TRAIN_FAMILIES.map((f) => (
              <div key={f} className="bg-card px-2 py-1.5 flex items-center justify-between">
                <span className="font-mono text-xs">{f}</span>
                <StatusDot color="success" pulse={false} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            OOD Holdout · IC family · 4,000 sequences
          </div>
          <div className="border border-border">
            {HELDOUT.map((h, i) => (
              <div
                key={h.name}
                className={`flex items-center gap-3 px-3 py-2 ${i !== HELDOUT.length - 1 ? "border-b border-border" : ""}`}
              >
                <span className="font-mono text-xs flex-1">{h.name}</span>
                <div className="w-32 h-1.5 bg-border relative">
                  <div
                    className="absolute inset-y-0 bg-[var(--warning)]"
                    style={{ width: `${h.acc * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs tabular w-12 text-right">
                  {(h.acc * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-tiny font-mono text-muted-foreground leading-relaxed">
            OOD next-step top-1 <span className="text-foreground">~49.7%</span> · random baseline
            <span className="text-foreground"> 0.5%</span> (1/202 tokens). No family label given to
            the model — must generalize from sequence structure alone.
          </div>
        </div>

        <div>
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            Cross-Family Evaluation
          </div>
          <div className="border border-border p-2 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FOLDS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="fold" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="var(--color-border-strong)" />
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="var(--color-border-strong)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: 2,
                    fontFamily: "JetBrains Mono",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="inDist" fill="var(--color-primary)" name="In-Dist" />
                <Bar dataKey="outDist" fill="var(--warning)" name="OOD" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-tiny font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-primary" /> In-Distribution</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[var(--warning)]" /> Held-out</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
