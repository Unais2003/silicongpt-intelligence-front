import { createFileRoute } from "@tanstack/react-router";

import { ModelArchitecture } from "@/components/dashboard/ModelArchitecture";
import { PageFooter, PageHeader } from "@/components/dashboard/layout";
import { Panel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_app/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — SiliconGPT" },
      {
        name: "description",
        content:
          "SiliconGPT model architecture: 8-layer decoder-only transformer with tied embeddings, RoPE, SwiGLU, and RMSNorm, trained on a 202-token semiconductor process vocabulary.",
      },
      { property: "og:title", content: "Architecture — SiliconGPT" },
      {
        property: "og:description",
        content:
          "Decoder-only transformer · 25.31M params · 8L · d=512 · vocab 202 · ctx 256.",
      },
    ],
  }),
  component: ArchitecturePage,
});

// ----- RESULTS ------------------------------------------------------------

const TASK1_ROWS: Array<{ family: string; top1: string; top3: string; top5: string; mrr: string; bold?: boolean }> = [
  { family: "ALL", top1: "0.807", top3: "0.997", top5: "1.000", mrr: "0.901", bold: true },
  { family: "mosfet", top1: "0.812", top3: "0.996", top5: "1.000", mrr: "0.904" },
  { family: "igbt", top1: "0.821", top3: "0.998", top5: "1.000", mrr: "0.909" },
  { family: "ic", top1: "0.789", top3: "0.996", top5: "0.999", mrr: "0.891" },
];

function Task1Panel() {
  return (
    <Panel title="TASK 1 · NEXT-STEP" meta="n = 3,600">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">Family</th>
              <th className="text-right font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">Top-1</th>
              <th className="text-right font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">Top-3</th>
              <th className="text-right font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">Top-5</th>
              <th className="text-right font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">MRR</th>
            </tr>
          </thead>
          <tbody>
            {TASK1_ROWS.map((r) => (
              <tr
                key={r.family}
                className={`border-b border-border last:border-0 ${r.bold ? "bg-accent/40 font-semibold" : ""}`}
              >
                <td className="py-2.5 font-mono text-sm uppercase">{r.family}</td>
                <td className="py-2.5 text-right font-mono tabular">{r.top1}</td>
                <td className="py-2.5 text-right font-mono tabular">{r.top3}</td>
                <td className="py-2.5 text-right font-mono tabular">{r.top5}</td>
                <td className="py-2.5 text-right font-mono tabular">{r.mrr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Task3Panel() {
  const metrics = [
    { label: "F1", value: "1.000" },
    { label: "ROC-AUC", value: "0.997" },
    { label: "Rule Attribution", value: "1.000" },
  ];
  return (
    <Panel title="TASK 3 · ANOMALY" meta="n = 1,000">
      <div className="grid grid-cols-3 gap-px bg-border border border-border">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card p-4 flex flex-col items-center justify-center">
            <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground mb-1">
              {m.label}
            </div>
            <div className="font-mono text-3xl tabular">{m.value}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ArchitecturePage() {
  return (
    <main className="flex-1">
      <PageHeader
        kicker="§ 03 · Architecture"
        title="The model, in one diagram."
        desc="Decoder-only transformer trained from scratch on a 202-token semiconductor process vocabulary. 8 layers, 512-dim, 8 heads, tied embeddings."
        status="MODEL CARD"
      />

      <div className="px-4 md:px-6 lg:px-8 py-12">
        <ModelArchitecture />
      </div>


      <PageFooter />
    </main>
  );
}
