import { CalendarDays, ExternalLink, Mail, MapPin, MessageCircle, Phone, StickyNote } from "lucide-react";

import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { Button } from "@/components/ui/button";
import { countSteps, formatDate, formatPhone, relativeDay, whatsappNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

// Section 1, read only: who and where, and how to reach them.
export function DetailsCard({ record }) {
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
        {record.notes && (
          <Row icon={StickyNote} label="Notes">
            <p className="font-normal whitespace-pre-line">{record.notes}</p>
          </Row>
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
