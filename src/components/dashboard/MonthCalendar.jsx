"use client";

// The left side of the dashboard: the month grid, a chip for every visit.
//   MonthCalendar  the header (month, Today, the Doctors / Pharmacies filter) and the grid
//   DayCell        one day in the grid
//   VisitChip      one visit in a day

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { monthStart } from "@/components/dashboard/calendar";
import { TypeIcon } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]; // the week starts on Saturday in Bangladesh
const FILTERS = [
  { value: "all", label: "All" },
  { value: "doctor", label: "Doctors" },
  { value: "pharmacy", label: "Pharmacies" },
];
const CHIPS_PER_DAY = 3; // more than this shows "+N more"
const CHIPS_PER_DAY_XL = 2; // on large screens the calendar fits the screen, so the cells are shorter: one-line chips, two per day

export function MonthCalendar({ month, days, visitsByDay, today, pickedDay, pickedVisitId, filter, loading, onChangeMonth, onToday, onFilter, onPickDay, onPickVisit }) {
  return (
    <section aria-label="Calendar" className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
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

      {/* On large screens the rows share the height that is left, so the whole month fits on the screen. */}
      <div className={cn("grid min-h-0 flex-1 auto-rows-fr grid-cols-7 transition-opacity", loading && "opacity-60")}>
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

// One day in the grid. Larger screens show a chip per visit (one line each, at most two, on screens
// where the calendar fits the screen height); phones show colored dots.
// The last column and the last row have no line of their own: the card's border is already there.
function DayCell({ date, day, visits, inMonth, isToday, isPicked, pickedVisitId, onPickDay, onPickVisit }) {
  const isFriday = date.getDay() === 5; // the weekend in Bangladesh
  const hiddenCount = visits.length - CHIPS_PER_DAY;
  const hiddenCountXl = visits.length - CHIPS_PER_DAY_XL;
  const visitCount = visits.length ? `, ${visits.length} visit${visits.length === 1 ? "" : "s"}` : "";

  return (
    <div
      onClick={() => onPickDay(day)}
      className={cn(
        "relative min-h-16 cursor-pointer overflow-hidden border-r border-b p-1.5 transition-colors nth-[7n]:border-r-0 nth-last-[-n+7]:border-b-0 hover:bg-muted/40 sm:min-h-28 xl:min-h-0 xl:p-1",
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
      {/* On large screens the visits that don't fit are counted next to the date; click the day to see them all. */}
      {hiddenCountXl > 0 && (
        <span className="absolute top-1.5 right-1.5 hidden rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground tabular-nums xl:inline-block" aria-hidden="true">
          +{hiddenCountXl}
        </span>
      )}

      <div className="mt-1 hidden space-y-1 sm:block">
        {visits.slice(0, CHIPS_PER_DAY).map((visit, index) => (
          <VisitChip
            key={visit.id}
            visit={visit}
            isPicked={visit.id === pickedVisitId}
            className={index >= CHIPS_PER_DAY_XL ? "xl:hidden" : undefined}
            onClick={(event) => {
              event.stopPropagation();
              onPickVisit(visit, day);
            }}
          />
        ))}
        {hiddenCount > 0 && <p className="px-1 text-[11px] font-medium text-muted-foreground xl:hidden">+{hiddenCount} more</p>}
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

// A visit in the grid: the time on top, the name under it, colored by status. On large screens,
// where the calendar fits the screen, the two sit on one line so a chip is half as tall.
function VisitChip({ visit, isPicked, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${formatDate(visit.visitDate, "h:mm a")} · ${visit.name} · ${visit.place}`}
      className={cn(
        "block w-full overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight transition outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring xl:flex xl:items-center xl:gap-1 xl:py-0.5",
        STATUSES[visit.status]?.chip,
        isPicked && "ring-2 ring-primary ring-offset-1",
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums">
        <TypeIcon type={visit.type} className="size-3 shrink-0 opacity-70" />
        {formatDate(visit.visitDate, "h:mm a")}
      </span>
      <span className="mt-0.5 block min-w-0 flex-1 truncate xl:mt-0">{visit.name}</span>
    </button>
  );
}
