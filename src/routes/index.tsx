import { createFileRoute } from "@tanstack/react-router";
import { MissionHeader } from "@/components/dashboard/MissionHeader";
import { LiveMetrics } from "@/components/dashboard/LiveMetrics";
import { ProcessLab } from "@/components/dashboard/ProcessLab";
import { GroundTruthComparison } from "@/components/dashboard/GroundTruthComparison";
import { ModelArena } from "@/components/dashboard/ModelArena";
import { OODDashboard } from "@/components/dashboard/OODDashboard";
import { ModelArchitecture } from "@/components/dashboard/ModelArchitecture";
import { ResearchFindings } from "@/components/dashboard/ResearchFindings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SiliconGPT — Industrial Process Intelligence" },
      {
        name: "description",
        content:
          "SiliconGPT is a decoder-only transformer trained from scratch to learn semiconductor wafer fabrication process grammar.",
      },
      { property: "og:title", content: "SiliconGPT — Industrial Process Intelligence" },
      {
        property: "og:description",
        content:
          "Mission-control dashboard for SiliconGPT: process lab, model arena, OOD generalization, and ground-truth evaluation.",
      },
    ],
  }),
  component: Index,
});

function SectionHeading({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-end justify-between gap-6 mb-3">
      <div>
        <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
          {kicker}
        </div>
        <h2 className="font-serif text-3xl mt-1 leading-tight">{title}</h2>
      </div>
      <p className="hidden md:block max-w-md text-sm text-muted-foreground leading-relaxed text-right">
        {desc}
      </p>
    </div>
  );
}

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MissionHeader />
      <LiveMetrics />

      <ProcessLab />

      <div className="px-4 md:px-6 lg:px-8 py-8 space-y-10">
        <section>
          <SectionHeading
            kicker="§ 03 · Evaluation"
            title="Ground truth comparison."
            desc="Side-by-side alignment between SiliconGPT's decoded recipe and the fab's golden reference sequence."
          />
          <GroundTruthComparison />
        </section>

        <section>
          <SectionHeading
            kicker="§ 04 · Arena"
            title="Model Arena."
            desc="SiliconGPT against frontier general-purpose LLMs across six metrics. A 47M-parameter model trained from scratch dominates on every axis."
          />
          <ModelArena />
        </section>

        <section>
          <SectionHeading
            kicker="§ 05 · Generalization"
            title="Out-of-distribution device families."
            desc="Trained on 14 process families, evaluated on 6 held-out ones. The model transfers learned grammar to unseen technologies."
          />
          <OODDashboard />
        </section>

        <section>
          <SectionHeading
            kicker="§ 06 · Architecture"
            title="Decoder-only, trained from scratch."
            desc="A 12-layer, 12-head, 47.2M-parameter transformer over a custom 218-token process vocabulary. No pretraining, no foundation model."
          />
          <ModelArchitecture />
        </section>

        <section>
          <SectionHeading
            kicker="§ 07 · Research"
            title="What we found."
            desc="Four results from the v0.4 cycle. Description-initialization is the single largest lever for OOD."
          />
          <ResearchFindings />
        </section>
      </div>

      <footer className="border-t border-border bg-surface mt-10">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-tiny font-mono text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>SILICONGPT v0.4.1</span>
            <span>·</span>
            <span>BUILD 0x4a91e7</span>
            <span>·</span>
            <span>WAFERBENCH 0.4</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026 SiliconGPT Research</span>
            <span>·</span>
            <span>INTERNAL · NOT FOR DISTRIBUTION</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
