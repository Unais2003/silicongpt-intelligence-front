# Benchmark values (source of truth for the UI)

All numbers are **real measured values** from the backend scorer (`src/process_logic/score.py`,
mirrored in `extras/results/benchmark_compare.json`). These are the figures hard-coded in the dashboard
(`BenchmarkArena.tsx`, `ModelArena.tsx`, `MissionHeader.tsx`, `LiveMetrics.tsx`). Update both this file
and those components together.

## Coverage / fairness
- **Ours (SiliconGPT 1.37M) + n-gram** ran the **full held-out eval**: 3600 next-step / 600 completion / 1000 anomaly.
- **Frontier LLMs** (Gemini, GPT-5, DeepSeek, Qwen) were sampled on **200 examples** (API cost).
- **OOD** = held-out-family proxy (train on 2 families, test the 3rd, 3-fold). Reported as the **3-seed mean**.
  Applies only to our trained model (LLMs aren't trained, so OOD = —).
- **Anomaly = hybrid** (LM perplexity + deterministic rule validator) — our deployed system; LLMs reason from the rules in-prompt.

## Next-step prediction
| model | n | top-1 | top-3 | top-5 | MRR |
|---|---|---|---|---|---|
| **SiliconGPT (ours, 1.37M)** | 3600 | **81.1** | 99.6 | 100.0 | 0.903 |
| N-gram (trigram) | 3600 | 76.1 | 99.1 | 100.0 | 0.874 |
| Gemini 3.5-flash | 200 | 55.5 | 73.5 | 78.0 | 0.647 |
| GPT-5 | 200 | 52.5 | — | 72.0 | 0.602 |
| DeepSeek V3 | 200 | 48.0 | 59.0 | 65.0 | 0.545 |
| Qwen | 200 | 41.5 | 55.5 | 63.5 | 0.497 |

## Sequence completion
| model | n | exact-match | norm-edit-dist (↓) | token-acc |
|---|---|---|---|---|
| **SiliconGPT (ours)** | 600 | 0.0 | **0.222** | **40.5** |
| N-gram (trigram) | 600 | 0.0 | 0.318 | 28.3 |
| Gemini 3.5-flash | 200 | 0.0 | 0.658 | 7.6 |
| DeepSeek V3 | 200 | 0.0 | 0.760 | 5.6 |
| Qwen | 200 | 0.0 | 0.827 | 2.5 |
| GPT-5 | — | — | — | — (only 4 samples) |

## Anomaly detection
| model | n | acc | precision | recall | F1 | ROC-AUC | rule-attr |
|---|---|---|---|---|---|---|---|
| **SiliconGPT (ours, hybrid)** | 1000 | **1.000** | 1.000 | 1.000 | **1.000** | **1.000** | 0.910 |
| Gemini 3.5-flash | 200 | 0.925 | 0.884 | 0.938 | 0.910 | 0.676 | 0.895 |
| DeepSeek V3 | 200 | 0.770 | 1.000 | 0.432 | 0.603 | 0.746 | 1.000 |
| Qwen | 200 | 0.775 | 0.781 | 0.617 | 0.690 | 0.673 | 0.760 |
| N-gram / GPT-5 | — | — | — | — | — | — | — |

## Headline / model card (SiliconGPT, shipped)
- Params **1.37M** (3 layers · d=192 · RoPE) — ~18× smaller than the 25M V1 baseline.
- In-dist next-step **top-1 81.1%** (vs 25M baseline 80.7%), top-5 100%, MRR 0.903.
- **OOD next-step 50.3%** (3-seed mean; vs 25M baseline 49.5%).
- Completion validity ~99–100%; LM-only anomaly ROC-AUC 0.995, hybrid 1.000.
- **vs Gemini top-1: +25.6 pt** (81.1 − 55.5).

> Known UI gap: `ModelArchitecture.tsx` still draws the **25M (8L/512)** base architecture; the shipped
> model is 1.37M (3L/192). Decide whether to convert that diagram or keep it as the "base architecture."
