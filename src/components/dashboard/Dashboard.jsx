"use client";

// The home page (/): the month calendar on the left, the details on the right.
//   • click a day   → that day's visits show on the right
//   • click a visit → that doctor's or pharmacy's details show on the right
// What is shown lives in the address bar (?month=2026-10&day=2026-10-21&type=doctor&id=…),
// so a view can be shared and survives a refresh. The calendar grid itself is in MonthCalendar.jsx.

import { use, useRef, useState } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { addDays, addMonths, format } from "date-fns";
import { ArrowDown, ArrowLeft, ArrowRight, CalendarCheck, ChevronRight, CornerDownRight, History, Plus } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import {
  groupByDay,
  isEarlierVisit,
  monthDays,
  monthStart,
  readView,
  visitKey,
} from "@/components/dashboard/calendar";
import { MonthCalendar } from "@/components/dashboard/MonthCalendar";
import { YearOverview } from "@/components/dashboard/YearOverview";
import { RecordDetails } from "@/components/record-details/RecordDetails";
import { StatusBadge, TypeIcon } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/lib/api";
import { STATUSES } from "@/lib/constants";
import {
  dayKey,
  dhakaDateTime,
  firstName,
  formatDate,
  formatDuration,
  formatTimeRange,
  greeting,
  peopleLine,
  relativeDay,
} from "@/lib/format";
import { useUrlParams } from "@/lib/useUrlParams";
import { cn } from "@/lib/utils";

export function Dashboard() {
  use(io()); // "today" is worked out on every visit, not saved into the page
  const now = new Date();
  const today = dayKey(now);
  const user = useUser();
  const [params, show] = useUrlParams(); // show({ day, type, id }) changes what is shown, no page load
  const view = readView(params, today);
  const detailsRef = useRef(null);
  const [overviewOpen, setOverviewOpen] = useState(false); // the year-at-a-glance dialog
  // Marketing people plan visits for today or later: a past day picked on the calendar falls back to
  // today. Admins may also enter an onboarding that already happened, on the day it did.
  const isAdmin = user?.role === "admin";
  const newFormDay = view.day < today && !isAdmin ? today : view.day;

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
  // The visit whose details are open: the picked record on the picked day (it can be on several days).
  const pickedVisit = view.selected
    ? visits.find((visit) => visit.id === view.selected.id && dayKey(visit.visitDate) === view.day)
    : null;
  const visitsToday = visits.filter(
    (visit) => visit?.visitDate && dayKey(visit.visitDate) === today,
  ).length;
  // The onboardings with a visit this month (the grid also shows a few days of the months around it).
  // A doctor or pharmacy with several visits this month counts once, like the year overview.
  const visitsThisMonth = new Set(
    visits
      .filter((visit) => {
        const key = visit?.visitDate ? dayKey(visit.visitDate) : "";
        return key && key.startsWith(view.month);
      })
      .map((visit) => visit.id),
  ).size;

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
          {/* The greeting, with today's visit count as a green pill right after the name. */}
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight">
            <span>
              {greeting(now)}, {firstName(user?.name)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-status-implementation-soft px-2.5 py-0.5 text-sm font-semibold text-status-implementation-ink tabular-nums">
              <CalendarCheck className="size-4" aria-hidden="true" />
              {visitsToday === 0
                ? "No visits today"
                : `${visitsToday} visit${visitsToday === 1 ? "" : "s"} today`}
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            {formatDate(now, "EEEE, d MMMM yyyy")}
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
            canPlanPast={isAdmin}
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
              {isEarlierVisit(pickedVisit) && pickedVisit.now && (
                <EarlierVisitNotice
                  visit={pickedVisit}
                  canDelete={isAdmin}
                  onOpenLatest={() => {
                    const day = dayKey(pickedVisit.now.visitDate);
                    showDetails({ month: day.slice(0, 7), day, type: pickedVisit.type, id: pickedVisit.id });
                  }}
                />
              )}
              {/* An earlier visit's lines are marked in the history, so it's clear which one to delete. */}
              <RecordDetails
                type={view.selected.type}
                id={view.selected.id}
                layout="panel"
                highlightDay={isEarlierVisit(pickedVisit) ? view.day : null}
              />
            </div>
          ) : (
            <DayVisits
              day={view.day}
              now={now}
              canPlan={isAdmin || view.day >= today}
              visits={visitsByDay[view.day] ?? []}
              showSubmitter={isAdmin}
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
// `canPlan` is false on a past day for marketing people: it only shows what happened (its visits can
// still be opened and updated), so the "New … form" buttons stay away. Admins can plan on any day.
// Each visit is a DayVisitRow: an earlier stage that was updated later says where it stands now; the
// header counts those.
// ---------------------------------------------------------------------------
function DayVisits({ day, now, canPlan, visits, showSubmitter, onPickVisit }) {
  const middayOfDay = dhakaDateTime(day, "12:00");
  const updatedLater = visits.filter(isEarlierVisit).length;

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
          {updatedLater > 0 && ` · ${updatedLater} updated later`}
        </p>
      </header>

      {visits.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {canPlan
              ? "Visited a doctor or pharmacy? Fill in the form and it shows up here."
              : "This day has passed. New onboardings go on today or a later day."}
          </p>
          {canPlan && <NewFormButtons day={day} className="mt-4" />}
        </div>
      ) : (
        <ul className="divide-y">
          {visits.map((visit) => (
            <li key={visitKey(visit)}>
              <DayVisitRow visit={visit} showSubmitter={showSubmitter} onPick={() => onPickVisit(visit)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// One visit in the day list, in the calendar's own look: a bar in the status color on the left
// (like the chips in the grid), the time first, the name, then the status with who it belongs to.
//   ┃ 🩺 10:00 – 11:30 AM · 1 hr 30 min
//   ┃ Dr. Md. Mashiur Rahman
//   ┃ Square Hospital Chambers                         (a doctor's chamber, when there is one)
//   ┃ [● Account Creation]  by Wakil Israk Abir                         ›
//   ┃ ↳ Now [● Implementation] · Tue 17 Nov                    (an earlier visit only)
// An earlier stage (updated later) has a faint bar and says where the onboarding stands now; a visit
// without that line is the latest one. The day's header counts how many were updated later.
function DayVisitRow({ visit, showSubmitter, onPick }) {
  const earlier = isEarlierVisit(visit);
  const people = peopleLine(visit, { showSubmitter });
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex w-full items-stretch gap-3 px-5 py-3.5 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40"
    >
      <span className={cn("w-1 shrink-0 rounded-full", STATUSES[visit.status]?.dot, earlier && "opacity-35")} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground tabular-nums">
          <TypeIcon type={visit.type} className="size-3.5 shrink-0" />
          {formatTimeRange(visit.visitDate, visit.visitEndDate)}
          {visit.visitEndDate && <span className="font-normal">· {formatDuration(visit.visitDate, visit.visitEndDate)}</span>}
        </p>
        <p className="mt-1 line-clamp-2 leading-snug font-semibold">{visit.name || `Unnamed ${visit.type}`}</p>
        {visit.place && visit.place !== visit.name && <p className="truncate text-sm text-muted-foreground">{visit.place}</p>}
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={visit.status} steps={visit.steps} />
          {people && <span className="min-w-0 truncate text-xs text-muted-foreground">{people}</span>}
        </div>
        {earlier && visit.now && (
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            <CornerDownRight className="size-3.5 shrink-0" aria-hidden="true" />
            Now
            <StatusBadge status={visit.now.status} className="px-2 py-px text-[11px]" />
            <span className="tabular-nums">· {formatDate(visit.now.visitDate, "EEE d MMM")}</span>
          </p>
        )}
      </div>
      <ChevronRight className="mt-0.5 size-4 shrink-0 self-center text-muted-foreground/50 transition-colors group-hover:text-foreground" aria-hidden="true" />
    </button>
  );
}

// Above the details of an earlier visit. The details are the onboarding as it is now, so this says
// which visit was opened, where the onboarding stands now, and leads to its latest visit. Admins also
// get "Find it in the history": the visit's lines are marked there, each with ⋯ → Delete update.
function EarlierVisitNotice({ visit, canDelete, onOpenLatest }) {
  const label = (status) => STATUSES[status]?.label ?? status;
  return (
    <div className="rounded-xl border border-status-setup/40 bg-status-setup-soft px-4 py-3 text-sm text-status-setup-ink">
      <p className="flex items-center gap-1.5 font-semibold">
        <History className="size-4 shrink-0" aria-hidden="true" /> Earlier visit, updated later
      </p>
      <p className="mt-1">
        This was the <span className="font-semibold">{label(visit.status)}</span> visit on{" "}
        {formatDate(visit.visitDate, "EEE d MMM")}, {formatTimeRange(visit.visitDate, visit.visitEndDate)}. It is now{" "}
        <span className="font-semibold">{label(visit.now.status)}</span> on {formatDate(visit.now.visitDate, "EEE d MMM")},{" "}
        {formatTimeRange(visit.now.visitDate, visit.now.visitEndDate)}. The details below are the latest.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={onOpenLatest}
          className="inline-flex items-center gap-1 rounded-sm font-semibold underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Go to the latest visit <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={findInHistory}
            className="inline-flex items-center gap-1 rounded-sm font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Added by mistake? Find it in the history <ArrowDown className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// Scrolls to the first marked line of the history (see History in StatusCard.jsx) and puts the
// focus on its ⋯ button, so Enter opens "Delete update…".
function findInHistory() {
  const line = document.querySelector("[data-marked-update]");
  if (!line) return;
  line.scrollIntoView({ behavior: "smooth", block: "center" });
  line.querySelector("button")?.focus({ preventScroll: true });
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
