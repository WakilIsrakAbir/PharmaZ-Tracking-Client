"use client";

// /support-calls: the call log, one page at a time, with Open / Resolved tabs, a search box and
// filters. A support person sees the calls they logged; an admin sees every call, with who logged
// it. The tabs, filters and page live in the address (?status=open&page=2), so a refresh or the
// back button returns to the same view.

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { addDays } from "date-fns";
import { ChevronRight, FilterX, Headset, PhoneIncoming, Search, TriangleAlert } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import { Avatar, CallStatusBadge, EmptyState, PAGE_SIZES, PageHeader, Pagination, Select, TypeIcon } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupportCalls, useUsers } from "@/lib/api";
import { CALL_STATUSES, TYPES } from "@/lib/constants";
import { dayKey, dhakaDateTime, formatDate, formatPhone, relativeDay } from "@/lib/format";
import { useUrlParams } from "@/lib/useUrlParams";
import { cn } from "@/lib/utils";

const DEFAULT_LIMIT = 20;

// The order of the log. The empty value is the API's own default.
const SORTS = [
  { value: "", label: "Latest call first" },
  { value: "called_asc", label: "Oldest call first" },
  { value: "name", label: "Name, A to Z" },
  { value: "updated", label: "Last updated first" },
];

// The "Called" choices; calledRange() turns each one into days.
const WHEN = [
  { value: "", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

export function CallLog() {
  const user = useUser();
  const isAdmin = user?.role === "admin";
  const [params, setParams] = useUrlParams();

  // The view, read from the address.
  const status = params.get("status") ?? "";
  const type = params.get("type") ?? "";
  const createdBy = params.get("by") ?? "";
  const when = params.get("when") ?? "";
  const sort = params.get("sort") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = PAGE_SIZES.includes(Number(params.get("limit"))) ? Number(params.get("limit")) : DEFAULT_LIMIT;

  // Typing shows at once; the list follows a moment later, so not every keystroke asks the API.
  const [search, setSearch] = useState(params.get("q") ?? "");
  const query = useDeferredValue(search.trim());
  const filtering = Boolean(query || type || createdBy || when); // something besides the tabs narrows the log

  // Changing a filter goes back to the first page.
  function change(changes) {
    setParams({ ...changes, page: null });
  }

  function clearFilters() {
    setSearch("");
    change({ q: null, status: null, type: null, by: null, when: null });
  }

  function goToPage(next) {
    setParams({ page: next > 1 ? next : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const { data, isPending, isError, isFetching, refetch } = useSupportCalls({
    search: query,
    status,
    type,
    createdBy: createdBy === "me" ? user?.id : createdBy, // "me" is this person's own id
    ...calledRange(when),
    sort,
    page,
    limit,
  });
  const calls = data?.data ?? [];
  const meta = data?.meta;
  const counts = meta?.counts;

  // The people in "Logged by": the team, for admins only (the API keeps the team list to admins).
  const { data: team } = useUsers({ limit: 100 }, { enabled: isAdmin });
  const teammates = (team?.data ?? []).filter((person) => person.id !== user?.id && person.role !== "marketing");

  // A page that no longer exists (after a delete, or an old link): go to the last page there is.
  useEffect(() => {
    if (meta && meta.pages > 0 && page > meta.pages) setParams({ page: meta.pages > 1 ? meta.pages : null });
  }, [meta, page, setParams]);

  const tabs = [{ value: "", label: "All", count: counts?.all }].concat(
    Object.entries(CALL_STATUSES).map(([value, { label }]) => ({ value, label, count: counts?.[value] })),
  );
  const columns = isAdmin ? ADMIN_COLUMNS : COLUMNS;

  return (
    // The page reaches the very bottom of the screen and the card fills it, so the page bar touches the bottom edge.
    <div className="-mb-6 flex min-h-[calc(100dvh-5rem)] flex-col gap-6 lg:-mb-8 lg:min-h-[calc(100dvh-2rem)]">
      <PageHeader
        title="Call log"
        description={isAdmin ? "Every support call the team has logged, and whether it is solved." : "The calls you logged, and whether each one is solved."}
        actions={
          <Button asChild>
            <Link href="/support-calls/new">
              <PhoneIncoming /> Log a call
            </Link>
          </Button>
        }
      />

      <section className="flex flex-1 flex-col overflow-clip rounded-t-xl border border-b-0 bg-card">
        {/* The Open / Resolved tabs and the search box */}
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => change({ status: tab.value })}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  status === tab.value ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.value && <span className={cn("size-2 rounded-full", CALL_STATUSES[tab.value].dot)} />}
                {tab.label}
                <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{tab.count ?? "–"}</span>
              </button>
            ))}
          </div>
          <div className="relative lg:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                change({ q: event.target.value.trim() });
              }}
              placeholder="Search name, phone, problem"
              aria-label="Search the call log"
              className="pl-9"
            />
          </div>
        </div>

        {/* The filters: who called, who logged it, when, and the order */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/30 px-3 py-2">
          <FilterSelect label="From" value={type} onChange={(value) => change({ type: value })}>
            <option value="">Doctors and pharmacies</option>
            {Object.entries(TYPES).map(([value, { plural }]) => (
              <option key={value} value={value}>
                {plural}
              </option>
            ))}
          </FilterSelect>
          {isAdmin && (
            <FilterSelect label="Logged by" value={createdBy} onChange={(value) => change({ by: value })}>
              <option value="">Anyone</option>
              <option value="me">Me</option>
              {teammates.length > 0 && (
                <optgroup label="Team">
                  {teammates.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                      {!person.isActive && " (deactivated)"}
                    </option>
                  ))}
                </optgroup>
              )}
            </FilterSelect>
          )}
          <FilterSelect label="Called" value={when} onChange={(value) => change({ when: value })}>
            {WHEN.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Sort" value={sort} onChange={(value) => change({ sort: value })} neutral className="sm:ml-auto">
            {SORTS.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </FilterSelect>
          {(filtering || status) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX /> Clear
            </Button>
          )}
        </div>

        {/* The rows take the room that is left, so the page bar under them stays at the bottom. */}
        <div className="flex-1">
          {isPending ? (
            <RowsSkeleton />
          ) : isError ? (
            <EmptyState
              className="m-3 border-none"
              icon={TriangleAlert}
              title="We couldn't load the call log"
              description="Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          ) : calls.length === 0 ? (
            <EmptyState
              className="m-3 border-none"
              icon={filtering || status ? Search : Headset}
              title={filtering || status ? "Nothing matches" : "No calls logged yet"}
              description={filtering || status ? "Try a different search, status or filters." : "When a doctor or a pharmacy calls, log it here so the whole team can follow it."}
              action={
                filtering || status ? (
                  <Button variant="outline" onClick={clearFilters}>
                    <FilterX /> Clear filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/support-calls/new">
                      <PhoneIncoming /> Log the first call
                    </Link>
                  </Button>
                )
              }
            />
          ) : (
            // While another page or filter loads, the rows on screen fade a little instead of vanishing.
            <ul className={cn("divide-y transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
              <li className={cn("hidden gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid", columns)}>
                <span>Caller</span>
                <span>Problem</span>
                {isAdmin && <span>Logged by</span>}
                <span>Called</span>
                <span>Status</span>
                <span />
              </li>
              {calls.map((call) => (
                <CallRow key={call.id} call={call} columns={columns} showLoggedBy={isAdmin} />
              ))}
            </ul>
          )}
        </div>
        {!isError && <Pagination meta={meta} onPage={goToPage} onLimit={(next) => change({ limit: next === DEFAULT_LIMIT ? null : next })} />}
      </section>
    </div>
  );
}

// The columns of the log on large screens: who called, the problem, (who logged it,) when, status, and the arrow.
const COLUMNS = "md:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_10rem_7rem_1.5rem]";
const ADMIN_COLUMNS = "md:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_minmax(0,1fr)_10rem_7rem_1.5rem]";

function CallRow({ call, columns, showLoggedBy }) {
  return (
    <li>
      <Link
        href={`/support-calls/${call.id}`}
        className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40", columns)}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={call.callerName} className="size-10" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-semibold">
              <TypeIcon type={call.callerType} className="size-3.5 shrink-0 text-muted-foreground" />
              {call.callerName}
            </p>
            <p className="truncate text-sm text-muted-foreground tabular-nums">{formatPhone(call.phone)}</p>
          </div>
        </div>
        <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-auto">
          <p className="truncate text-sm font-medium">{call.problemTitle}</p>
          {call.description && <p className="truncate text-xs text-muted-foreground">{call.description}</p>}
        </div>
        {showLoggedBy && (
          <p className="col-span-2 row-start-4 truncate text-xs text-muted-foreground md:col-span-1 md:row-start-auto md:text-sm">
            <span className="md:hidden">Logged by </span>
            {call.createdBy?.name ?? "—"}
          </p>
        )}
        <p className="col-span-2 row-start-3 text-sm md:col-span-1 md:row-start-auto">
          <span className="font-medium">{relativeDay(call.calledAt, new Date())}</span>
          <span className="text-muted-foreground"> · {formatDate(call.calledAt, "h:mm a")}</span>
        </p>
        <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
          <CallStatusBadge status={call.status} />
        </div>
        <ChevronRight className="hidden size-4 text-muted-foreground md:block" aria-hidden="true" />
      </Link>
    </li>
  );
}

// A labelled drop-down in the filter row. It's tinted while it narrows the log; `neutral` is for
// the sort order, which never narrows anything.
function FilterSelect({ label, value, onChange, neutral = false, className, children }) {
  return (
    <label className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      {label}
      <Select compact active={!neutral && Boolean(value)} value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {children}
      </Select>
    </label>
  );
}

// The from/to Dhaka days of a "Called" choice, worked out when the log is asked for.
function calledRange(when) {
  const today = dayKey(new Date());
  if (when === "today") return { from: today, to: today };
  const noon = new Date(dhakaDateTime(today, "12:00")); // a moment inside today, safe to take days from
  if (when === "week") return { from: dayKey(addDays(noon, -6)), to: today };
  if (when === "month") return { from: dayKey(addDays(noon, -29)), to: today };
  return {};
}

function RowsSkeleton() {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-3 p-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
