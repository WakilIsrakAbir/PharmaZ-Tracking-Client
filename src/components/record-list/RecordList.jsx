"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ChevronRight, Pill, Plus, Search, Stethoscope, TriangleAlert } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import { Avatar, EmptyState, PageHeader, StatusBadge, TypeIcon } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecords } from "@/lib/api";
import { STATUSES, TYPES } from "@/lib/constants";
import { countSteps, formatDate, formatPhone, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

// /doctors and /pharmacies, newest visit first. Admins see every form, with who submitted it;
// marketing people see the forms they submitted.
export function RecordList({ type }) {
  const isAdmin = useUser()?.role === "admin";
  const { label, plural, path } = TYPES[type];
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim());
  const { data, isPending, isError, refetch } = useRecords(type, { search: query, status });
  const records = data?.data ?? [];
  const counts = data?.meta?.counts;

  const tabs = [{ value: "", label: "All", count: counts?.all }].concat(
    Object.entries(STATUSES).map(([value, { label: statusLabel }]) => ({ value, label: statusLabel, count: counts?.[value] })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={plural}
        description={
          isAdmin
            ? `Every ${label.toLowerCase()} form the team has submitted, and where each one stands.`
            : `The ${label.toLowerCase()} forms you have submitted, and where each one stands.`
        }
        actions={
          <Button asChild>
            <Link href={`${path}/new`}>
              <Plus /> New {label.toLowerCase()} form
            </Link>
          </Button>
        }
      />

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => setStatus(tab.value)}
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder={type === "doctor" ? "Search name, phone, BMDC, chamber" : "Search name, phone, owner, area"}
              aria-label={`Search ${plural.toLowerCase()}`}
              className="pl-9"
            />
          </div>
        </div>

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
            icon={query || status ? Search : type === "doctor" ? Stethoscope : Pill}
            title={query || status ? "Nothing matches" : `No ${label.toLowerCase()} forms yet`}
            description={
              query || status
                ? "Try a different search or status."
                : `When ${isAdmin ? "someone submits" : "you submit"} a ${label.toLowerCase()} form, it shows up here and on the calendar.`
            }
            action={
              !query &&
              !status && (
                <Button asChild>
                  <Link href={`${path}/new`}>
                    <Plus /> Fill in the first {label.toLowerCase()} form
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y">
            <li className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_10rem_9rem_1.5rem] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid">
              <span>{label}</span>
              <span>Location</span>
              <span>Date and time</span>
              <span>Status</span>
              <span />
            </li>
            {records.map((record) => (
              <RecordRow key={record.id} record={record} path={path} showSubmitter={isAdmin} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RecordRow({ record, path, showSubmitter }) {
  const place = record.type === "doctor" ? record.chamberName || record.address : [record.area, record.district].filter(Boolean).join(", ") || record.address;
  return (
    <li>
      <Link
        href={`${path}/${record.id}`}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_10rem_9rem_1.5rem]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={record.name} photoUrl={record.photoUrl} className="size-10" />
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
          {showSubmitter && <p className="truncate text-xs text-muted-foreground">by {record.createdBy?.name ?? "someone"}</p>}
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
