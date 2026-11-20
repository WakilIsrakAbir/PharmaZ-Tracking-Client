"use client";

// "Delete update…" from the ⋯ menu of a line in the history (admins only). Before anything is
// deleted, it asks the API what would change (a dry run) and says it in plain words:
//
//   Delete this update?
//   ┃ Dr. Abu Talha                                        the update: its status and visit,
//   ┃ [● Account Creation]  Visit Wed 4 Nov, 10:00 AM       who made it and when
//   ┃ Form submitted by Wakil Israk Abir · Mon 2 Nov, 9:40 AM
//   WHAT CHANGES
//   ✓ Stays at Account Creation · Tue 3 Nov, 10:00 AM      (↩ "Goes back to …" for the latest update)
//   ✕ Leaves the calendar on Wed 4 Nov                      (or comes back, changes, stays the same)
//   ✉ Nobody is emailed                                     (or who is emailed, or why nobody is)
//
// The dialog opens with the focus on Cancel. Deleting shows a toast with Undo for 10 seconds.

import { CalendarCheck, CalendarClock, CalendarPlus, CalendarX2, CircleCheck, LoaderCircle, Mail, MailX, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/components/app-shell/useUser";
import { madeAt, madeBy, statusLabel, typedNote, visitWhen } from "@/components/record-details/updates";
import { StatusBadge } from "@/components/shared/common";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteUpdate, useRestoreUpdate, useUpdateRemovalPreview } from "@/lib/api";
import { STATUSES, TYPES } from "@/lib/constants";
import { emailSummary, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DeleteUpdateDialog({ record, update, open, onOpenChange }) {
  const user = useUser();
  const preview = useUpdateRemovalPreview(record.type, record.id, update.at, { enabled: open });
  const deleteUpdate = useDeleteUpdate(record.type);
  const restoreUpdate = useRestoreUpdate(record.type);
  const name = record.name || `Unnamed ${TYPES[record.type].label.toLowerCase()}`;
  // The people who could be emailed: everyone assigned but me.
  const othersAssigned = record.assignedTo.filter((person) => person.email !== user?.email).length;

  async function confirmDelete() {
    try {
      const { meta } = await deleteUpdate.mutateAsync({ id: record.id, at: update.at });
      onOpenChange(false);
      const email = emailSummary(`Update deleted. ${afterDelete(name, meta.change)}`.trim(), meta.email);
      toast[email.problem ? "error" : "success"](email.text, {
        duration: 10_000,
        action: { label: "Undo", onClick: () => undo(meta.removal) },
      });
    } catch (error) {
      toast.error(error.message);
    }
  }

  // From the toast: put the update back.
  async function undo(removal) {
    try {
      const { meta } = await restoreUpdate.mutateAsync({ id: record.id, removal });
      const email = emailSummary("The update is back.", meta?.email);
      toast[email.problem ? "error" : "success"](email.text);
    } catch (error) {
      toast.error(error.message);
    }
  }

  const pending = deleteUpdate.isPending;
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true">
              <Trash2 className="size-4" />
            </span>
            Delete this update?
          </AlertDialogTitle>
          <AlertDialogDescription>It goes as if it had never been made, and the calendar follows. You can undo it right after.</AlertDialogDescription>
        </AlertDialogHeader>

        <UpdateCard name={name} update={update} />

        <section aria-label="What changes" aria-busy={preview.isPending}>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">What changes</h4>
          {preview.isPending ? (
            <div className="space-y-2.5" role="status">
              <span className="sr-only">Checking what changes…</span>
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          ) : preview.isError ? (
            <p className="text-sm text-destructive">{preview.error.message}</p>
          ) : (
            <ul className="space-y-2">
              {changeLines(preview.data, othersAssigned).map(({ icon: Icon, tone, text }, index) => (
                <li key={index} className="flex gap-2.5 text-sm">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} aria-hidden="true" />
                  <span className="min-w-0">{text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={confirmDelete} disabled={pending || !preview.isSuccess} className="bg-destructive text-white hover:bg-destructive/90">
            {pending && <LoaderCircle className="animate-spin" />}
            Delete update
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// The second sentence of the toast: "Dr. Abu Talha is back to Demo on Wed 18 Nov." when the
// latest update went, else "Dr. Abu Talha is off the calendar on Wed 4 Nov.", or nothing.
function afterDelete(name, { onboarding, calendar }) {
  const day = (date) => formatDate(date, "EEE d MMM");
  if (onboarding.changed) return `${name} is back to ${statusLabel(onboarding.after.status)} on ${day(onboarding.after.visitDate)}.`;
  if (calendar.removed.length) return `${name} is off the calendar on ${calendar.removed.map((visit) => day(visit.visitDate)).join(" and ")}.`;
  return "";
}

// The update being deleted, in the look of the day list: a bar in its status color, the name,
// the status and visit, the note, and who made it when.
function UpdateCard({ name, update }) {
  const note = typedNote(update);
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
      <span className={cn("w-1 shrink-0 rounded-full", STATUSES[update.status]?.dot)} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="leading-snug font-semibold">{name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={update.status} steps={update.steps} />
          <span className="text-muted-foreground tabular-nums">Visit {visitWhen(update)}</span>
        </div>
        {note && <p className="mt-1.5 wrap-break-word">&ldquo;{note}&rdquo;</p>}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {madeBy(update)} · <span className="whitespace-nowrap">{madeAt(update.at)}</span>
        </p>
      </div>
    </div>
  );
}

// The API's answer (meta.change), line by line: where the onboarding ends up, what the calendar
// does, and who is emailed. `othersAssigned` tells "nobody is assigned" from "only past days change".
function changeLines({ onboarding, calendar, emails }, othersAssigned) {
  const where = (state) => (
    <>
      <b className="font-semibold">{statusLabel(state.status)}</b> · <span className="whitespace-nowrap tabular-nums">{visitWhen(state)}</span>
    </>
  );
  const day = (visit) => <b className="font-semibold">{formatDate(visit.visitDate, "EEE d MMM")}</b>;
  const steps = (visit) => (visit.status === "implementation" && visit.steps ? ` · ${visit.steps.done}/${visit.steps.total} steps` : "");
  const lines = [
    onboarding.changed
      ? { icon: Undo2, tone: "text-status-setup-ink", text: <>Goes back to {where(onboarding.after)}</> }
      : { icon: CircleCheck, tone: "text-status-implementation-ink", text: <>Stays at {where(onboarding.after)}</> },
  ];

  for (const visit of calendar.removed) {
    lines.push({ icon: CalendarX2, tone: "text-destructive", text: <>Leaves the calendar on {day(visit)} ({statusLabel(visit.status)})</> });
  }
  for (const visit of calendar.added) {
    lines.push({ icon: CalendarPlus, tone: "text-primary", text: <>Comes back on the calendar on {day(visit)} ({statusLabel(visit.status)})</> });
  }
  for (const { after } of calendar.changed) {
    lines.push({
      icon: CalendarClock,
      tone: "text-primary",
      text: (
        <>
          {day(after)} becomes {statusLabel(after.status)}
          {steps(after)}, <span className="tabular-nums">{formatDate(after.visitDate, "h:mm a")}</span>
        </>
      ),
    });
  }
  if (calendar.removed.length + calendar.added.length + calendar.changed.length === 0) {
    lines.push({ icon: CalendarCheck, tone: "text-muted-foreground", text: "The calendar stays the same" });
  }

  if (emails.length) {
    lines.push({ icon: Mail, tone: "text-primary", text: <>Emails <b className="font-semibold">{emails.join(", ")}</b> the corrected visit</> });
  } else if (onboarding.changed && othersAssigned > 0) {
    lines.push({ icon: MailX, tone: "text-muted-foreground", text: "Nobody is emailed: only days that have passed change" });
  } else {
    lines.push({ icon: MailX, tone: "text-muted-foreground", text: "Nobody is emailed" });
  }
  return lines;
}
