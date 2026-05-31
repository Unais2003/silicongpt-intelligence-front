import { useEffect, useState } from "react";
import { StatusDot } from "./primitives";
import { api } from "@/lib/api";

function BackendStatusBadge() {
  const [state, setState] = useState<"checking" | "online" | "offline">("checking");
  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((h) => !cancelled && setState(h?.ok ? "online" : "offline"))
      .catch(() => !cancelled && setState("offline"));
    return () => {
      cancelled = true;
    };
  }, []);

  const online = state === "online";
  const checking = state === "checking";
  const tone = checking ? "warning" : online ? "success" : "warning";
  const label = checking ? "CHECKING BACKEND…" : online ? "BACKEND ONLINE" : "BACKEND OFFLINE";
  const colorClass = checking
    ? "text-[var(--warning)] border-[var(--warning)]/40"
    : online
      ? "text-[var(--success)] border-[var(--success)]/40"
      : "text-red-500 border-red-500/40";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`flex items-center gap-2 px-3 py-1.5 border bg-card ${colorClass}`}>
        <StatusDot color={online ? "success" : checking ? "warning" : "warning"} />
        <span className="font-mono text-tiny uppercase tracking-widest">{label}</span>
      </div>
      {state === "offline" && (
        <span className="font-mono text-tiny text-muted-foreground">
          run the backend to enable inference
        </span>
      )}
    </div>
  );
}


export function SectionHeading({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6 mb-3">
      <div>
        <div className="text-tiny font-mono uppercase tracking-widest text-muted-foreground">
          {kicker}
        </div>
        <h2 className="font-serif text-3xl mt-1 leading-tight">{title}</h2>
      </div>
      <p className="hidden md:block max-w-md text-sm text-muted-foreground leading-relaxed text-right">
        {desc}
      </p>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  desc,
  status,
}: {
  kicker: string;
  title: string;
  desc: string;
  status?: string;
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="px-4 md:px-6 lg:px-8 py-6 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="font-mono text-tiny uppercase tracking-widest text-muted-foreground">
            {kicker}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mt-1 leading-[1.05]">{title}</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{desc}</p>
        </div>
        {status === "__backend__" ? (
          <BackendStatusBadge />
        ) : status ? (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card">
            <StatusDot color="success" />
            <span className="font-mono text-tiny uppercase tracking-widest">{status}</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function PageFooter() {
  return (
    <footer className="border-t border-border bg-surface mt-10">
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-tiny font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>SILICONGPT v0.4.1</span>
          <span>·</span>
          <span>BUILD 0x4a91e7</span>
          <span>·</span>
          <span>WAFERBENCH 0.4</span>
        </div>
        <div className="flex items-center gap-4">
          <span>© 2026 SiliconGPT Research</span>
          <span>·</span>
          <span>INTERNAL · NOT FOR DISTRIBUTION</span>
        </div>
      </div>
    </footer>
  );
}
