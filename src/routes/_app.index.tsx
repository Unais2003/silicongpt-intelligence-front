import { createFileRoute } from "@tanstack/react-router";
import { MissionHeader } from "@/components/dashboard/MissionHeader";
import { LiveMetrics } from "@/components/dashboard/LiveMetrics";
import { ModelArena } from "@/components/dashboard/ModelArena";
import { BenchmarkArena, BenchmarkRadar } from "@/components/dashboard/BenchmarkArena";
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
            kicker="§ 01 · Arena"
            title="Head-to-head against frontier LLMs."
            desc="SiliconGPT — a 47M-parameter decoder trained from scratch — versus GPT-5, Claude 4.5, Gemini 2.5, and Kimi K2 on semiconductor process tasks. WaferBench v0.4 radar on the right."
          />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6 items-start">
            <ModelArena />
            <BenchmarkRadar />
          </div>
        </section>

        <section>
          <SectionHeading
            kicker="§ 02 · Benchmark"
            title="WaferBench v0.4 leaderboard."
            desc="Domain accuracy, validity, and OOD transfer — measured across the full benchmark suite."
          />
          <BenchmarkArena />
        </section>
      </div>

      <PageFooter />
    </main>
  );
}
