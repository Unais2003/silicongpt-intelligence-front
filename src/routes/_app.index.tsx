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
            desc="SiliconGPT — a 25.31M-parameter decoder trained from scratch — versus an n-gram trigram baseline and Gemini 3.5-flash on semiconductor fab process tasks. These are the three systems actually evaluated on our eval set."
          />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6 items-start">
            <ModelArena />
            <BenchmarkRadar />
          </div>
        </section>

        <section>
          <SectionHeading
            kicker="§ 02 · Benchmark"
            title="Hack_01 Process Logic leaderboard."
            desc="Next-step top-1, sequence completion token accuracy, and anomaly F1 — scored on 5,200 held-out examples."
          />
          <BenchmarkArena />
        </section>
      </div>

      <PageFooter />
    </main>
  );
}
