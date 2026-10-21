import { cn } from "@/lib/utils";

// The PharmaZ247 Tracker mark: a medical cross with an amber "status" dot.
export function LogoMark({ className, inverted = false }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className={inverted ? "fill-white" : "fill-primary"} />
      <rect x="13.5" y="8" width="5" height="16" rx="1.6" className={inverted ? "fill-primary" : "fill-white"} />
      <rect x="8" y="13.5" width="16" height="5" rx="1.6" className={inverted ? "fill-primary" : "fill-white"} />
      <circle cx="25.5" cy="6.5" r="3.4" strokeWidth="1.6" className={cn("fill-status-setup", inverted ? "stroke-primary" : "stroke-white")} />
    </svg>
  );
}

export function Logo({ className, inverted = false }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark inverted={inverted} />
      <span className="leading-none">
        <span className="block text-[0.95rem] font-bold tracking-tight">PharmaZ 24/7</span>
        <span className={cn("mt-1 block text-[0.65rem] font-semibold tracking-[0.16em] uppercase", inverted ? "text-white/60" : "text-muted-foreground")}>
          Tracker
        </span>
      </span>
    </span>
  );
}
