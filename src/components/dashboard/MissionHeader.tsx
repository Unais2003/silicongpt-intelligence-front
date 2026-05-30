import { useEffect, useState } from "react";
import { StatusDot } from "./primitives";
import logo from "@/assets/silicongpt-logo.png";

function useClock() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => {
    setT(new Date());
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

function Cell({
  label,
  value,
  dot,
  tone,
}: {
  label: string;
  value: string;
  dot?: boolean;
  tone?: "success" | "warning" | "info";
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3 border-r border-border last:border-r-0 min-w-[180px]">
      <div className="text-tiny uppercase font-mono text-muted-foreground tracking-wider">
        {label}
      </div>
      <div className="flex items-center gap-2">
        {dot && <StatusDot color={tone ?? "success"} />}
        <span className="font-mono text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

export function MissionHeader() {
  const t = useClock();
  const time = t ? t.toISOString().slice(11, 19) + " UTC" : "--:--:-- UTC";
  const date = t ? t.toISOString().slice(0, 10) : "----------";

  return (
    <header className="border-b border-border-strong bg-card">

      {/* Brand row */}
      <div className="flex items-stretch">
        <div className="flex items-center gap-5 px-6 py-5 border-r border-border">
          <img
            src={logo}
            alt="SiliconGPT"
            className="h-9 w-auto object-contain"
          />
          <div className="pl-5 border-l border-border">
            <div className="text-tiny font-mono text-muted-foreground uppercase tracking-widest">
              Industrial Process Intelligence
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-mono">
              Decoder-only transformer · trained from scratch on wafer fabrication process grammar
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-x-auto">
          <Cell label="Model Status" value="OPERATIONAL" dot tone="success" />
          <Cell label="Training" value="iter 17,000 · val_loss 0.3090" dot tone="info" />
          <Cell label="OOD Eval" value="IC HELD OUT · ~50% TOP-1" dot tone="success" />
          <Cell label="Benchmark" value="vs N-GRAM + GEMINI" dot tone="success" />
          <Cell label="Inference" value="11.4 ms p50" dot tone="info" />
        </div>
      </div>

      {/* Ticker */}
      <div className="relative overflow-hidden border-t border-border bg-surface h-7 flex items-center">
        <div className="absolute inset-y-0 left-0 z-10 px-3 flex items-center bg-foreground text-background text-tiny font-mono uppercase tracking-widest">
          LIVE
        </div>
        <div className="ticker-track flex gap-8 whitespace-nowrap pl-24 text-tiny font-mono text-muted-foreground">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-8">
              <span><span className="text-[var(--success)]">▲</span> TOP-1 81.0%</span>
              <span><span className="text-[var(--success)]">▲</span> TOP-5 100.0%</span>
              <span><span className="text-[var(--warning)]">●</span> OOD 49.5%</span>
              <span><span className="text-[var(--success)]">▲</span> VALIDITY 99.7%</span>
              <span><span className="text-[var(--success)]">▲</span> ROC-AUC 0.997</span>
              <span>VOCAB 218 tokens</span>
              <span>CONTEXT 512</span>
              <span>PARAMS 47.2M</span>
              <span>TRAIN 9.2M sequences</span>
              <span>FAMILIES 14 train · 6 held-out</span>
              <span>GPU A100 80GB ×4</span>
              <span>STEP/s 1,842</span>
              <span>LOSS 0.0214</span>
              <span>GRAD-NORM 0.41</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
