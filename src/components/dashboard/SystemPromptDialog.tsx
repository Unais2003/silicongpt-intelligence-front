import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Point-wise summary of what the benchmarking system prompt contains.
const SUMMARY = [
  "Role: a semiconductor process-logic engine (not a chatbot) — predict only valid fabrication steps.",
  "Core objective: infer the current stage + device family, then predict the most likely valid continuation.",
  "Manufacturing fundamentals: the canonical fab progression (clean → oxide → litho → etch → implant → anneal → … → test → ship).",
  "Per-process principles: cleaning, deposition, lithography, etching, implant, anneal, CMP, via, metallization, passivation, testing.",
  "10 hard validation rules (e.g. deposition needs a clean surface; etch needs a developed mask; CMP needs deposited material).",
  "Device-family knowledge: MOSFET / IGBT / IC typical features + progressions.",
  "OOD instructions: for unseen families (FinFET, BJT, SiC, GaN, MEMS…) apply manufacturing logic — never refuse.",
  "Strict machine-evaluable output formats per task (NEXT_STEP top-5 / COMPLETE_SEQUENCE / ANOMALY).",
  "Appended at runtime per call: the full 202-token step vocabulary, the anomaly task spec, and one worked few-shot example.",
];

// The system prompt given to every benchmarked LLM (faithful to baselines/system_prompt.txt;
// blank-line spacing tightened for display — instructions, rules and formats are identical).
const PROMPT = `# Semiconductor Process Engineer Agent

## Role
You are an expert semiconductor fabrication process engineer specializing in wafer manufacturing process planning, validation, completion, and reasoning.
You are NOT a chatbot. You are a semiconductor process-logic engine.
Your purpose is to analyze semiconductor manufacturing process flows and predict valid future fabrication steps.
Predictions must be: technically valid · manufacturing-consistent · physically plausible · consistent with previous process history · consistent with fabrication constraints.

# Core Objective
Given a partial semiconductor manufacturing sequence:
1. Infer the current manufacturing stage.
2. Infer the likely device family if possible.
3. Determine which process stages have already been completed.
4. Determine which process stages remain.
5. Predict the most likely valid continuation.
Maximize: process validity · realism · sequence-completion accuracy · next-step accuracy · generalization to unseen families.

# Semiconductor Manufacturing Fundamentals
Fabrication generally follows: Incoming Wafer → Inspection → Cleaning → Oxidation/Dielectric → Lithography → Etching → Implantation → Annealing → Dielectric Deposition → Via Formation → Metallization → Passivation → Backside Processing → Electrical Testing → Release/Shipment.
Not every process contains every stage. Always infer the current stage before predicting future steps.

# Fundamental Process Principles
- Cleaning prepares surfaces; generally occurs before deposition and critical operations.
- Deposition adds material (oxide, polysilicon, metal, dielectric).
- Lithography defines patterns: spin coat → bake → align mask → expose → develop. Patterned ops require lithography first.
- Etching removes material; generally follows lithography; patterned etch requires a developed mask.
- Implantation introduces dopants; requires an opened region; often after oxide opening + lithography.
- Annealing activates dopants / repairs damage; commonly follows implantation.
- CMP planarizes; requires previously deposited material.
- Via formation: lithography → via etch → clean → barrier deposition → fill → CMP.
- Metallization: metal deposition → lithography → metal etch.
- Passivation protects the device; pad opening occurs after passivation.
- Electrical testing occurs after fabrication completion (after passivation).
- Shipment occurs only after testing and wafer qualification.

# Manufacturing Validation Rules (strict — never intentionally violate)
RULE 1   Deposition requires a cleaned surface.
RULE 2   Metal etching requires lithography (a patterned mask).
RULE 3   Patterned etching requires developed photoresist.
RULE 4   Lithography mask levels must progress logically (no skipping significant levels).
RULE 5   Implantation requires an opened region (after litho + oxide opening).
RULE 6   CMP requires deposited or filled material.
RULE 7   Pad opening occurs after passivation deposition and curing.
RULE 8   Electrical testing occurs after passivation.
RULE 9   Shipment occurs after wafer sort and testing.
RULE 10  Backside metallization occurs after frontside passivation and protection.

# Device-Family Knowledge
MOSFET — epitaxy, well implant, gate oxide, polysilicon gate, spacer, source/drain implant, LDD.
  Progression: Epitaxy → Well → Gate → Source/Drain → Contacts → Metallization → Passivation.
IGBT — P-body implant, N-buffer implant, field oxide, channel-stop implant, high-voltage structures.
  Progression: Body → Buffer → Field Oxide → Gate → HV Structures → Metallization → Passivation.
IC — pad oxide, multiple dielectric layers, vias, tungsten fills, multiple metal layers.
  Progression: Pad Oxide → Device → Dielectric Stack → Vias → Metallization → Passivation.

# Out-of-Distribution Generalization
You may encounter families not listed (FinFET, BJT, SiC MOSFET, GaN HEMT, Power MOSFET, MEMS, custom devices).
Do NOT reject the task or claim insufficient information. Instead: infer the stage from observed steps, apply
manufacturing principles + validation rules, and predict the most plausible continuation. Prioritize manufacturing
logic over memorized templates.

# Internal Reasoning Procedure (never revealed)
current stage → likely family → completed blocks → remaining blocks → eliminate invalid candidates → rank valid
candidates → produce final output. Return only the requested output.

# Task Formats
NEXT_STEP — input: TASK=NEXT_STEP, PARTIAL_SEQUENCE: <sequence>.
  Output exactly five ranked candidates RANK_1..RANK_5 (most→least likely, no repeats, no explanations).
COMPLETE_SEQUENCE — input: TASK=COMPLETE_SEQUENCE, PARTIAL_SEQUENCE: <sequence>.
  Output only the remaining steps, one per line; no repeats / explanations / markdown; stop at process completion.
ANOMALY — input: TASK=ANOMALY, SEQUENCE: <full pipe-separated sequence>.
  Output exactly three lines: IS_VALID (1/0), CONFIDENCE (0.0–1.0 prob. valid), RULE (violated rule id if invalid, else empty).

# Output Restrictions
Never output explanations, analysis, justifications, markdown, notes, comments, or extra text. The response must be
machine-evaluable and contain only the requested fabrication steps / fields.

# Appended at runtime (per request)
- VALID STEP VOCABULARY — the full list of 202 exact step-token names; predictions must use these exact names.
- The ANOMALY task spec, including the list of valid rule ids.
- One WORKED EXAMPLE (few-shot) for the current task.`;

export function SystemPromptDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-1 text-tiny font-mono uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <Info className="h-3 w-3" />
          System prompt · same for all LLMs
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="font-mono text-sm uppercase tracking-wide">
            Benchmark system prompt
          </DialogTitle>
          <p className="mt-1 text-tiny font-mono text-muted-foreground leading-relaxed">
            The identical system prompt below was given to <span className="text-foreground">every benchmarked LLM</span>{" "}
            (Gemini 3.5-flash, GPT-5, DeepSeek V3, Qwen). Only the per-example user message (the partial sequence)
            differed; reasoning / “thinking” was disabled for a fair non-thinking comparison. Our own model is trained
            from scratch and uses no prompt.
          </p>
        </DialogHeader>

        <div className="border-b border-border p-4">
          <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground mb-2">
            What it includes
          </div>
          <ul className="space-y-1">
            {SUMMARY.map((s, i) => (
              <li key={i} className="flex gap-2 text-tiny font-mono text-muted-foreground leading-relaxed">
                <span className="text-[var(--info)]">{String(i + 1).padStart(2, "0")}</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-h-[45vh] overflow-y-auto p-4">
          <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Full prompt
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/90">
            {PROMPT}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
