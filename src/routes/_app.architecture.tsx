import { createFileRoute } from "@tanstack/react-router";
import { ModelArchitecture } from "@/components/dashboard/ModelArchitecture";
import { ResearchFindings } from "@/components/dashboard/ResearchFindings";
import { SectionHeading, PageFooter, PageHeader } from "@/components/dashboard/layout";
import { Panel, Label } from "@/components/dashboard/primitives";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture & Research — SiliconGPT" },
      {
        name: "description",
        content:
          "How SiliconGPT works: synthetic data generation, process grammar, custom tokenization, decoder transformer, training pipeline, validation engine, and OOD evaluation.",
      },
      { property: "og:title", content: "Architecture & Research — SiliconGPT" },
      {
        property: "og:description",
        content:
          "Decoder-only transformer trained from scratch on a custom semiconductor process vocabulary.",
      },
    ],
  }),
  component: ArchitecturePage,
});

const pipeline = [
  {
    id: "01",
    title: "Synthetic Data Generation",
    desc: "120k wafer recipes synthesized from a process-grammar generator across 14 device families.",
    stat: "120,480 recipes",
  },
  {
    id: "02",
    title: "Process Grammar",
    desc: "Context-free grammar encoding fab-level rules: lithography precedes etch, anneal follows implant.",
    stat: "47 production rules",
  },
  {
    id: "03",
    title: "Tokenization",
    desc: "Byte-pair fusion over (step, equipment, parameter) tuples. No subword leakage across step boundaries.",
    stat: "218 tokens",
  },
  {
    id: "04",
    title: "Custom Vocabulary",
    desc: "Domain-specific tokens for LITH, ETCH, DIFF, CMP, IMPL, ANNL, plus parameterized variants.",
    stat: "12 step classes",
  },
  {
    id: "05",
    title: "Decoder Transformer",
    desc: "12 layers, 12 attention heads, d=768. RoPE positional encoding. SwiGLU MLPs. RMSNorm.",
    stat: "47.2M params",
  },
  {
    id: "06",
    title: "Training Pipeline",
    desc: "AdamW, cosine schedule, 128 epochs. Description-initialized embeddings for unseen families.",
    stat: "128 epochs · 2x A100",
  },
  {
    id: "07",
    title: "Validation Engine",
    desc: "SAT solver checks every decoded recipe against the production-rule grammar in <2ms.",
    stat: "99.7% validity",
  },
  {
    id: "08",
    title: "OOD Evaluation",
    desc: "6 held-out device families. Description-initialization recovers 49.5% Top-1 on unseen tech.",
    stat: "49.5% OOD Top-1",
  },
];

function PipelineDiagram() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-border border border-border">
      {pipeline.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.04 }}
          className="relative bg-card p-5 group"
        >
          <div className="absolute top-2 right-3 font-mono text-tiny text-muted-foreground">
            {p.id}
          </div>
          <div className="font-mono text-tiny uppercase tracking-widest text-primary mb-2">
            STAGE {p.id}
          </div>
          <h3 className="font-serif text-xl leading-tight mb-2">{p.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
          <div className="pt-3 border-t border-border">
            <Label>Output</Label>
            <div className="font-mono text-sm tabular mt-1">{p.stat}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const experiments = [
  { name: "Baseline (random init)", top1: "61.2%", ood: "18.4%", validity: "94.1%" },
  { name: "+ Process grammar loss", top1: "73.8%", ood: "27.1%", validity: "98.6%" },
  { name: "+ Description-init embeddings", top1: "79.4%", ood: "44.0%", validity: "99.3%" },
  { name: "+ SAT-guided decoding (final)", top1: "81.0%", ood: "49.5%", validity: "99.7%" },
];

function ExperimentTable() {
  return (
    <Panel title="ABLATION · v0.4 RUNS" meta="n=4 · seed-averaged">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">Configuration</th>
              <th className="text-right font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">Top-1</th>
              <th className="text-right font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">OOD Top-1</th>
              <th className="text-right font-mono text-tiny uppercase tracking-widest text-muted-foreground py-2">Validity</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((e, i) => (
              <tr key={e.name} className={`border-b border-border last:border-0 ${i === experiments.length - 1 ? "bg-accent/40" : ""}`}>
                <td className="py-2.5 text-sm">{e.name}</td>
                <td className="py-2.5 text-right font-mono tabular">{e.top1}</td>
                <td className="py-2.5 text-right font-mono tabular">{e.ood}</td>
                <td className="py-2.5 text-right font-mono tabular">{e.validity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ArchitecturePage() {
  return (
    <main className="flex-1">
      <PageHeader
        kicker="§ 03 · Architecture & Research"
        title="How SiliconGPT works."
        desc="A research paper transformed into software. Decoder-only transformer, custom vocabulary, SAT-guided decoding, evaluated on held-out fab families."
        status="MODEL CARD"
      />

      <div className="px-4 md:px-6 lg:px-8 py-8 space-y-10">
        <section>
          <SectionHeading
            kicker="§ Pipeline"
            title="Eight stages, end-to-end."
            desc="From grammar synthesis to SAT-guided decoding. Every stage is reproducible from the published config."
          />
          <PipelineDiagram />
        </section>

        <section>
          <SectionHeading
            kicker="§ Transformer"
            title="Decoder-only, trained from scratch."
            desc="A 12-layer, 12-head, 47.2M-parameter transformer over a 218-token process vocabulary. No pretraining, no foundation model."
          />
          <ModelArchitecture />
        </section>

        <section>
          <SectionHeading
            kicker="§ Results"
            title="Experimental ablation."
            desc="Each architectural addition compounds. SAT-guided decoding closes the validity gap; description-init drives OOD."
          />
          <ExperimentTable />
        </section>

        <section>
          <SectionHeading
            kicker="§ Findings"
            title="What we learned."
            desc="Four headline results from the v0.4 cycle."
          />
          <ResearchFindings />
        </section>
      </div>

      <PageFooter />
    </main>
  );
}
