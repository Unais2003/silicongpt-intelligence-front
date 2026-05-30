import { createFileRoute } from "@tanstack/react-router";

import { ModelArchitecture } from "@/components/dashboard/ModelArchitecture";
import { PageFooter, PageHeader } from "@/components/dashboard/layout";

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
