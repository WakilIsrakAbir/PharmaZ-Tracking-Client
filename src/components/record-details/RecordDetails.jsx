"use client";

// Everything about one submitted doctor or pharmacy form. Two layouts:
//   layout="panel"  beside the calendar on the dashboard: Details, then Status
//   layout="page"   the full page at /doctors/:id or /pharmacies/:id, which also lists every form field
//
// The sections:
//   DetailsCard  read only: name and status, visit and place, phone and notes
//   StatusCard   the part you can change (status, next visit, note, implementation steps),
//                then the history, then who submitted the form
//   FormCard     all the numbered fields of the paper form (full page only)

import { SearchX } from "lucide-react";

import { DetailsCard } from "@/components/record-details/DetailsCard";
import { FormCard } from "@/components/record-details/FormCard";
import { PageActions } from "@/components/record-details/PageActions";
import { StatusCard } from "@/components/record-details/StatusCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecord } from "@/lib/api";
import { TYPES } from "@/lib/constants";

export function RecordDetails({ type, id, layout = "page" }) {
  const { data: record, isPending, isError } = useRecord(type, id);

  if (isPending) return <DetailsSkeleton />;
  if (isError || !record) {
    return <EmptyState icon={SearchX} title="We couldn't find this form" description="It may have been deleted, or the link is wrong." />;
  }

  if (layout === "panel") {
    return (
      <div className="space-y-3">
        <DetailsCard record={record} />
        <StatusCard record={record} editHref={`${TYPES[type].path}/${record.id}/edit`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: TYPES[type].path, label: TYPES[type].plural }} title={record.name} actions={<PageActions record={record} />} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <DetailsCard record={record} />
          <FormCard record={record} />
        </div>
        {/* Below the fixed "← back" link at the top of the screen. */}
        <div className="lg:sticky lg:top-14">
          <StatusCard record={record} />
        </div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
