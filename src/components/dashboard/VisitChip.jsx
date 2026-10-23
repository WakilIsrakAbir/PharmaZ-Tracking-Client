"use client";

import { TypeIcon } from "@/components/shared/TypeBadge";
import { STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// A visit in the grid: the time on top, the name under it, colored by status.
export function VisitChip({ visit, isPicked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${formatDate(visit.visitDate, "h:mm a")} · ${visit.name} · ${visit.place}`}
      className={cn(
        "block w-full overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight transition outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring",
        STATUSES[visit.status]?.chip,
        isPicked && "ring-2 ring-primary ring-offset-1",
      )}
    >
      <span className="flex items-center gap-1 font-semibold tabular-nums">
        <TypeIcon type={visit.type} className="size-3 shrink-0 opacity-70" />
        {formatDate(visit.visitDate, "h:mm a")}
      </span>
      <span className="mt-0.5 block truncate">{visit.name}</span>
    </button>
  );
}
