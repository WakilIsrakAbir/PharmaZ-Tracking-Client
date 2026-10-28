"use client";

// /doctors and /pharmacies: the forms, one page at a time, with status tabs, a search box and filters.
// Admins see every form, with who submitted it; marketing people see the forms they submitted or
// were assigned to. The tabs, filters and page live in the address (?status=setup&page=2), so a
// refresh or the back button returns to the same view, and it can be shared.

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { addDays } from "date-fns";
import { ChevronRight, FilterX, Pill, Plus, Search, Stethoscope, TriangleAlert } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import { Avatar, EmptyState, PAGE_SIZES, PageHeader, Pagination, Select, StatusBadge, TypeIcon } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecords, useUsers } from "@/lib/api";
import { STATUSES, TYPES } from "@/lib/constants";
import { countSteps, dayKey, dhakaDateTime, formatDate, formatPhone, peopleLine, relativeDay } from "@/lib/format";
import { useUrlParams } from "@/lib/useUrlParams";
import { cn } from "@/lib/utils";

const DEFAULT_LIMIT = 20;

// The order of the list. The empty value is the API's own default.
const SORTS = [
  { value: "", label: "Newest visit first" },
  { value: "visit_asc", label: "Oldest visit first" },
  { value: "name", label: "Name, A to Z" },
  { value: "updated", label: "Last updated first" },
];

// The "Visit date" choices; visitRange() turns each one into days.
const WHEN = [
  { value: "", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

export function RecordList({ type }) {
  const user = useUser();
  const isAdmin = user?.role === "admin";
  const { label, plural, path } = TYPES[type];
  const [params, setParams] = useUrlParams();

  // The view, read from the address.
  const status = params.get("status") ?? "";
  const assignee = params.get("assigned") ?? "";
  const createdBy = params.get("by") ?? "";
  const when = params.get("when") ?? "";
  const sort = params.get("sort") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = PAGE_SIZES.includes(Number(params.get("limit"))) ? Number(params.get("limit")) : DEFAULT_LIMIT;

  // Typing shows at once; the list follows a moment later, so not every keystroke asks the API.
  const [search, setSearch] = useState(params.get("q") ?? "");
  const query = useDeferredValue(search.trim());
  const filtering = Boolean(query || assignee || createdBy || when); // something besides the tabs narrows the list

  // Changing a filter goes back to the first page.
  function change(changes) {
    setParams({ ...changes, page: null });
  }

  function clearFilters() {
    setSearch("");
    change({ q: null, status: null, assigned: null, by: null, when: null });
  }

  function goToPage(next) {
    setParams({ page: next > 1 ? next : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const { data, isPending, isError, isFetching, refetch } = useRecords(type, {
    search: query,
    status,
    assignee: assignee === "me" ? user?.id : assignee, // "me" is this person's own id
    createdBy: createdBy === "me" ? user?.id : createdBy,
    ...visitRange(when),
    sort,
    page,
    limit,
  });
  const records = data?.data ?? [];
  const meta = data?.meta;
  const counts = meta?.counts;

  // The people in "Assigned to" and "Submitted by". Only admins may load the team, so marketing
  // people get "Me" and "No one yet" to choose from.
  const { data: team } = useUsers({ limit: 100 }, { enabled: isAdmin });
  const teammates = (team?.data ?? []).filter((person) => person.id !== user?.id);

  // A page that no longer exists (after a delete, or an old link): go to the last page there is.
  useEffect(() => {
    if (meta && meta.pages > 0 && page > meta.pages) setParams({ page: meta.pages > 1 ? meta.pages : null });
  }, [meta, page, setParams]);

  const tabs = [{ value: "", label: "All", count: counts?.all }].concat(
    Object.entries(STATUSES).map(([value, { label: statusLabel }]) => ({ value, label: statusLabel, count: counts?.[value] })),
  );

  return (
    // The page reaches the very bottom of the screen (it takes over the page's bottom padding, under
    // the top bar on phones), and the list's card fills it, so the page bar touches the bottom edge
    // even when the list is short.
    <div className="-mb-6 flex min-h-[calc(100dvh-5rem)] flex-col gap-6 lg:-mb-8 lg:min-h-[calc(100dvh-2rem)]">
      <PageHeader
        title={plural}
        description={
          isAdmin
            ? `Every ${label.toLowerCase()} form the team has submitted, and where each one stands.`
            : `The ${label.toLowerCase()} forms you submitted or were assigned to, and where each one stands.`
        }
        actions={
          <Button asChild>
            <Link href={`${path}/new`}>
              <Plus /> New {label.toLowerCase()} form
            </Link>
          </Button>
        }
      />

      {/* No bottom edge: the card ends at the screen's edge, with the page bar as its last row. */}
      <section className="flex flex-1 flex-col overflow-clip rounded-t-xl border border-b-0 bg-card">
        {/* The status tabs and the search box */}
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
                {tab.value && <span className={cn("size-2 rounded-full", STATUSES[tab.value].dot)} />}
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
              placeholder={type === "doctor" ? "Search name, phone, BMDC, chamber" : "Search name, phone, owner, area"}
              aria-label={`Search ${plural.toLowerCase()}`}
              className="pl-9"
            />
          </div>
        </div>

        {/* The filters: who, when, and the order */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/30 px-3 py-2">
          <FilterSelect label="Assigned to" value={assignee} onChange={(value) => change({ assigned: value })}>
            <option value="">Anyone</option>
            <option value="none">No one yet</option>
            <option value="me">Me</option>
            <Teammates people={teammates} />
          </FilterSelect>
          {isAdmin && (
            <FilterSelect label="Submitted by" value={createdBy} onChange={(value) => change({ by: value })}>
              <option value="">Anyone</option>
              <option value="me">Me</option>
              <Teammates people={teammates} />
            </FilterSelect>
          )}
          <FilterSelect label="Visit date" value={when} onChange={(value) => change({ when: value })}>
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
              title={`We couldn't load the ${plural.toLowerCase()}`}
              description="Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          ) : records.length === 0 ? (
            <EmptyState
              className="m-3 border-none"
              icon={filtering || status ? Search : type === "doctor" ? Stethoscope : Pill}
              title={filtering || status ? "Nothing matches" : `No ${label.toLowerCase()} forms yet`}
              description={
                filtering || status
                  ? "Try a different search, status or filters."
                  : `When ${isAdmin ? "someone submits" : "you submit"} a ${label.toLowerCase()} form, it shows up here and on the calendar.`
              }
              action={
                filtering || status ? (
                  <Button variant="outline" onClick={clearFilters}>
                    <FilterX /> Clear filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={`${path}/new`}>
                      <Plus /> Fill in the first {label.toLowerCase()} form
                    </Link>
                  </Button>
                )
              }
            />
          ) : (
            // While another page or filter loads, the rows on screen fade a little instead of vanishing.
            <ul className={cn("divide-y transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
              <li className={cn("hidden gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid", COLUMNS)}>
                <span>{label}</span>
                <span>Location</span>
                <span>Assigned to</span>
                <span>Date and time</span>
                <span>Status</span>
                <span />
              </li>
              {records.map((record) => (
                <RecordRow key={record.id} record={record} path={path} showSubmitter={isAdmin} />
              ))}
            </ul>
          )}
        </div>
        {!isError && <Pagination meta={meta} onPage={goToPage} onLimit={(next) => change({ limit: next === DEFAULT_LIMIT ? null : next })} />}
      </section>
    </div>
  );
}

// The columns of the list on large screens: who, where, who is assigned, when, status, and the arrow.
const COLUMNS = "md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_10rem_9rem_1.5rem]";

function RecordRow({ record, path, showSubmitter }) {
  const people = peopleLine(record, { showSubmitter, showAssigned: false }); // the assigned have their own column
  const place = record.type === "doctor" ? record.chamberName || record.address : [record.area, record.district].filter(Boolean).join(", ") || record.address;
  return (
    <li>
      <Link
        href={`${path}/${record.id}`}
        className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40", COLUMNS)}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={record.name} className="size-10" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{record.name}</p>
            <p className="truncate text-sm text-muted-foreground tabular-nums">{formatPhone(record.phone)}</p>
          </div>
        </div>
        <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-auto">
          <p className="truncate text-sm text-muted-foreground md:text-foreground">
            <TypeIcon type={record.type} className="mr-1.5 inline size-3.5 text-muted-foreground md:hidden" />
            {place}
          </p>
          {people && <p className="truncate text-xs text-muted-foreground">{people}</p>}
        </div>
        <div className="col-span-2 row-start-4 min-w-0 md:col-span-1 md:row-start-auto">
          <AssignedCell people={record.assignedTo} />
        </div>
        <p className="col-span-2 row-start-3 text-sm md:col-span-1 md:row-start-auto">
          <span className="font-medium">{relativeDay(record.visitDate, new Date())}</span>
          <span className="text-muted-foreground"> · {formatDate(record.visitDate, "h:mm a")}</span>
        </p>
        <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
          <StatusBadge status={record.status} steps={countSteps(record.implementationSteps)} />
        </div>
        <ChevronRight className="hidden size-4 text-muted-foreground md:block" aria-hidden="true" />
      </Link>
    </li>
  );
}

// Who is assigned, as a small stack of avatars and the names; a dash when nobody is. On phones it sits
// under the location and says "Assigned to"; on larger screens the column header says it.
function AssignedCell({ people }) {
  if (people.length === 0) return <span className="hidden text-sm text-muted-foreground md:block">—</span>;
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <span className="text-xs text-muted-foreground md:hidden">Assigned to</span>
      <span className="flex shrink-0 -space-x-1.5">
        {people.slice(0, 3).map((person) => (
          <Avatar key={person.email} name={person.teammate ? person.name : "@"} className="size-6 text-[0.6rem] ring-2 ring-card" />
        ))}
      </span>
      <span className="truncate">{people.map((person) => person.name).join(", ")}</span>
    </div>
  );
}

// A labelled drop-down in the filter row. It's tinted while it narrows the list; `neutral` is for
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

// The team as <option>s, under a "Teammates" heading. Deactivated people are listed too: their forms are still here.
function Teammates({ people }) {
  if (people.length === 0) return null;
  return (
    <optgroup label="Teammates">
      {people.map((person) => (
        <option key={person.id} value={person.id}>
          {person.name}
          {!person.isActive && " (deactivated)"}
        </option>
      ))}
    </optgroup>
  );
}

// The from/to Dhaka days of a "Visit date" choice, worked out when the list is asked for.
function visitRange(when) {
  const today = dayKey(new Date());
  if (when === "today") return { from: today, to: today };
  if (when === "upcoming") return { from: today }; // today and later
  if (when === "past") {
    const noon = new Date(dhakaDateTime(today, "12:00")); // a moment inside today, safe to take a day from
    return { to: dayKey(addDays(noon, -1)) }; // up to yesterday
  }
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
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}
