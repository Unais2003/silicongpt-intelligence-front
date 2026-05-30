import { Panel } from "./primitives";

const FINDINGS = [
  {
    tag: "F-01",
    title: "Description-initialized embeddings",
    body: "Seeding token embeddings with frozen natural-language descriptions of each process step lifts OOD accuracy from 31.2% → 49.5% with no change to architecture.",
    metric: "+18.3 pt",
    label: "OOD lift",
  },
  {
    tag: "F-02",
    title: "Held-out family generalization",
    body: "Across 6 device families never seen in training (GAA-3nm, SiC-MOSFET, MRAM, …), the model recovers 49.5% top-1 vs 7.1% random baseline.",
    metric: "7× random",
    label: "vs uniform",
  },
  {
    tag: "F-03",
    title: "Learned process grammar",
    body: "Probing attention heads reveals dedicated circuits for ordering, thermal-budget, and chemical-compat constraints — emerged without explicit supervision.",
    metric: "3 circuits",
    label: "identified",
  },
  {
    tag: "F-04",
    title: "Semiconductor reasoning",
    body: "Model rejects invalid prefixes (e.g. metal-before-STI) with 99.7% accuracy and produces calibrated probabilities (ROC-AUC 0.997) for process validity.",
    metric: "0.997",
    label: "ROC-AUC",
  },
];

export function ResearchFindings() {
  return (
    <Panel title="Research Findings" meta={<span>internal · v0.4 · 2026-Q2</span>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
        {FINDINGS.map((f) => (
          <div key={f.tag} className="bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-tiny font-mono text-muted-foreground">{f.tag}</span>
              <div className="text-right">
                <div className="font-mono text-lg tabular">{f.metric}</div>
                <div className="text-tiny font-mono uppercase text-muted-foreground">{f.label}</div>
              </div>
            </div>
            <h3 className="mt-3 font-serif text-2xl leading-tight">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
