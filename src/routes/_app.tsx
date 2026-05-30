import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, FlaskConical, Cpu, Gauge } from "lucide-react";
import { StatusDot } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const nav = [
  {
    section: "PLATFORM",
    items: [
      { to: "/", label: "Overview & Benchmarking", kicker: "01", icon: Gauge, exact: true },
      { to: "/lab", label: "Process Intelligence Lab", kicker: "02", icon: FlaskConical },
      { to: "/architecture", label: "Architecture & Research", kicker: "03", icon: Cpu },
    ],
  },
];

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-border bg-surface sticky top-0 h-screen">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="relative h-7 w-7 border border-border-strong bg-card grid place-items-center">
            <div className="h-3 w-3 bg-primary" />
            <div className="corner-bracket absolute inset-0 pointer-events-none" />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[11px] uppercase tracking-widest text-foreground font-semibold">
              SiliconGPT
            </div>
            <div className="font-mono text-tiny text-muted-foreground">v0.4.1 · WAFERBENCH</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="px-2 mb-2 font-mono text-tiny uppercase tracking-widest text-muted-foreground">
              § {group.section}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`group relative flex items-center gap-3 px-2.5 py-2 border text-sm transition-colors ${
                        active
                          ? "bg-card border-border-strong text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card hover:border-border"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-rail"
                          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-primary"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="font-mono text-tiny text-muted-foreground">{item.kicker}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div>
          <div className="px-2 mb-2 font-mono text-tiny uppercase tracking-widest text-muted-foreground">
            § SYSTEM
          </div>
          <div className="px-2.5 py-2 border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-tiny text-muted-foreground">INFERENCE</span>
              <div className="flex items-center gap-1.5">
                <StatusDot color="success" />
                <span className="font-mono text-tiny">ONLINE</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-tiny text-muted-foreground">CHECKPOINT</span>
              <span className="font-mono text-tiny">ep-128</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-tiny text-muted-foreground">LATENCY</span>
              <span className="font-mono text-tiny tabular">11.4ms</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="border-t border-border px-4 py-3 font-mono text-tiny text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3" strokeWidth={1.5} />
          <span>SESSION 0x8af1c2</span>
        </div>
        <div className="mt-1">© 2026 · INTERNAL</div>
      </div>
    </aside>
  );
}

function MobileTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="lg:hidden sticky top-0 z-30 flex border-b border-border bg-surface overflow-x-auto">
      {nav[0].items.map((item) => {
        const active = item.exact
          ? pathname === item.to
          : pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 min-w-[150px] px-3 py-2.5 text-center border-r border-border last:border-r-0 ${
              active ? "bg-card text-foreground" : "text-muted-foreground"
            }`}
          >
            <div className="font-mono text-tiny uppercase tracking-widest">{item.kicker}</div>
            <div className="text-xs mt-0.5">{item.label}</div>
          </Link>
        );
      })}
    </div>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTabs />
        <Outlet />
      </div>
    </div>
  );
}
