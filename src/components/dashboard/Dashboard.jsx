"use client";

// The home page (/): the month calendar on the left, the details on the right.
//   • click a day   → that day's visits show on the right
//   • click a visit → that doctor's or pharmacy's details show on the right
// What is shown lives in the address bar (?month=2026-10&day=2026-10-21&type=doctor&id=…),
// so a view can be shared and survives a refresh.

import { use, useRef } from "react";
import { io } from "next/cache";
import { useSearchParams } from "next/navigation";
import { addDays, addMonths, format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import { groupByDay, monthDays, monthStart, readView } from "@/components/dashboard/calendar";
import { DayVisits } from "@/components/dashboard/DayVisits";
import { MonthCalendar } from "@/components/dashboard/MonthCalendar";
import { NewFormButtons } from "@/components/dashboard/NewFormButtons";
import { RecordDetails } from "@/components/record-details/RecordDetails";
import { useCalendar } from "@/lib/api";
import { dayKey, dhakaDateTime, firstName, formatDate, greeting } from "@/lib/format";

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
