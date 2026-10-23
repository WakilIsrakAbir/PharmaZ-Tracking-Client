import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypeIcon } from "@/components/shared/TypeBadge";
import { countSteps, formatDate, formatPhone, relativeDay } from "@/lib/format";

// One form in the list: who, where, when, and its status. The whole row opens the form.
export function RecordRow({ record, path, showSubmitter }) {
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
