"use client";

import { useState } from "react";
import { LoaderCircle, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { ImplementationSteps } from "@/components/record-details/ImplementationSteps";
import { StatusPicker } from "@/components/record-details/StatusPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateStatus } from "@/lib/api";
import { STATUSES } from "@/lib/constants";
import { dhakaDateTime, toDateInput, toTimeInput } from "@/lib/format";

// After each visit: a new status, the next visit, a note, and the implementation steps.
// It sits in a tinted box with a blue border, so it's clear at a glance that this part can be changed.
export function StatusUpdate({ record }) {
  const savedSteps = record.implementationSteps ?? [];
  const updateStatus = useUpdateStatus(record.type);
  const [status, setStatus] = useState(record.status);
  const [day, setDay] = useState(toDateInput(record.visitDate));
  const [time, setTime] = useState(toTimeInput(record.visitDate));
  const [note, setNote] = useState("");
  const [steps, setSteps] = useState(savedSteps);

  const visitDate = dhakaDateTime(day, time || "00:00");
  const statusChanged = status !== record.status;
  const dateChanged = visitDate !== new Date(record.visitDate).toISOString();
  const stepsChanged = JSON.stringify(stepsToSave(steps)) !== JSON.stringify(stepsToSave(savedSteps));
  const hasNote = note.trim() !== "";
  const canSave = Boolean(day) && (statusChanged || dateChanged || stepsChanged || hasNote) && !updateStatus.isPending;

  async function save() {
    const change = { id: record.id, status, visitDate, note: note.trim() };
    if (stepsChanged) change.implementationSteps = stepsToSave(steps);
    try {
      await updateStatus.mutateAsync(change);
      toast.success(statusChanged ? `${record.name} is now in ${STATUSES[status].label}.` : "Update saved.");
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
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" aria-label="Visit date" className="bg-background" value={day} onChange={(event) => setDay(event.target.value)} />
        <Input type="time" aria-label="Visit time" className="bg-background" value={time} onChange={(event) => setTime(event.target.value)} />
      </div>
      {status === "implementation" && <ImplementationSteps steps={steps} onChange={setSteps} />}
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

// What the API needs for each step: its id (when it is already saved), the title, and done or not.
const stepsToSave = (steps) => steps.map(({ id, title, done }) => ({ id, title, done }));
