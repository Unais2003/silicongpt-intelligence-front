import { Panel, StatusDot } from "./primitives";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const TRAIN_FAMILIES = [
  "CMOS-28nm", "FinFET-14nm", "DRAM-1Z", "NAND-128L", "BiCMOS",
  "SOI-22nm", "GaN-HEMT", "MEMS-Pressure", "Image-Sensor", "Power-IGBT",
  "RF-SiGe", "Photonics-SiN", "TSV-Stack", "eFlash-40nm",
];

const HELDOUT = [
  { name: "GAA-3nm", acc: 0.612 },
  { name: "3D-NAND-232L", acc: 0.547 },
  { name: "SiC-MOSFET", acc: 0.498 },
  { name: "Spintronic-MRAM", acc: 0.441 },
  { name: "Quantum-Cryo", acc: 0.395 },
  { name: "Neuromorphic-RRAM", acc: 0.477 },
];

const FOLDS = [
  { fold: "Fold-A", inDist: 81.2, outDist: 51.4 },
  { fold: "Fold-B", inDist: 80.4, outDist: 48.9 },
  { fold: "Fold-C", inDist: 81.5, outDist: 48.2 },
];

export function OODDashboard() {
  return (
    <Panel
      title="Out-of-Distribution Generalization"
      meta={<span className="flex items-center gap-2"><StatusDot color="info" /> 3-FOLD · held-out families</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            Training Distribution · 14 families
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
            Held-out Families · zero examples seen
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
            Mean OOD accuracy <span className="text-foreground">49.5%</span> · upper bound by
            random baseline <span className="text-foreground">7.1%</span>. Model recovers learned
            process grammar even on unseen device families.
          </div>
        </div>

        <div>
          <div className="text-tiny font-mono uppercase text-muted-foreground mb-2">
            3-Fold Cross-Family Evaluation
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
