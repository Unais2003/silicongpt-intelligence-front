import { createFileRoute } from "@tanstack/react-router";
import { MissionHeader } from "@/components/dashboard/MissionHeader";
import { LiveMetrics } from "@/components/dashboard/LiveMetrics";
import { ProcessFlow } from "@/components/dashboard/ProcessFlow";
import { NextStepPredictor } from "@/components/dashboard/NextStepPredictor";
import { OODDashboard } from "@/components/dashboard/OODDashboard";
import { BenchmarkArena } from "@/components/dashboard/BenchmarkArena";
import { ProcessValidator } from "@/components/dashboard/ProcessValidator";
import { ModelArchitecture } from "@/components/dashboard/ModelArchitecture";
import { ResearchFindings } from "@/components/dashboard/ResearchFindings";
import { DemoConsole } from "@/components/dashboard/DemoConsole";

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
          "Mission-control dashboard for SiliconGPT: live metrics, benchmark arena, OOD generalization, and process validator.",
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

      <div className="px-4 md:px-6 lg:px-8 py-8 space-y-10">
        <section>
          <SectionHeading
            kicker="§ 01 · Process Flow"
            title="Semiconductor fabrication, in-flight."
            desc="Each step is a token in SiliconGPT's vocabulary. Live recipe execution streamed from the fab controller."
          />
          <ProcessFlow />
        </section>

        <section>
          <SectionHeading
            kicker="§ 02 · Inference"
            title="Next-step prediction engine."
            desc="Decoder produces a calibrated distribution over the next process operation, conditioned on the entire wafer history."
          />
          <NextStepPredictor />
        </section>

        <section>
          <SectionHeading
            kicker="§ 03 · Generalization"
            title="Out-of-distribution device families."
            desc="Trained on 14 process families, evaluated on 6 held-out ones. The model transfers learned grammar to unseen technologies."
          />
          <OODDashboard />
        </section>

        <section>
          <SectionHeading
            kicker="§ 04 · Benchmark"
            title="Against frontier models."
            desc="On WaferBench v0.4, a 47M-param model trained from scratch outperforms general-purpose frontier LLMs by 40+ points."
          />
          <BenchmarkArena />
        </section>

        <section>
          <SectionHeading
            kicker="§ 05 · Validation"
            title="Manufacturing constraints, enforced."
            desc="Every prediction is checked against a SAT-based recipe validator. 99.7% of completions satisfy all fab rules."
          />
          <ProcessValidator />
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

        <section>
          <SectionHeading
            kicker="§ 08 · Console"
            title="Interactive inference."
            desc="Build a process prefix and watch SiliconGPT propose the next step. All predictions are constraint-validated."
          />
          <DemoConsole />
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
