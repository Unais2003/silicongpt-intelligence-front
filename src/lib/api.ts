// SiliconGPT backend HTTP client.
// All endpoints hit the Python/Flask backend (default http://localhost:5050).
// Override with VITE_BACKEND_URL (e.g. a Cloudflare quick-tunnel URL when the
// Lovable preview iframe can't reach localhost).

const BASE =
  (import.meta as unknown as { env?: { VITE_BACKEND_URL?: string } }).env
    ?.VITE_BACKEND_URL ??
  "https://6a51c6c475f11a13-131-175-44-1.serveousercontent.com";

async function jpost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

async function jget<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

async function fpost<T>(path: string, form: FormData): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: "POST", body: form });
  if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

export type Health = {
  ok: boolean;
  ckpt_path: string | null;
  device: string;
  vocab_size: number;
  threshold: number | null;
  load_error: string | null;
  families: string[];
};

export type Prediction = { token: string; prob: number };

export type Violation = {
  rule: string;
  description: string;
  step_index: number;
  step_name: string;
};

export type AnomalyResult = {
  is_valid: number;
  score: number;
  nll: number;
  threshold: number | null;
  predicted_rule: string;
  violations: Violation[];
  lm_only: { is_valid: number; score: number };
};

export type NextStepMetrics = Record<
  string,
  { top1: number; top3: number; top5: number; mrr: number; n: number }
>;
export type CompletionMetrics = Record<
  string,
  { exact_match: number; norm_edit_dist: number; token_acc: number; n: number }
>;
export type AnomalyMetrics = Record<
  string,
  {
    acc: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    rule_attr: number;
    confusion: { tp: number; fp: number; fn: number; tn: number };
    n: number;
  }
>;

export type NextStepRow = {
  example_id: string;
  family: string;
  partial_sequence: string[];
  predictions: Prediction[];
  true_next_step?: string;
};
export type CompletionRow = {
  example_id: string;
  family: string;
  partial_sequence: string[];
  predicted: string[];
  true_suffix: string[] | null;
  completion_fraction?: string;
};
export type AnomalyRow = {
  example_id: string;
  family: string;
  sequence: string[];
  is_valid: number;
  score: number;
  predicted_rule: string;
  nll: number;
  true_is_valid: number | null;
  true_rule?: string;
};

export type NextStepEval = {
  rows: NextStepRow[];
  metrics: NextStepMetrics | null;
  n: number;
};
export type CompletionEval = {
  rows: CompletionRow[];
  metrics: CompletionMetrics | null;
  n: number;
};
export type AnomalyEval = {
  rows: AnomalyRow[];
  metrics: AnomalyMetrics | null;
  n: number;
};
export type OODEval = {
  task: string;
  metrics: NextStepMetrics | CompletionMetrics | AnomalyMetrics;
  family_counts: Record<string, number>;
  n: number;
};

export const api = {
  health: () => jget<Health>("/api/health"),
  vocab: () => jget<{ tokens: string[] }>("/api/vocab"),
  rules: () =>
    jget<{ rules: { id: string; description: string }[] }>("/api/rules"),

  predictNextStep: (partial: string[], k = 5) =>
    jpost<{ predictions: Prediction[]; latency_ms: number }>(
      "/api/predict/nextstep",
      { partial_sequence: partial, k },
    ),

  complete: (
    partial: string[],
    opts: { max_new?: number; greedy?: boolean; temperature?: number } = {},
  ) =>
    jpost<{
      prefix: string[];
      generated: string[];
      full: string[];
      latency_ms: number;
    }>("/api/predict/complete", {
      partial_sequence: partial,
      max_new: opts.max_new ?? 220,
      greedy: opts.greedy ?? true,
      temperature: opts.temperature ?? 1.0,
    }),

  generate: (
    opts: { prefix?: string[]; max_new?: number; temperature?: number } = {},
  ) =>
    jpost<{
      prefix: string[];
      generated: string[];
      full: string[];
      is_valid: number;
      violations: Violation[];
      latency_ms: number;
    }>("/api/generate", {
      prefix: opts.prefix ?? [],
      max_new: opts.max_new ?? 220,
      temperature: opts.temperature ?? 1.0,
    }),

  validate: (sequence: string[]) =>
    jpost<{ is_valid: number; violations: Violation[]; n_steps: number }>(
      "/api/validate",
      { sequence },
    ),

  anomaly: (sequence: string[], use_validator = true) =>
    jpost<AnomalyResult>("/api/anomaly", { sequence, use_validator }),

  evalNextStep: (file: File) => {
    const f = new FormData();
    f.append("file", file);
    return fpost<NextStepEval>("/api/eval/nextstep", f);
  },
  evalCompletion: (file: File) => {
    const f = new FormData();
    f.append("file", file);
    return fpost<CompletionEval>("/api/eval/completion", f);
  },
  evalAnomaly: (file: File) => {
    const f = new FormData();
    f.append("file", file);
    return fpost<AnomalyEval>("/api/eval/anomaly", f);
  },
  evalOOD: (file: File, task: "nextstep" | "completion" | "anomaly") => {
    const f = new FormData();
    f.append("file", file);
    f.append("task", task);
    return fpost<OODEval>("/api/eval/ood", f);
  },
};
