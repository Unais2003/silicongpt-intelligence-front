import { createFileRoute } from "@tanstack/react-router";
import { MissionHeader } from "@/components/dashboard/MissionHeader";
import { LiveMetrics } from "@/components/dashboard/LiveMetrics";
import { ModelArena } from "@/components/dashboard/ModelArena";
import { BenchmarkRadar } from "@/components/dashboard/BenchmarkArena";
import { SystemPromptDialog } from "@/components/dashboard/SystemPromptDialog";
import { SectionHeading, PageFooter } from "@/components/dashboard/layout";


export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Overview & Benchmarking — SiliconGPT" },
      {
        name: "description",
        content:
          "SiliconGPT vs frontier LLMs on WaferBench. Live accuracy, OOD, and constraint-validity metrics.",
      },
      { property: "og:title", content: "Overview & Benchmarking — SiliconGPT" },
      {
        property: "og:description",
        content:
          "Mission control for SiliconGPT: live metrics and head-to-head benchmarks vs GPT-5, Claude, Gemini, Kimi.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <main className="flex-1">
      <MissionHeader />
      <LiveMetrics />

      <div className="px-4 md:px-6 lg:px-8 py-8 space-y-10">
        <section>
          <SectionHeading
            kicker="§ 01 · Benchmark · Hack_01 Process Logic"
            title="Head-to-head against frontier LLMs."
            desc="A 1.37M from-scratch decoder vs. an n-gram baseline and four frontier LLMs — on next-step, completion, and anomaly."
          />
          <div className="mt-3 mb-5">
            <SystemPromptDialog />
          </div>
          <div className="flex flex-col gap-6">
            <ModelArena />
            <BenchmarkRadar />
          </div>
        </section>
      </div>


      <PageFooter />
    </main>
  );
}
