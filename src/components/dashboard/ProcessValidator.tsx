import { Panel, StatusDot } from "./primitives";

const CONSTRAINTS = [
  { id: "C-01", rule: "Resist must precede etch", status: "pass", count: 8412 },
  { id: "C-02", rule: "Wet clean follows ash strip", status: "pass", count: 8412 },
  { id: "C-03", rule: "Implant requires prior oxide cap", status: "pass", count: 8378 },
  { id: "C-04", rule: "Anneal temp ≤ 1100°C post-metal", status: "pass", count: 8401 },
  { id: "C-05", rule: "CMP only after dielectric deposit", status: "pass", count: 8410 },
  { id: "C-06", rule: "Photo step requires DI rinse", status: "warn", count: 8294 },
  { id: "C-07", rule: "No metal before STI fill", status: "pass", count: 8412 },
  { id: "C-08", rule: "Stoichiometry-balanced gas mix", status: "pass", count: 8409 },
];

export function ProcessValidator() {
  const passed = CONSTRAINTS.filter((c) => c.status === "pass").length;

  return (
    <Panel
      title="Process Validator · Manufacturing Constraints"
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> 99.7% VALID · 8 RULES</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="border border-border">
            <div className="grid grid-cols-[60px_1fr_80px_70px] gap-2 px-3 py-2 border-b border-border bg-surface text-tiny font-mono uppercase text-muted-foreground">
              <span>ID</span><span>Constraint</span><span className="text-right">Pass</span><span className="text-right">Status</span>
            </div>
            {CONSTRAINTS.map((c, i) => (
              <div
                key={c.id}
                className={`grid grid-cols-[60px_1fr_80px_70px] gap-2 px-3 py-2 items-center ${
                  i !== CONSTRAINTS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                <span className="text-sm">{c.rule}</span>
                <span className="font-mono text-xs tabular text-right text-muted-foreground">
                  {c.count.toLocaleString()}
                </span>
                <span className="flex items-center justify-end gap-1.5">
                  <StatusDot color={c.status === "pass" ? "success" : "warning"} pulse={false} />
                  <span className="font-mono text-tiny uppercase">{c.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-foreground p-4">
            <div className="text-tiny font-mono uppercase text-muted-foreground">Aggregate Validity</div>
            <div className="font-mono text-5xl font-semibold tabular mt-1">99.7%</div>
            <div className="mt-2 text-tiny font-mono text-muted-foreground">
              {passed}/{CONSTRAINTS.length} rules at perfect compliance · 1 soft-warning under p&lt;0.5%
            </div>
          </div>

          <div className="border border-border p-4">
            <div className="text-tiny font-mono uppercase text-muted-foreground">Violation Type Distribution</div>
            <div className="mt-3 space-y-2">
              {[
                { l: "Ordering", v: 0.18 },
                { l: "Thermal Budget", v: 0.08 },
                { l: "Chemical Compat", v: 0.04 },
                { l: "Missing Cleanup", v: 0.01 },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-tiny font-mono">
                    <span>{r.l}</span>
                    <span className="text-muted-foreground tabular">{r.v.toFixed(2)}%</span>
                  </div>
                  <div className="h-1 bg-border relative mt-1">
                    <div className="absolute inset-y-0 bg-foreground" style={{ width: `${r.v * 200}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
