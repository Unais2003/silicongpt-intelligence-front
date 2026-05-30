import { motion } from "framer-motion";
import { Panel, StatusDot } from "./primitives";

const STEPS = [
  { id: "01", code: "LITH", name: "Lithography", detail: "193nm immersion · ArF" },
  { id: "02", code: "DEV", name: "Develop", detail: "TMAH 2.38% · puddle" },
  { id: "03", code: "ETCH", name: "Plasma Etch", detail: "RIE · CF4/O2" },
  { id: "04", code: "STRP", name: "Resist Strip", detail: "O2 ash · 250°C" },
  { id: "05", code: "CLN", name: "Wet Clean", detail: "SC-1 / SC-2" },
  { id: "06", code: "DIFF", name: "Diffusion", detail: "POCl3 · 950°C" },
  { id: "07", code: "DEP", name: "PECVD Deposit", detail: "SiO2 · 4200Å" },
  { id: "08", code: "CMP", name: "Planarize", detail: "Ceria slurry" },
  { id: "09", code: "METR", name: "Metrology", detail: "Ellipsometry" },
  { id: "10", code: "INSP", name: "Inspection", detail: "Brightfield · DI" },
];

export function ProcessFlow() {
  return (
    <Panel
      title="Semiconductor Process Flow · LIVE"
      meta={<span className="flex items-center gap-2"><StatusDot color="success" /> 10/10 NOMINAL</span>}
    >
      <div className="relative overflow-x-auto">
        <div className="flex items-stretch min-w-[1100px]">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-stretch flex-1">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-1 relative"
              >
                <div className="border border-border bg-surface-elevated px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-tiny font-mono text-muted-foreground">{s.id}</span>
                    <StatusDot color={i === 6 ? "warning" : "success"} />
                  </div>
                  <div className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider">
                    {s.code}
                  </div>
                  <div className="mt-0.5 text-sm font-medium leading-tight">{s.name}</div>
                  <div className="mt-1 text-tiny font-mono text-muted-foreground">{s.detail}</div>
                  <div className="mt-3 h-1 bg-border relative overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15, ease: "linear" }}
                      className="absolute inset-y-0 w-1/2 bg-primary/40"
                    />
                  </div>
                </div>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="flex items-center px-1">
                  <svg width="14" height="10" viewBox="0 0 14 10" className="text-border-strong">
                    <path d="M0 5 L12 5 M8 1 L12 5 L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-px bg-border border border-border">
          {[
            { k: "Wafers in flight", v: "247" },
            { k: "Mean cycle time", v: "82.4 min" },
            { k: "Yield (rolling)", v: "94.1%" },
            { k: "Recipe variants", v: "38" },
          ].map((x) => (
            <div key={x.k} className="bg-card px-4 py-3">
              <div className="text-tiny font-mono uppercase text-muted-foreground">{x.k}</div>
              <div className="font-mono text-lg tabular">{x.v}</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
