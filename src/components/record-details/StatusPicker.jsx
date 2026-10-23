"use client";

import { STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Ongoing / Setup / Implementation as three buttons. The chosen one is filled in.
export function StatusPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-1.5">
      {Object.entries(STATUSES).map(([status, { label, dot }]) => {
        const isChosen = value === status;
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={isChosen}
            onClick={() => onChange(status)}
            className={cn(
              "flex flex-auto items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isChosen ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <span className={cn("size-2 shrink-0 rounded-full", dot, isChosen && "ring-2 ring-primary-foreground/70")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
