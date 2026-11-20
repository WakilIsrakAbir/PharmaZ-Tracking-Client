"use client";

// Section 2 of a form's details, the part you can change:
//   StatusUpdate         new status, next visit, a note, and the implementation steps
//   ImplementationSteps  the checklist shown while the status is Implementation
//   History              every update, newest first (admins can delete one: DeleteUpdateDialog.jsx)
// Who submitted the form and who is assigned are at the top of the details (RecordDetails.jsx).

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronUp, Ellipsis, ListChecks, LoaderCircle, Pencil, PencilLine, Plus, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/components/app-shell/useUser";
import { AssignDialog } from "@/components/record-details/AssignDialog";
import { DeleteUpdateDialog } from "@/components/record-details/DeleteUpdateDialog";
import { madeAt, madeBy, statusLabel, typedNote, visitWhen } from "@/components/record-details/updates";
import { TimeSelect, movedEndTime } from "@/components/shared/TimeSelect";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateStatus } from "@/lib/api";
import { STATUSES } from "@/lib/constants";
import { countSteps, dayKey, dhakaDateTime, emailSummary, formatDate, toDateInput, toTimeInput } from "@/lib/format";
import { cn } from "@/lib/utils";

// A white box with an optional title. `action` (a button) sits on the right of the title.
export function Card({ title, action, children, className }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// `editHref` puts the "Edit form" button beside the title (the full page has it at the top instead).
// `highlightDay` marks the history lines of that day's visit (see History).
export function StatusCard({ record, editHref, highlightDay }) {
  const editButton = editHref && (
    <Button variant="outline" size="sm" asChild>
      <Link href={editHref}>
        <Pencil /> Edit form
      </Link>
    </Button>
  );

  return (
    <Card title="Status" action={editButton}>
      {/* The `key` gives a fresh form after every saved change. */}
      <StatusUpdate key={record.updatedAt} record={record} />
      <CardPart title="History">
        {/* A fresh list (folded or not) for each marked day. */}
        <History key={highlightDay ?? ""} record={record} highlightDay={highlightDay} />
      </CardPart>
    </Card>
  );
}

// A part of a card under a thin line, with a small grey title ("HISTORY").
function CardPart({ title, children }) {
  return (
    <div className="mt-5 border-t pt-4">
      <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h4>
      {children}
    </div>
  );
}

// After each visit: a new status, the next visit, a note, and the implementation steps.
// It sits in a tinted box with a blue border, so it's clear at a glance that this part can be changed.
function StatusUpdate({ record }) {
  const savedSteps = record.implementationSteps ?? [];
  const updateStatus = useUpdateStatus(record.type);
  // Marketing people move visits to today or later; an admin may also put one on a day that has passed.
  const isAdmin = useUser()?.role === "admin";
  const earliestDay = isAdmin ? undefined : dayKey(new Date());
  const [status, setStatus] = useState(record.status);
  const [day, setDay] = useState(toDateInput(record.visitDate));
  const [time, setTime] = useState(toTimeInput(record.visitDate));
  const [endTime, setEndTime] = useState(record.visitEndDate ? toTimeInput(record.visitEndDate) : ""); // "" = no end time
  const [note, setNote] = useState("");
  const [steps, setSteps] = useState(savedSteps);
  // Admins: who goes on the visit this update sets. It starts as who goes on the current visit (null
  // for nobody), so a rescheduled visit keeps them; change it when other people go on the next visit.
  const current = record.visits?.find((visit) => visit.current);
  const savedTeam = current?.assignedTo.length ? current.assignedTo : null;
  const [team, setTeam] = useState(savedTeam);
  const [pickingTeam, setPickingTeam] = useState(false);

  const visitDate = dhakaDateTime(day, time || "00:00");
  const visitEndDate = endTime ? dhakaDateTime(day, endTime) : null;
  const statusChanged = status !== record.status;
  const dateChanged = visitDate !== new Date(record.visitDate).toISOString();
  const endChanged = visitEndDate !== (record.visitEndDate ? new Date(record.visitEndDate).toISOString() : null);
  const stepsChanged = JSON.stringify(stepsToSave(steps)) !== JSON.stringify(stepsToSave(savedSteps));
  const hasNote = note.trim() !== "";
  const teamChanged = isAdmin && teamKey(team) !== teamKey(savedTeam);
  const canSave = Boolean(day) && (statusChanged || dateChanged || endChanged || stepsChanged || hasNote || teamChanged) && !updateStatus.isPending;

  // A new start time takes the end time along, so the visit keeps its length.
  function changeStartTime(next) {
    setEndTime(movedEndTime(time, endTime, next));
    setTime(next);
  }

  // Only the days the steps were done, or only who goes, changed: the API adds no history line for that.
  const visitSame = !statusChanged && !dateChanged && !endChanged && !hasNote;
  const onlyStepDays = visitSame && !teamChanged && stepsChanged && sameSteps(withoutDays(steps), withoutDays(savedSteps));
  const onlyTeam = visitSame && !stepsChanged && teamChanged;

  async function save() {
    const change = { id: record.id, status, visitDate, visitEndDate, note: note.trim() };
    if (stepsChanged) change.implementationSteps = stepsToSave(steps);
    // An admin always says who goes on the visit being saved ([] for nobody).
    if (isAdmin) change.visitTeam = (team ?? []).map(({ email, name, teammate }) => (teammate ? { email } : { email, name }));
    try {
      // A new status or visit time is emailed to everyone assigned; say who got it, and in red who didn't.
      const { meta } = await updateStatus.mutateAsync(change);
      const saved = statusChanged
        ? `${record.name || "Form"} is now in ${STATUSES[status].label}.`
        : onlyStepDays
          ? "Step dates saved."
          : onlyTeam
            ? "Who goes saved."
            : "Update saved.";
      const email = emailSummary(saved, meta?.email);
      if (email.problem) toast.error(email.text, { duration: 10_000 });
      else toast.success(email.text);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-ring/40 bg-secondary/60 p-3 sm:p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
        <PencilLine className="size-3.5" aria-hidden="true" /> Update after each visit
      </p>
      <StatusPicker value={status} onChange={setStatus} />
      {/* When: the day, then the start and (optional) end time side by side. */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        <label htmlFor={`visit-day-${record.id}`} className="col-span-2 text-xs font-medium text-muted-foreground">
          Visit date
        </label>
        <Input
          id={`visit-day-${record.id}`}
          type="date"
          min={earliestDay}
          className="col-span-2 bg-background"
          value={day}
          onChange={(event) => setDay(event.target.value)}
        />
        <label htmlFor={`visit-start-${record.id}`} className="mt-1 text-xs font-medium text-muted-foreground">
          Start
        </label>
        <label htmlFor={`visit-end-${record.id}`} className="mt-1 text-xs font-medium text-muted-foreground">
          End <span className="font-normal">(optional)</span>
        </label>
        <TimeSelect id={`visit-start-${record.id}`} value={time} onChange={changeStartTime} />
        <TimeSelect id={`visit-end-${record.id}`} value={endTime} onChange={setEndTime} after={time} optional placeholder="No end time" />
      </div>
      {/* Admins: who goes on this visit, chosen in the Assign dialog (nothing is saved until Save update). */}
      {isAdmin && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Who goes</p>
          <button
            type="button"
            onClick={() => setPickingTeam(true)}
            aria-label={`Who goes: ${teamLabel(team)}. Change`}
            className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{teamLabel(team)}</span>
            <span className="shrink-0 text-xs font-semibold text-primary">Change</span>
          </button>
          <AssignDialog open={pickingTeam} onOpenChange={setPickingTeam} record={record} pick={{ day, people: team, onPick: setTeam }} />
        </div>
      )}
      {status === "implementation" && <ImplementationSteps steps={steps} savedSteps={savedSteps} onChange={setSteps} />}
      <Textarea
        rows={2}
        className="bg-background"
        placeholder="Add a note (optional), e.g. Training done"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <Button className="w-full" onClick={save} disabled={!canSave}>
        {updateStatus.isPending && <LoaderCircle className="animate-spin" />}
        Save update
      </Button>
    </div>
  );
}

// What the API needs for each step: its id (when it is already saved), the title, done or not, and
// for a done step the day it was done (null for a step just ticked: the API puts today).
const stepsToSave = (steps) => steps.map(({ id, title, done, doneAt }) => ({ id, title, done, doneAt: done ? (doneAt ?? null) : null }));
const withoutDays = (steps) => stepsToSave(steps).map(({ doneAt, ...step }) => step);

// Who goes, as one comparable string ("" for nobody), and in words.
const teamKey = (people) => (people ?? []).map((person) => person.email).sort().join("|");
const teamLabel = (people) => (people?.length ? people.map((person) => person.name).join(", ") : "No one chosen yet");
const sameSteps = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// The five statuses as buttons that wrap evenly (3 + 2 in the panel). The chosen one is filled in.
function StatusPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-1.5">
      {Object.entries(STATUSES).map(([status, { label, dot }]) => {
        const isChosen = value === status;
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={isChosen}
            onClick={() => onChange(status)}
            className={cn(
              "flex flex-auto basis-[30%] items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isChosen ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <span className={cn("size-2 shrink-0 rounded-full", dot, isChosen && "ring-2 ring-primary-foreground/70")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Going live can take several visits, so the implementation is a checklist of steps,
// ticked off one by one. Each done step shows the day it was done, which can be changed (StepDay).
// Changes here are saved with "Save update". `savedSteps` is the checklist as saved.
function ImplementationSteps({ steps, savedSteps, onChange }) {
  const [newTitle, setNewTitle] = useState("");
  const progress = countSteps(steps);
  const canAdd = newTitle.trim().length >= 2;

  function addStep() {
    if (!canAdd) return;
    // A new step has no id until it's saved, so it gets a temporary key for the list.
    onChange([...steps, { key: `new-${Date.now()}`, title: newTitle.trim(), done: false, doneAt: null }]);
    setNewTitle("");
  }

  // Ticking a step again before saving brings back the day it was done, if it was; a new tick gets
  // today when saved (until then the day reads "Today").
  function toggleStep(index) {
    onChange(
      steps.map((step, i) => {
        if (i !== index) return step;
        if (step.done) return { ...step, done: false, doneAt: null };
        const saved = savedSteps.find((old) => old.id && old.id === step.id && old.done);
        return { ...step, done: true, doneAt: saved?.doneAt ?? null };
      }),
    );
  }

  function changeDay(index, doneAt) {
    onChange(steps.map((step, i) => (i === index ? { ...step, doneAt } : step)));
  }

  function removeStep(index) {
    onChange(steps.filter((step, i) => i !== index));
  }

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <ListChecks className="size-4 text-status-implementation-ink" aria-hidden="true" /> Implementation steps
        </p>
        {progress && (
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            {progress.done} of {progress.total} done
          </p>
        )}
      </div>

      {progress ? (
        <div
          role="progressbar"
          aria-label="Steps done"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-status-implementation transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Going live in more than one visit? Add the steps (for example &ldquo;Train the assistant&rdquo;) and tick them off as you go.
        </p>
      )}

      {steps.length > 0 && (
        <ul className="mt-3 space-y-0.5">
          {steps.map((step, index) => (
            <li key={step.id ?? step.key} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={step.done} onChange={() => toggleStep(index)} className="size-4 shrink-0 accent-status-implementation" />
                <span className={cn("min-w-0 text-sm wrap-break-word", step.done && "text-muted-foreground line-through")}>{step.title}</span>
              </label>
              {step.done && <StepDay step={step} onChange={(doneAt) => changeDay(index, doneAt)} />}
              <button
                type="button"
                onClick={() => removeStep(index)}
                aria-label={`Remove the step "${step.title}"`}
                className="shrink-0 rounded p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addStep();
          }}
          placeholder="Add a step…"
          aria-label="New step"
          maxLength={120}
          className="h-8"
        />
        <Button type="button" variant="outline" size="sm" onClick={addStep} disabled={!canAdd}>
          <Plus /> Add
        </Button>
      </div>
    </div>
  );
}

// The day a done step was done, as a small chip ("📅 18 Nov") that opens the date picker: today or
// an earlier day. The picker is the browser's own (the same as the visit date's): an invisible date
// input over the chip, so a tap or a click opens it, and the keyboard works too.
function StepDay({ step, onChange }) {
  const today = dayKey(new Date());
  const value = step.doneAt ? dayKey(step.doneAt) : today;
  const thisYear = !step.doneAt || formatDate(step.doneAt, "yyyy") === today.slice(0, 4);
  const label = step.doneAt ? formatDate(step.doneAt, thisYear ? "d MMM" : "d MMM yyyy") : "Today";

  function pick(day) {
    // Noon in Dhaka, so the day is the same whatever the time zone it is read in.
    if (day && day <= today && day !== value) onChange(dhakaDateTime(day, "12:00"));
  }

  return (
    <span className="relative shrink-0">
      <input
        type="date"
        required
        max={today}
        value={value}
        onChange={(event) => pick(event.target.value)}
        onClick={(event) => {
          try {
            event.currentTarget.showPicker(); // Chrome opens it only from its icon otherwise
          } catch {
            // an older browser: it opens the picker by itself, or lets the day be typed
          }
        }}
        aria-label={`Day "${step.title}" was done`}
        title="Change the day it was done"
        className="peer absolute inset-0 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-status-implementation-ink tabular-nums transition-colors peer-hover:border-status-implementation/40 peer-hover:bg-status-implementation-soft peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50"
      >
        <CalendarDays className="size-3" />
        {label}
      </span>
    </span>
  );
}

// Every update, newest first, one line each:
//   ● Account Creation  [Now]                                   ⋯
//     Visit Tue 3 Nov, 10:00 AM
//     "Training done"                                  (the note, when one was typed)
//     Updated by Wakil Israk Abir · Wed 4 Nov, 2:15 PM
// The newest is where the onboarding stands now. Assigning people isn't an update, so it has no line.
// Admins can delete an update (⋯ → Delete update…), as if it had never been made: the calendar
// follows (DeleteUpdateDialog.jsx). The only update can't be deleted (delete the form instead).
// `highlightDay` (a Dhaka day) marks the updates of that day's visit: the dashboard passes the day of
// an earlier visit opened from the calendar, so it's clear which line to delete.
// Only the newest two show at first; "See N more" unfolds the rest (unfolded when a marked line would
// be hidden).
const HISTORY_PREVIEW = 2;

function History({ record, highlightDay }) {
  const isAdmin = useUser()?.role === "admin";
  const newestFirst = [...record.history].reverse();
  const marked = (entry) => Boolean(highlightDay) && dayKey(entry.visitDate) === highlightDay;
  const [expanded, setExpanded] = useState(() => newestFirst.findIndex(marked) >= HISTORY_PREVIEW);
  // The update in the "Delete update" dialog. It stays set while the dialog closes, so its content
  // doesn't vanish during the animation.
  const [deleting, setDeleting] = useState({ open: false, update: null });
  const shown = expanded ? newestFirst : newestFirst.slice(0, HISTORY_PREVIEW);
  const hidden = newestFirst.length - shown.length;
  return (
    <>
      <ol className="space-y-4">
        {shown.map((entry, index) => {
          const isLastShown = index === shown.length - 1;
          const isMarked = marked(entry);
          const note = typedNote(entry);
          return (
            <li key={entry.at} className="relative pl-5" data-marked-update={isMarked || undefined}>
              <span className={cn("absolute top-1.5 left-0 size-2.5 rounded-full ring-4 ring-card", STATUSES[entry.status]?.dot)} aria-hidden="true" />
              {!isLastShown && <span className="absolute top-4 -bottom-5 left-[4.5px] w-px bg-border" aria-hidden="true" />}
              <div className={cn("flex items-start gap-2", isMarked && "-mx-2 -my-1.5 rounded-lg bg-status-setup-soft px-2 py-1.5 ring-1 ring-status-setup/40")}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-semibold">{statusLabel(entry.status)}</span>
                    {index === 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold tracking-wide text-primary uppercase">Now</span>
                    )}
                    {isMarked && <span className="sr-only">(the visit opened from the calendar)</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">Visit {visitWhen(entry)}</p>
                  {entry.steps && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-status-implementation-ink">
                      <ListChecks className="size-3.5" aria-hidden="true" /> {entry.steps.done} of {entry.steps.total} steps done
                    </p>
                  )}
                  {note && <p className="mt-0.5 text-sm wrap-break-word">{note}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                  {madeBy(entry)} · <span className="whitespace-nowrap">{madeAt(entry.at)}</span>
                </p>
                </div>
                {isAdmin && (
                  <UpdateMenu
                    entry={entry}
                    onlyOne={newestFirst.length === 1}
                    onDelete={() => setDeleting({ open: true, update: entry })}
                  />
                )}
              </div>
            </li>
          );
        })}
        {(hidden > 0 || expanded) && (
          <li className="pl-5">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-4" aria-hidden="true" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" aria-hidden="true" /> See {hidden} more
                </>
              )}
            </button>
          </li>
        )}
      </ol>
      {deleting.update && (
        <DeleteUpdateDialog
          record={record}
          update={deleting.update}
          open={deleting.open}
          onOpenChange={(open) => setDeleting((current) => ({ ...current, open }))}
        />
      )}
    </>
  );
}

// ⋯ beside an update (admins only). The only update can't be deleted: the item says why.
function UpdateMenu({ entry, onlyOne, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="-my-1 shrink-0 text-muted-foreground" aria-label={`Actions for the update of ${madeAt(entry.at)}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem variant="destructive" disabled={onlyOne} onSelect={onDelete}>
          <Trash2 /> Delete update…
        </DropdownMenuItem>
        {onlyOne && <p className="px-1.5 pt-1 pb-1.5 text-xs text-muted-foreground">This is the only update. To remove it, delete the whole form.</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
