import { createFileRoute } from "@tanstack/react-router";
import { ProcessLab } from "@/components/dashboard/ProcessLab";
import { PageFooter, PageHeader } from "@/components/dashboard/layout";

export const Route = createFileRoute("/_app/lab")({
  head: () => ({
    meta: [
      { title: "Process Intelligence Lab — SiliconGPT" },
      {
        name: "description",
        content:
          "Upload CSV, paste process sequences, and run SiliconGPT inference: next-step prediction, completion, validation, anomaly detection, and OOD analysis.",
      },
      { property: "og:title", content: "Process Intelligence Lab — SiliconGPT" },
      {
        property: "og:description",
        content:
          "Engineering workstation for semiconductor process inference, ground-truth comparison, and OOD analysis.",
      },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  return (
    <main className="flex-1">
      <PageHeader
        kicker="§ 02 · Process Intelligence Lab"
        title="Inference workstation."
        desc="Run SiliconGPT against real wafer fabrication recipes. Predict next steps, complete sequences, validate constraints, surface anomalies."
        status="LIVE INFERENCE"
      />

      <ProcessLab />

      <PageFooter />
    </main>
  );
}
