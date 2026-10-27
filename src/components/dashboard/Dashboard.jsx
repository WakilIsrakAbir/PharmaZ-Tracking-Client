"use client";

// The home page (/): the month calendar on the left, the details on the right.
//   • click a day   → that day's visits show on the right
//   • click a visit → that doctor's or pharmacy's details show on the right
// What is shown lives in the address bar (?month=2026-10&day=2026-10-21&type=doctor&id=…),
// so a view can be shared and survives a refresh. The calendar grid itself is in MonthCalendar.jsx.

import { use, useRef, useState } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { useSearchParams } from "next/navigation";
import { addDays, addMonths, format } from "date-fns";
import { ArrowLeft, Plus, UserRound } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import {
  groupByDay,
  monthDays,
  monthStart,
  readView,
} from "@/components/dashboard/calendar";
import { MonthCalendar } from "@/components/dashboard/MonthCalendar";
import { YearOverview } from "@/components/dashboard/YearOverview";
import { RecordDetails } from "@/components/record-details/RecordDetails";
import { Avatar, StatusBadge, TypeIcon } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/lib/api";
import {
  dayKey,
  dhakaDateTime,
  firstName,
  formatDate,
  greeting,
  peopleLine,
  relativeDay,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export function Dashboard() {
  use(io()); // "today" is worked out on every visit, not saved into the page
  const now = new Date();
  const today = dayKey(now);
  const user = useUser();
  const params = useSearchParams();
  const view = readView(params, today);
  const detailsRef = useRef(null);
  const [overviewOpen, setOverviewOpen] = useState(false); // the year-at-a-glance dialog
  // New onboardings go on today or a later day; a past day picked on the calendar falls back to today.
  const newFormDay = view.day < today ? today : view.day;

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
      requestAnimationFrame(() =>
        detailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
    }
  }

  // Load every visit in the weeks the calendar shows.
  const days = monthDays(view.month);
  const from = dhakaDateTime(format(days[0], "yyyy-MM-dd"));
  const to = dhakaDateTime(format(addDays(days.at(-1), 1), "yyyy-MM-dd"));
  const { data: visits = [], isPending } = useCalendar(from, to);

  const shownVisits =
    view.filter === "all"
      ? visits
      : visits.filter((visit) => visit.type === view.filter);
  const visitsByDay = groupByDay(shownVisits);
  const visitsToday = visits.filter(
    (visit) => dayKey(visit.visitDate) === today,
  ).length;
  // The month's own visits (the grid also shows a few days of the months around it).
  const visitsThisMonth = visits.filter((visit) =>
    dayKey(visit.visitDate).startsWith(view.month),
  ).length;

  // Opens a month from the year overview, on today when it's this month, else on the 1st.
  function showMonth(month) {
    const day = month === today.slice(0, 7) ? today : `${month}-01`;
    show({ month, day, type: null, id: null });
    setOverviewOpen(false);
  }

  return (
    <div className="space-y-2">
      {/* The greeting and the two "New … form" buttons stay at the top while the page scrolls (under the
          top bar on phones). The strip has the page background and reaches the page edges, like the
          back link on other pages, so the calendar scrolling under it doesn't show through. */}
      <div className="sticky top-14 z-20 -mx-4 -mt-6 flex flex-col gap-4 bg-canvas/90 px-4 pt-6 pb-4 backdrop-blur-sm sm:-mx-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:top-0 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting(now)}, {firstName(user?.name)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {formatDate(now, "EEEE, d MMMM yyyy")} ·{" "}
            {visitsToday === 0
              ? "no visits today"
              : `${visitsToday} visit${visitsToday === 1 ? "" : "s"} today`}
          </p>
        </div>
        <NewFormButtons day={newFormDay} inline />
      </div>

      <YearOverview
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
        year={Number(view.month.slice(0, 4))}
        currentMonth={today.slice(0, 7)}
        pickedMonth={view.month}
        onPickMonth={showMonth}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* On large screens the calendar is sized to the screen (under the fixed header) and stays put,
            while the details on the right scroll: a long details card should never scroll the calendar away. */}
        <div className="xl:sticky xl:top-32 xl:h-[calc(100dvh-9.5rem)]">
          <MonthCalendar
            month={view.month}
            days={days}
            visitsByDay={visitsByDay}
            today={today}
            pickedDay={view.day}
            pickedVisitId={view.selected?.id}
            filter={view.filter}
            loading={isPending}
            monthTotal={visitsThisMonth}
            onOpenOverview={() => setOverviewOpen(true)}
            onChangeMonth={(step) => {
              const month = format(
                addMonths(monthStart(view.month), step),
                "yyyy-MM",
              );
              const day = month === today.slice(0, 7) ? today : `${month}-01`;
              show({ month, day, type: null, id: null });
            }}
            onToday={() =>
              show({
                month: today.slice(0, 7),
                day: today,
                type: null,
                id: null,
              })
            }
            onFilter={(filter) =>
              show({ filter: filter === "all" ? null : filter })
            }
            onPickDay={(day) => showDetails({ day, type: null, id: null })}
            onPickVisit={(visit, day) =>
              showDetails({ day, type: visit.type, id: visit.id })
            }
          />
        </div>

        <div ref={detailsRef} className="scroll-mt-20">
          {view.selected ? (
            <div className="space-y-3">
              {/* "← Friday, 23 October" goes back to the day's list. On large screens it stays under the
                  fixed header while the details scroll, with the page background so nothing shows through. */}
              <div className="xl:sticky xl:top-24 xl:z-10 xl:-mt-1 xl:-mb-1 xl:bg-canvas xl:pt-6 xl:pb-2">
                <button
                  type="button"
                  onClick={() => show({ type: null, id: null })}
                  className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <ArrowLeft className="size-4" />{" "}
                  {formatDate(dhakaDateTime(view.day, "12:00"), "EEEE, d MMMM")}
                </button>
              </div>
              <RecordDetails
                type={view.selected.type}
                id={view.selected.id}
                layout="panel"
              />
            </div>
          ) : (
            <DayVisits
              day={view.day}
              now={now}
              isPast={view.day < today}
              visits={visitsByDay[view.day] ?? []}
              showSubmitter={user?.role === "admin"}
              onPickVisit={(visit) =>
                showDetails({ type: visit.type, id: visit.id })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right, when no visit is picked: the visits on the picked day.
// Admins see the whole team's visits, so each one also says whose it is (and who is assigned).
// A past day only shows what happened: its visits can still be opened and updated, but nothing new
// can be planned there, so the "New … form" buttons stay away.
// ---------------------------------------------------------------------------
function DayVisits({ day, now, isPast, visits, showSubmitter, onPickVisit }) {
  const middayOfDay = dhakaDateTime(day, "12:00");

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="border-b px-5 py-4">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          {relativeDay(middayOfDay, now)}
        </p>
        <h2 className="mt-0.5 text-lg font-semibold">
          {formatDate(middayOfDay, "EEEE, d MMMM")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {visits.length
            ? `${visits.length} visit${visits.length === 1 ? "" : "s"}`
            : "Nothing planned yet"}
        </p>
      </header>

      {visits.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isPast
              ? "This day has passed. New onboardings go on today or a later day."
              : "Visited a doctor or pharmacy? Fill in the form and it shows up here."}
          </p>
          {!isPast && <NewFormButtons day={day} className="mt-4" />}
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
                <Avatar
                  name={visit.name}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <TypeIcon type={visit.type} className="size-3.5" />
                    {formatDate(visit.visitDate, "h:mm a")}
                  </p>
                  <p className="truncate font-semibold">{visit.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {visit.place}
                  </p>
                  {peopleLine(visit, { showSubmitter }) && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <UserRound
                        className="size-3 shrink-0"
                        aria-hidden="true"
                      />{" "}
                      {peopleLine(visit, { showSubmitter })}
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
