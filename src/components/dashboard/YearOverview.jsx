"use client";

// A year at a glance: how many onboardings each month has. Opened from the count beside the month
// name on the calendar. Clicking a month opens it on the calendar; ‹ › move to other years.

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthCounts } from "@/lib/api";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function YearOverview({ open, onOpenChange, year, currentMonth, pickedMonth, onPickMonth }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* A dialog only shows its content while open, so it always starts on the calendar's year. */}
        <Overview startYear={year} currentMonth={currentMonth} pickedMonth={pickedMonth} onPickMonth={onPickMonth} />
      </DialogContent>
    </Dialog>
  );
}

function Overview({ startYear, currentMonth, pickedMonth, onPickMonth }) {
  const [year, setYear] = useState(startYear);
  const { data: months = [], isPending } = useMonthCounts(year);
  const total = months.reduce((sum, month) => sum + month.total, 0);

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Onboardings by month</DialogTitle>
        <DialogDescription>{isPending ? "Counting…" : `${total} in ${year}. Click a month to open it on the calendar.`}</DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon-sm" aria-label="Previous year" onClick={() => setYear(year - 1)}>
          <ChevronLeft />
        </Button>
        <span className="min-w-16 text-center text-lg font-semibold tabular-nums">{year}</span>
        <Button variant="outline" size="icon-sm" aria-label="Next year" onClick={() => setYear(year + 1)}>
          <ChevronRight />
        </Button>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label={`Months of ${year}`}>
        {isPending && months.length === 0
          ? MONTH_NAMES.map((name) => (
              <li key={name}>
                <Skeleton className="h-20 rounded-lg" />
              </li>
            ))
          : months.map((entry, index) => (
              <li key={entry.month}>
                <MonthTile
                  name={MONTH_NAMES[index]}
                  entry={entry}
                  isCurrent={entry.month === currentMonth}
                  isPicked={entry.month === pickedMonth}
                  onClick={() => onPickMonth(entry.month)}
                />
              </li>
            ))}
      </ul>
    </div>
  );
}

// One month: the name, the count, and doctors · pharmacies under it. This month has a ring;
// the month the calendar is on is filled in; an empty month is greyed.
function MonthTile({ name, entry, isCurrent, isPicked, onClick }) {
  const empty = entry.total === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isPicked ? "true" : undefined}
      className={cn(
        "flex h-20 w-full flex-col items-start justify-between rounded-lg border p-2.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isPicked ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted/50",
        isCurrent && !isPicked && "border-primary ring-1 ring-primary",
        empty && !isPicked && "text-muted-foreground",
      )}
    >
      <span className="text-xs font-semibold">{name.slice(0, 3)}</span>
      <span>
        <span className="block text-xl leading-none font-semibold tabular-nums">{entry.total}</span>
        <span className={cn("mt-1 block text-[11px] tabular-nums", isPicked ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {entry.doctors} dr · {entry.pharmacies} ph
        </span>
      </span>
    </button>
  );
}
