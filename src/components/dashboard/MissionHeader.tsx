import { useEffect, useState } from "react";
import { StatusDot } from "./primitives";
import logo from "@/assets/silicongpt-logo.png";

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
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
  const time = t.toISOString().slice(11, 19) + " UTC";
  const date = t.toISOString().slice(0, 10);

  return (
    <header className="border-b border-border-strong bg-card">
      {/* Top utility bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-surface text-tiny font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>SILICONGPT-v0.4.1</span>
          <span className="text-border-strong">/</span>
          <span>NODE sgpt-train-04</span>
          <span className="text-border-strong">/</span>
          <span>REGION us-west-2c</span>
          <span className="text-border-strong">/</span>
          <span>BUILD 0x4a91e7</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{date}</span>
          <span className="tabular">{time}</span>
        </div>
      </div>

      {/* Brand row */}
      <div className="flex items-stretch">
        <div className="flex items-center gap-5 px-6 py-5 border-r border-border">
          <div className="h-10 w-10 border border-border-strong flex items-center justify-center bg-surface">
            <span className="font-serif text-xl leading-none">S</span>
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <img
                src={logo}
                alt="SiliconGPT"
                className="h-7 w-auto"
              />
              <span className="text-tiny font-mono text-muted-foreground uppercase tracking-widest">
                Industrial Process Intelligence
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-mono">
              Decoder-only transformer · trained from scratch on wafer fabrication process grammar
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-x-auto">
          <Cell label="Model Status" value="OPERATIONAL" dot tone="success" />
          <Cell label="Training" value="CONVERGED · epoch 142" dot tone="info" />
          <Cell label="OOD Eval" value="3-FOLD COMPLETE" dot tone="success" />
          <Cell label="Benchmark" value="LEADING · 5 PEERS" dot tone="success" />
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
