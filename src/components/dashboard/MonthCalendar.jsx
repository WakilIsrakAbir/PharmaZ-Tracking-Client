"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { monthStart } from "@/components/dashboard/calendar";
import { DayCell } from "@/components/dashboard/DayCell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]; // the week starts on Saturday in Bangladesh
const FILTERS = [
  { value: "all", label: "All" },
  { value: "doctor", label: "Doctors" },
  { value: "pharmacy", label: "Pharmacies" },
];

// Left side of the dashboard: the month, with a chip for every visit.
export function MonthCalendar({ month, days, visitsByDay, today, pickedDay, pickedVisitId, filter, loading, onChangeMonth, onToday, onFilter, onPickDay, onPickVisit }) {
  return (
    <section aria-label="Calendar" className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b px-4 py-3">
        <h2 className="min-w-36 text-lg font-semibold" aria-live="polite">
          {format(monthStart(month), "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Previous month" onClick={() => onChangeMonth(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next month" onClick={() => onChangeMonth(1)}>
            <ChevronRight />
          </Button>
        </div>
        <div role="radiogroup" aria-label="Show" className="inline-flex rounded-lg bg-muted p-1 sm:ml-auto">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filter === value}
              onClick={() => onFilter(value)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                filter === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
        {WEEKDAYS.map((name) => (
          <div key={name} className="py-2">
            {name}
          </div>
        ))}
      </div>

      <div className={cn("grid grid-cols-7 transition-opacity", loading && "opacity-60")}>
        {days.map((date) => {
          const day = format(date, "yyyy-MM-dd");
          return (
            <DayCell
              key={day}
              date={date}
              day={day}
              visits={visitsByDay[day] ?? []}
              inMonth={day.startsWith(month)}
              isToday={day === today}
              isPicked={day === pickedDay}
              pickedVisitId={pickedVisitId}
              onPickDay={onPickDay}
              onPickVisit={onPickVisit}
            />
          );
        })}
      </div>
    </section>
  );
}
