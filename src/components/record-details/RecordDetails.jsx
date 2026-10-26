"use client";

// Everything about one submitted doctor or pharmacy form. Two layouts:
//   layout="panel"  beside the calendar on the dashboard: Details, then Status
//   layout="page"   the full page at /doctors/:id or /pharmacies/:id, which also lists every form field
//
// The sections:
//   DetailsCard  read only: name and status, visit and place, phone and notes (below)
//   StatusCard   the part you can change (status, next visit, note, implementation steps),
//                then the history, then who submitted the form (StatusCard.jsx)
//   FormCard     all the numbered fields of the paper form (full page only, below)

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ExternalLink, Mail, MapPin, MessageCircle, Pencil, Phone, SearchX, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/components/app-shell/useUser";
import { Card, StatusCard } from "@/components/record-details/StatusCard";
import { Avatar, ConfirmDialog, EmptyState, PageHeader, StatusBadge, TypeBadge } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteRecord, useRecord } from "@/lib/api";
import { CONSULTATION_TYPES, FIELDS, PAYMENT_METHODS, TYPES } from "@/lib/constants";
import { countSteps, dashboardLink, formatAvailability, formatDate, formatPhone, formatTaka, relativeDay, whatsappNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

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

// The buttons at the top of the full page. Only admins can delete.
function PageActions({ record }) {
  const user = useUser();
  const router = useRouter();
  const deleteRecord = useDeleteRecord(record.type);
  const [confirming, setConfirming] = useState(false);
  const { path, label } = TYPES[record.type];

  async function confirmDelete() {
    try {
      await deleteRecord.mutateAsync(record.id);
      toast.success(`${record.name} was deleted.`);
      router.push(path);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <Button variant="outline" asChild>
        <Link href={dashboardLink(record)}>
          <CalendarDays /> Show on calendar
        </Link>
      </Button>
      <Button asChild>
        <Link href={`${path}/${record.id}/edit`}>
          <Pencil /> Edit form
        </Link>
      </Button>
      {user?.role === "admin" && (
        <>
          <Button variant="outline" onClick={() => setConfirming(true)} aria-label={`Delete ${record.name}`} className="text-destructive">
            <Trash2 />
          </Button>
          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            title={`Delete ${record.name}?`}
            description={`This removes the ${label.toLowerCase()} form, its photo and its history for everyone. It can't be undone.`}
            confirmLabel="Delete"
            destructive
            pending={deleteRecord.isPending}
            onConfirm={confirmDelete}
          />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Section 1, read only: who and where, and how to reach them
// ---------------------------------------------------------------------------
function DetailsCard({ record }) {
  const subtitle = subtitleOf(record);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.address)}`;

  return (
    <section aria-label="Details" className="divide-y overflow-hidden rounded-xl border bg-card">
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <Avatar name={record.name} photoUrl={record.photoUrl} className="size-16 rounded-xl text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={record.type} />
            <StatusBadge status={record.status} steps={countSteps(record.implementationSteps)} />
          </div>
          <h2 className="mt-2 text-lg leading-snug font-semibold">{record.name}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {/* When the visit is, and where (for a doctor, the chamber and its address). */}
        <Row icon={CalendarDays} label="Date and time">
          {relativeDay(record.visitDate, new Date())}, {formatDate(record.visitDate, "d MMM yyyy · h:mm a")}
        </Row>
        <Row icon={MapPin} label="Location">
          {record.chamberName && (
            <span className="block">
              {record.chamberName}
              {record.chamberNo && ` · ${record.chamberNo}`}
            </span>
          )}
          <span className={cn("block", record.chamberName && "font-normal text-muted-foreground")}>{record.address}</span>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Open in Google Maps <ExternalLink className="size-3.5" />
          </a>
        </Row>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <Row icon={Phone} label="Phone">
          <span className="tabular-nums">{formatPhone(record.phone)}</span>
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${record.phone}`}>
              <Phone /> Call
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`https://wa.me/${whatsappNumber(record.phone)}`} target="_blank" rel="noreferrer">
              <MessageCircle /> WhatsApp
            </a>
          </Button>
        </div>
        {record.email && (
          <Row icon={Mail} label="Email">
            <a href={`mailto:${record.email}`} className="hover:underline">
              {record.email}
            </a>
          </Row>
        )}
        {/* Notes get a soft green box, so they catch the eye among the grey rows. */}
        {record.notes && (
          <div className="rounded-lg border border-status-implementation/40 bg-status-implementation-soft p-3">
            <Row icon={StickyNote} label="Notes">
              <p className="font-normal whitespace-pre-line">{record.notes}</p>
            </Row>
          </div>
        )}
      </div>
    </section>
  );
}

// An icon, a small grey label, and the value under it.
function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <div className="font-medium wrap-break-word">{children}</div>
      </div>
    </div>
  );
}

// Doctors show their BMDC number under the name; pharmacies show the owner.
function subtitleOf(record) {
  if (record.type === "doctor" && record.bmdcRegNo) return `BMDC ${record.bmdcRegNo}`;
  if (record.type === "pharmacy" && record.ownerName) return `Owner: ${record.ownerName}`;
  return "";
}

// ---------------------------------------------------------------------------
// Full page only: every numbered field, as on the paper form
// ---------------------------------------------------------------------------
function FormCard({ record }) {
  const rows = record.type === "doctor" ? doctorRows(record) : pharmacyRows(record);
  return (
    <Card title={TYPES[record.type].formTitle}>
      <dl className="divide-y">
        {rows.map(([no, label, value]) => (
          <div key={no} className="flex gap-3 py-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {no}
            </span>
            <dt className="w-32 shrink-0 text-sm text-muted-foreground sm:w-40">{label}</dt>
            <dd className="min-w-0 flex-1 text-sm font-medium wrap-break-word">
              {value || <span className="font-normal text-muted-foreground/70">Not given</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// The rows of each form: [number, label, value shown]
const labelOf = (options, value) => options.find((option) => option.value === value)?.label ?? value;
const row = ([no, label], value) => [no, label, value];

function yesOrNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

function doctorRows(record) {
  const f = FIELDS.doctor;
  return [
    row(f.name, record.name),
    row(f.photo, record.photoUrl ? "Attached" : ""),
    row(f.bmdcRegNo, record.bmdcRegNo),
    row(f.phone, formatPhone(record.phone)),
    row(f.email, record.email),
    row(f.chamberName, record.chamberName),
    row(f.address, record.address),
    row(f.consultationTypes, record.consultationTypes.map((value) => labelOf(CONSULTATION_TYPES, value)).join(", ")),
    row(f.chamberNo, record.chamberNo),
    row(f.slotDuration, record.slotDuration ? `${record.slotDuration} mins` : ""),
    row(f.available, formatAvailability(record)),
    row(f.firstVisit, formatTaka(record.fees?.firstVisit)),
    row(f.reportView, formatTaka(record.fees?.reportView)),
    row(f.secondVisit, formatTaka(record.fees?.secondVisit)),
    row(f.afterOneMonth, formatTaka(record.fees?.afterOneMonth)),
  ];
}

function pharmacyRows(record) {
  const f = FIELDS.pharmacy;
  return [
    row(f.name, record.name),
    row(f.photo, record.photoUrl ? "Attached" : ""),
    row(f.ownerName, record.ownerName),
    row(f.phone, formatPhone(record.phone)),
    row(f.email, record.email),
    row(f.drugLicenseNo, record.drugLicenseNo),
    row(f.tradeLicenseNo, record.tradeLicenseNo),
    row(f.address, record.address),
    row(f.area, record.area),
    row(f.district, record.district),
    row(f.available, formatAvailability(record)),
    row(f.homeDelivery, yesOrNo(record.homeDelivery)),
    row(f.paymentMethods, record.paymentMethods.map((value) => labelOf(PAYMENT_METHODS, value)).join(", ")),
  ];
}

function DetailsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
