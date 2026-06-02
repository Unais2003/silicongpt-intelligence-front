import { createFileRoute } from "@tanstack/react-router";

import { DiscoveryArchitecture } from "@/components/dashboard/DiscoveryArchitecture";
import { DeepDiveSections } from "@/components/dashboard/DeepDiveSections";
import { PageFooter } from "@/components/dashboard/layout";

export const Route = createFileRoute("/_app/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — How SiliconGPT Was Discovered" },
      {
        name: "description",
        content:
          "A measurement-grounded multi-agent architecture search system that discovered SiliconGPT — eight specialized agents, a GPU Experiment Agent, and a three-tier validation ladder.",
      },
      { property: "og:title", content: "Architecture — How SiliconGPT Was Discovered" },
      {
        property: "og:description",
        content:
          "Multi-agent discovery · GPU Experiment Agent · architecture search → final 3M-param SiliconGPT.",
      },
    ],
  }),
  component: ArchitecturePage,
});

function ArchitecturePage() {
  return (
    <main className="flex-1">
      <DiscoveryArchitecture />
      <DeepDiveSections />
      <PageFooter />
    </main>
  );
}
