"use client";

// The home page (/): the month calendar on the left, the details on the right.
//   • click a day   → that day's visits show on the right
//   • click a visit → that doctor's or pharmacy's details show on the right
// What is shown lives in the address bar (?month=2026-10&day=2026-10-21&type=doctor&id=…),
// so a view can be shared and survives a refresh.

import { use, useRef } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { useSearchParams } from "next/navigation";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfWeek } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, UserRound } from "lucide-react";

import { useUser } from "@/components/AppShell";
import { Avatar, StatusBadge, TypeIcon } from "@/components/common";
import { RecordDetails } from "@/components/RecordDetails";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/lib/api";
import { STATUSES } from "@/lib/constants";
import { dayKey, dhakaDateTime, firstName, formatDate, greeting, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]; // the week starts on Saturday in Bangladesh
const FILTERS = [
  { value: "all", label: "All" },
  { value: "doctor", label: "Doctors" },
  { value: "pharmacy", label: "Pharmacies" },
];
const CHIPS_PER_DAY = 3; // more than this shows "+N more"

export function Dashboard() {
  use(io()); // "today" is worked out on every visit, not saved into the page
  const now = new Date();
  const today = dayKey(now);
  const user = useUser();
  const params = useSearchParams();
  const view = readView(params, today);
  const detailsRef = useRef(null);

  // Change what is shown by changing the address bar (no page reload).
  function show(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    window.history.replaceState(null, "", `?${next}`);
  }

  // On phones the details are under the calendar, so scroll down to them.
  function showDetails(changes) {
    show(changes);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  // Load every visit in the weeks the calendar shows.
  const days = monthDays(view.month);
  const from = dhakaDateTime(format(days[0], "yyyy-MM-dd"));
  const to = dhakaDateTime(format(addDays(days.at(-1), 1), "yyyy-MM-dd"));
  const { data: visits = [], isPending } = useCalendar(from, to);

  const shownVisits = view.filter === "all" ? visits : visits.filter((visit) => visit.type === view.filter);
  const visitsByDay = groupByDay(shownVisits);
  const visitsToday = visits.filter((visit) => dayKey(visit.visitDate) === today).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting(now)}, {firstName(user?.name)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {formatDate(now, "EEEE, d MMMM yyyy")} · {visitsToday === 0 ? "no visits today" : `${visitsToday} visit${visitsToday === 1 ? "" : "s"} today`}
          </p>
        </div>
        <NewFormButtons day={view.day} inline />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <MonthCalendar
          month={view.month}
          days={days}
          visitsByDay={visitsByDay}
          today={today}
          pickedDay={view.day}
          pickedVisitId={view.selected?.id}
          filter={view.filter}
          loading={isPending}
          onChangeMonth={(step) => {
            const month = format(addMonths(monthStart(view.month), step), "yyyy-MM");
            const day = month === today.slice(0, 7) ? today : `${month}-01`;
            show({ month, day, type: null, id: null });
          }}
          onToday={() => show({ month: today.slice(0, 7), day: today, type: null, id: null })}
          onFilter={(filter) => show({ filter: filter === "all" ? null : filter })}
          onPickDay={(day) => showDetails({ day, type: null, id: null })}
          onPickVisit={(visit, day) => showDetails({ day, type: visit.type, id: visit.id })}
        />

        <div ref={detailsRef} className="scroll-mt-20 xl:sticky xl:top-6">
          {view.selected ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => show({ type: null, id: null })}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> {formatDate(dhakaDateTime(view.day, "12:00"), "EEEE, d MMMM")}
              </button>
              <RecordDetails type={view.selected.type} id={view.selected.id} layout="panel" />
            </div>
          ) : (
            <DayVisits
              day={view.day}
              now={now}
              visits={visitsByDay[view.day] ?? []}
              showSubmitter={user?.role === "admin"}
              onPickVisit={(visit) => showDetails({ type: visit.type, id: visit.id })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left: the month calendar
// ---------------------------------------------------------------------------
function MonthCalendar({ month, days, visitsByDay, today, pickedDay, pickedVisitId, filter, loading, onChangeMonth, onToday, onFilter, onPickDay, onPickVisit }) {
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

// One day in the grid. Larger screens show a chip per visit; phones show colored dots.
// The last column and the last row have no line of their own: the card's border is already there.
function DayCell({ date, day, visits, inMonth, isToday, isPicked, pickedVisitId, onPickDay, onPickVisit }) {
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

// A visit in the grid: the time on top, the name under it, colored by status.
function VisitChip({ visit, isPicked, onClick }) {
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

// ---------------------------------------------------------------------------
// Right, when no visit is picked: the visits on the picked day.
// Admins see the whole team's visits, so each one also says whose it is.
// ---------------------------------------------------------------------------
function DayVisits({ day, now, visits, showSubmitter, onPickVisit }) {
  const middayOfDay = dhakaDateTime(day, "12:00");

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="border-b px-5 py-4">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">{relativeDay(middayOfDay, now)}</p>
        <h2 className="mt-0.5 text-lg font-semibold">{formatDate(middayOfDay, "EEEE, d MMMM")}</h2>
        <p className="text-sm text-muted-foreground">{visits.length ? `${visits.length} visit${visits.length === 1 ? "" : "s"}` : "Nothing planned yet"}</p>
      </header>

      {visits.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Visited a doctor or pharmacy? Fill in the form and it shows up here.</p>
          <NewFormButtons day={day} className="mt-4" />
        </div>
      ) : (
        <ul className="divide-y">
          {visits.map((visit) => (
            <li key={visit.id}>
              <button
                type="button"
                onClick={() => onPickVisit(visit)}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
              >
                <Avatar name={visit.name} photoUrl={visit.photoUrl} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <TypeIcon type={visit.type} className="size-3.5" />
                    {formatDate(visit.visitDate, "h:mm a")}
                  </p>
                  <p className="truncate font-semibold">{visit.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{visit.place}</p>
                  {showSubmitter && visit.createdBy && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <UserRound className="size-3 shrink-0" aria-hidden="true" /> {visit.createdBy.name}
                    </p>
                  )}
                </div>
                <StatusBadge status={visit.status} steps={visit.steps} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// The two buttons that start a new form, both alike so neither looks "selected".
// Each opens an empty form with the visit date already set to `day`.
// They sit one under the other, full width; `inline` puts them side by side on wider screens.
function NewFormButtons({ day, inline = false, className }) {
  return (
    <div className={cn("grid gap-2", inline && "sm:flex", className)}>
      <Button asChild>
        <Link href={`/doctors/new?date=${day}`}>
          <Plus /> New doctor form
        </Link>
      </Button>
      <Button asChild>
        <Link href={`/pharmacies/new?date=${day}`}>
          <Plus /> New pharmacy form
        </Link>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Reads ?month= &day= &type= &id= &filter= from the address bar, with safe defaults.
function readView(params, today) {
  const thisMonth = today.slice(0, 7);

  let month = params.get("month");
  if (!/^\d{4}-\d{2}$/.test(month ?? "")) month = thisMonth;

  let day = params.get("day");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) day = month === thisMonth ? today : `${month}-01`;

  const type = params.get("type");
  const id = params.get("id");
  const selected = type && id ? { type, id } : null;

  const filter = params.get("filter") ?? "all";
  return { month, day, selected, filter };
}

// "2026-10" → 1 October 2026
function monthStart(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

// Every day the calendar shows: whole weeks, Saturday to Friday, covering the month.
function monthDays(month) {
  const first = monthStart(month);
  return eachDayOfInterval({
    start: startOfWeek(first, { weekStartsOn: 6 }),
    end: endOfWeek(endOfMonth(first), { weekStartsOn: 6 }),
  });
}

// { "2026-10-21": [visit, visit], … } using the day in Dhaka time.
function groupByDay(visits) {
  const byDay = {};
  for (const visit of visits) {
    const day = dayKey(visit.visitDate);
    byDay[day] ??= [];
    byDay[day].push(visit);
  }
  return byDay;
}
