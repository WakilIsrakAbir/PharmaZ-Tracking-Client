import { ListChecks } from "lucide-react";

import { STATUSES } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

// Newest first: the status, the visit date, the steps done, the note, and who changed it when.
// The oldest entry is the form being submitted: who submitted it, and when, is shown under "Submitted by".
export function History({ history }) {
  const newestFirst = [...history].reverse();
  return (
    <ol className="space-y-4">
      {newestFirst.map((entry, index) => {
        const isOldest = index === newestFirst.length - 1;
        return (
          <li key={`${entry.at}-${index}`} className="relative pl-5">
            <span className={cn("absolute top-1.5 left-0 size-2.5 rounded-full ring-4 ring-card", STATUSES[entry.status]?.dot)} aria-hidden="true" />
            {!isOldest && <span className="absolute top-4 -bottom-5 left-[4.5px] w-px bg-border" aria-hidden="true" />}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold">{STATUSES[entry.status]?.label}</span>
              <span className="text-muted-foreground">· visit {formatDate(entry.visitDate, "d MMM, h:mm a")}</span>
            </div>
            {entry.steps && (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-status-implementation-ink">
                <ListChecks className="size-3.5" aria-hidden="true" /> {entry.steps.done} of {entry.steps.total} steps done
              </p>
            )}
            {!isOldest && (
              <>
                {entry.note && <p className="mt-0.5 text-sm">{entry.note}</p>}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.by?.name ?? "Someone"} · {timeAgo(entry.at)}
                </p>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
