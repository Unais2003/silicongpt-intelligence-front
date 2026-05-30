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

type Stage = {
  id: string;
  title: string;
  desc: string;
  stat: string;
  io: { in: string; out: string };
  visual: (props: { className?: string }) => React.ReactElement;
};

const V = {
  Wafer: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      <defs>
        <pattern id="dies" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect x="0.5" y="0.5" width="13" height="13" fill="none" stroke="currentColor" strokeOpacity="0.25" />
        </pattern>
      </defs>
      <circle cx="100" cy="70" r="58" fill="hsl(var(--surface))" stroke="currentColor" strokeOpacity="0.5" />
      <circle cx="100" cy="70" r="58" fill="url(#dies)" />
      <line x1="42" y1="115" x2="158" y2="25" stroke="currentColor" strokeOpacity="0.4" strokeDasharray="2 3" />
      <text x="100" y="135" textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.6">300mm · 14 families</text>
    </svg>
  ),
  Grammar: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      {["M100 20 L60 55","M100 20 L140 55","M60 55 L35 95","M60 55 L85 95","M140 55 L115 95","M140 55 L165 95"].map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeOpacity="0.45" fill="none" />
      ))}
      {[[100,20,"S"],[60,55,"LITH"],[140,55,"ETCH"],[35,95,"DUV"],[85,95,"EUV"],[115,95,"DRY"],[165,95,"WET"]].map(([x,y,t], i) => (
        <g key={i}>
          <rect x={(x as number)-16} y={(y as number)-8} width="32" height="16" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.6" />
          <text x={x as number} y={(y as number)+3} textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="currentColor">{t}</text>
        </g>
      ))}
    </svg>
  ),
  Tokens: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="currentColor" /></marker></defs>
      <text x="10" y="22" fontSize="8" fontFamily="ui-monospace" fill="currentColor" opacity="0.5">raw recipe</text>
      <text x="10" y="38" fontSize="9" fontFamily="ui-monospace" fill="currentColor">LITH(EUV,193nm) → ETCH(Cl2)</text>
      <path d="M100 50 L100 70" stroke="currentColor" strokeOpacity="0.5" markerEnd="url(#arr)" />
      {["LITH","‹EUV›","193","→","ETCH","‹Cl2›"].map((t, i) => (
        <g key={i}>
          <rect x={10 + i * 31} y="80" width="28" height="18" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary))" strokeOpacity="0.6" />
          <text x={24 + i * 31} y="92" textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="currentColor">{t}</text>
        </g>
      ))}
      <text x="10" y="118" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.6">218 tokens · no subword leakage</text>
    </svg>
  ),
  Vocab: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      {["LITH","ETCH","DIFF","CMP","IMPL","ANNL","DEPO","CLEAN","METR","TEST","PKG","DICE"].map((t, i) => {
        const x = 12 + (i % 4) * 46;
        const y = 18 + Math.floor(i / 4) * 36;
        return (
          <g key={t}>
            <rect x={x} y={y} width="40" height="26" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.45" />
            <text x={x + 20} y={y + 16} textAnchor="middle" fontSize="8" fontFamily="ui-monospace" fill="currentColor">{t}</text>
          </g>
        );
      })}
      <text x="100" y="134" textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.6">12 step classes · parameterized</text>
    </svg>
  ),
  Transformer: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i}>
          <rect x="40" y={8 + i * 9} width="120" height="7" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary))" strokeOpacity={0.3 + (i / 12) * 0.5} />
          <text x="46" y={14 + i * 9} fontSize="5" fontFamily="ui-monospace" fill="currentColor" opacity="0.7">L{String(i + 1).padStart(2, "0")} · attn · mlp</text>
        </g>
      ))}
      <text x="100" y="132" textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.6">12L · 12H · d=768 · RoPE · SwiGLU</text>
    </svg>
  ),
  Training: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      <line x1="20" y1="110" x2="190" y2="110" stroke="currentColor" strokeOpacity="0.3" />
      <line x1="20" y1="20" x2="20" y2="110" stroke="currentColor" strokeOpacity="0.3" />
      <path d="M20 30 Q40 90 80 95 T180 105" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M20 35 Q40 95 80 100 T180 108" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 2" />
      <text x="22" y="18" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.7">loss</text>
      <text x="170" y="124" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.7">epoch</text>
      <text x="100" y="55" fontSize="7" fontFamily="ui-monospace" fill="hsl(var(--primary))">train</text>
      <text x="100" y="72" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.5">val</text>
    </svg>
  ),
  SAT: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      {[["LITH → ETCH",true],["IMPL → ANNL",true],["CMP after DEPO",true],["ETCH before LITH",false],["DIFF in vacuum",true]].map(([rule, ok], i) => (
        <g key={i}>
          <rect x="14" y={12 + i * 22} width="172" height="16" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.3" />
          <text x="22" y={23 + i * 22} fontSize="8" fontFamily="ui-monospace" fill="currentColor">{rule as string}</text>
          <text x="178" y={23 + i * 22} textAnchor="end" fontSize="8" fontFamily="ui-monospace" fill={(ok as boolean) ? "hsl(var(--success))" : "hsl(var(--destructive))"}>
            {(ok as boolean) ? "SAT" : "UNSAT"}
          </text>
        </g>
      ))}
    </svg>
  ),
  OOD: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 200 140" className={className}>
      {[1, 2, 3, 4].map((r) => (
        <polygon key={r} points={[0,1,2,3,4,5].map((i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          return `${100 + Math.cos(a) * r * 14},${70 + Math.sin(a) * r * 14}`;
        }).join(" ")} fill="none" stroke="currentColor" strokeOpacity="0.25" />
      ))}
      <polygon points={[0.85,0.7,0.6,0.5,0.55,0.75].map((v, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return `${100 + Math.cos(a) * v * 56},${70 + Math.sin(a) * v * 56}`;
      }).join(" ")} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="1.2" />
      {["FinFET","GAA-2nm","SiC","SiGe","GaN","RF"].map((t, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return <text key={t} x={100 + Math.cos(a) * 66} y={72 + Math.sin(a) * 66} textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="currentColor" opacity="0.7">{t}</text>;
      })}
    </svg>
  ),
};

const pipeline: Stage[] = [
  { id: "01", title: "Synthetic Data Generation", desc: "120k wafer recipes synthesized from a process-grammar generator across 14 device families.", stat: "120,480 recipes", io: { in: "Fab rule corpus", out: "Recipe corpus" }, visual: V.Wafer },
  { id: "02", title: "Process Grammar", desc: "Context-free grammar encoding fab-level rules: lithography precedes etch, anneal follows implant.", stat: "47 production rules", io: { in: "Process recipes", out: "Parse trees" }, visual: V.Grammar },
  { id: "03", title: "Tokenization", desc: "Byte-pair fusion over (step, equipment, parameter) tuples. No subword leakage across step boundaries.", stat: "218 tokens", io: { in: "Parsed recipes", out: "Token streams" }, visual: V.Tokens },
  { id: "04", title: "Custom Vocabulary", desc: "Domain-specific tokens for LITH, ETCH, DIFF, CMP, IMPL, ANNL, plus parameterized variants.", stat: "12 step classes", io: { in: "Token frequencies", out: "Fixed vocab" }, visual: V.Vocab },
  { id: "05", title: "Decoder Transformer", desc: "12 layers, 12 attention heads, d=768. RoPE positional encoding. SwiGLU MLPs. RMSNorm.", stat: "47.2M params", io: { in: "Token embeddings", out: "Next-token logits" }, visual: V.Transformer },
  { id: "06", title: "Training Pipeline", desc: "AdamW, cosine schedule, 128 epochs. Description-initialized embeddings for unseen families.", stat: "128 epochs · 2× A100", io: { in: "9.2M sequences", out: "Checkpoint 0x8af1c2" }, visual: V.Training },
  { id: "07", title: "Validation Engine", desc: "SAT solver checks every decoded recipe against the production-rule grammar in <2ms.", stat: "99.7% validity", io: { in: "Decoded recipes", out: "SAT / UNSAT verdict" }, visual: V.SAT },
  { id: "08", title: "OOD Evaluation", desc: "6 held-out device families. Description-initialization recovers 49.5% Top-1 on unseen tech.", stat: "49.5% OOD Top-1", io: { in: "Held-out families", out: "Generalization score" }, visual: V.OOD },
];

function PipelineDiagram() {
  return (
    <div className="relative">
      <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-px bg-border-strong md:-translate-x-1/2" aria-hidden />
      <ol className="space-y-8 md:space-y-12">
        {pipeline.map((p, i) => {
          const Visual = p.visual;
          const left = i % 2 === 0;
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="relative md:grid md:grid-cols-2 md:gap-10 items-center"
            >
              <div className="absolute left-[20px] md:left-1/2 top-6 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10">
                <div className="h-3.5 w-3.5 bg-primary border-2 border-card shadow-[0_0_0_1px_var(--border-strong)]" />
              </div>

              <div className={`pl-14 md:pl-0 ${left ? "md:pr-10 md:text-right md:col-start-1" : "md:pl-10 md:col-start-2"}`}>
                <div className="font-mono text-tiny uppercase tracking-widest text-primary mb-1">
                  Stage {p.id} / 08
                </div>
                <h3 className="font-serif text-2xl leading-tight mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 md:max-w-md md:inline-block">
                  {p.desc}
                </p>
                <div className={`flex flex-wrap gap-x-6 gap-y-1 text-tiny font-mono ${left ? "md:justify-end" : ""}`}>
                  <span className="text-muted-foreground">IN <span className="text-foreground">{p.io.in}</span></span>
                  <span className="text-muted-foreground">OUT <span className="text-foreground">{p.io.out}</span></span>
                  <span className="text-primary">{p.stat}</span>
                </div>
              </div>

              <div className={`mt-4 md:mt-0 pl-14 md:pl-0 ${left ? "md:col-start-2" : "md:col-start-1 md:row-start-1"}`}>
                <div className="bg-card border border-border-strong p-4 relative">
                  <div className="absolute top-2 right-3 font-mono text-tiny text-muted-foreground">{p.id}</div>
                  <Visual className="w-full h-40 text-foreground" />
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
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
