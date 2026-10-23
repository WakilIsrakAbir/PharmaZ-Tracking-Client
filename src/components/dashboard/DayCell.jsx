"use client";

import { format } from "date-fns";

import { VisitChip } from "@/components/dashboard/VisitChip";
import { STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CHIPS_PER_DAY = 3; // more than this shows "+N more"

// One day in the grid. Larger screens show a chip per visit; phones show colored dots.
// The last column and the last row have no line of their own: the card's border is already there.
export function DayCell({ date, day, visits, inMonth, isToday, isPicked, pickedVisitId, onPickDay, onPickVisit }) {
  const isFriday = date.getDay() === 5; // the weekend in Bangladesh
  const hiddenCount = visits.length - CHIPS_PER_DAY;
  const visitCount = visits.length ? `, ${visits.length} visit${visits.length === 1 ? "" : "s"}` : "";

  return (
    <div
      onClick={() => onPickDay(day)}
      className={cn(
        "relative min-h-16 cursor-pointer border-r border-b p-1.5 transition-colors nth-[7n]:border-r-0 nth-last-[-n+7]:border-b-0 hover:bg-muted/40 sm:min-h-28",
        !inMonth && "bg-muted/30",
        inMonth && isFriday && "bg-muted/25",
        isPicked && "bg-secondary/70 hover:bg-secondary/70",
      )}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPickDay(day);
        }}
        aria-label={`${format(date, "EEEE d MMMM")}${visitCount}`}
        aria-pressed={isPicked}
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          !inMonth && "text-muted-foreground/60",
          isToday && "bg-primary font-semibold text-primary-foreground",
          isPicked && !isToday && "font-semibold ring-2 ring-primary",
        )}
      >
        {date.getDate()}
      </button>

      <div className="mt-1 hidden space-y-1 sm:block">
        {visits.slice(0, CHIPS_PER_DAY).map((visit) => (
          <VisitChip
            key={visit.id}
            visit={visit}
            isPicked={visit.id === pickedVisitId}
            onClick={(event) => {
              event.stopPropagation();
              onPickVisit(visit, day);
            }}
          />
        ))}
        {hiddenCount > 0 && <p className="px-1 text-[11px] font-medium text-muted-foreground">+{hiddenCount} more</p>}
      </div>

      {visits.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-0.5 px-1 sm:hidden" aria-hidden="true">
          {visits.slice(0, 4).map((visit) => (
            <span key={visit.id} className={cn("size-1.5 rounded-full", STATUSES[visit.status]?.dot)} />
          ))}
        </div>
      )}
    </div>
  );
}
