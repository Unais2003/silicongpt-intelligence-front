import { motion } from "framer-motion";
import { ReactNode } from "react";

export function Panel({
  title,
  meta,
  children,
  className = "",
  bracket = false,
}: {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  bracket?: boolean;
}) {
  return (
    <div className={`relative bg-card border border-border ${className}`}>
      {bracket && <div className="corner-bracket absolute inset-0 pointer-events-none" />}
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <span className="text-tiny uppercase font-mono text-muted-foreground">{title}</span>
          </div>
          {meta && <div className="text-tiny font-mono text-muted-foreground">{meta}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function StatusDot({
  color = "success",
  pulse = true,
}: {
  color?: "success" | "warning" | "destructive" | "info" | "muted";
  pulse?: boolean;
}) {
  const map = {
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    destructive: "bg-destructive",
    info: "bg-[var(--info)]",
    muted: "bg-muted-foreground",
  };
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && (
        <span className={`absolute inset-0 rounded-full ${map[color]} opacity-60 pulse-dot`} />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${map[color]}`} />
    </span>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="text-tiny uppercase font-mono text-muted-foreground tracking-wider">
      {children}
    </div>
  );
}

export function Metric({
  label,
  value,
  suffix,
  delta,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  delta?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    destructive: "text-destructive",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-1"
    >
      <Label>{label}</Label>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-3xl font-semibold tabular ${toneClass}`}>{value}</span>
        {suffix && <span className="font-mono text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {delta && <div className="text-tiny font-mono text-muted-foreground">{delta}</div>}
    </motion.div>
  );
}
