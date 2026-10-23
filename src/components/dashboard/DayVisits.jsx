"use client";

import { UserRound } from "lucide-react";

import { NewFormButtons } from "@/components/dashboard/NewFormButtons";
import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypeIcon } from "@/components/shared/TypeBadge";
import { dhakaDateTime, formatDate, relativeDay } from "@/lib/format";

// Right side of the dashboard, when no visit is picked: the visits on the picked day.
// Admins see the whole team's visits, so each one also says whose it is.
export function DayVisits({ day, now, visits, showSubmitter, onPickVisit }) {
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
