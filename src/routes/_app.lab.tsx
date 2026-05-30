import { createFileRoute } from "@tanstack/react-router";
import { ProcessLab } from "@/components/dashboard/ProcessLab";
import { GroundTruthComparison } from "@/components/dashboard/GroundTruthComparison";
import { OODDashboard } from "@/components/dashboard/OODDashboard";
import { SectionHeading, PageFooter, PageHeader } from "@/components/dashboard/layout";

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

      <div className="px-4 md:px-6 lg:px-8 py-8 space-y-10">
        <section>
          <SectionHeading
            kicker="§ Evaluation"
            title="Ground truth comparison."
            desc="Side-by-side alignment between SiliconGPT's decoded recipe and the fab's golden reference sequence."
          />
          <GroundTruthComparison />
        </section>

        <section>
          <SectionHeading
            kicker="§ Generalization"
            title="Out-of-distribution device families."
            desc="Trained on 14 process families, evaluated on 6 held-out ones. The model transfers learned grammar to unseen technologies."
          />
          <OODDashboard />
        </section>
      </div>

      <PageFooter />
    </main>
  );
}
