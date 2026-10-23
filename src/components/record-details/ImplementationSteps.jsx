"use client";

import { useState } from "react";
import { ListChecks, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { countSteps, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Going live can take several visits, so the implementation is a checklist of steps,
// ticked off one by one. Changes here are saved with "Save update".
export function ImplementationSteps({ steps, onChange }) {
  const [newTitle, setNewTitle] = useState("");
  const progress = countSteps(steps);
  const canAdd = newTitle.trim().length >= 2;

  function addStep() {
    if (!canAdd) return;
    // A new step has no id until it's saved, so it gets a temporary key for the list.
    onChange([...steps, { key: `new-${Date.now()}`, title: newTitle.trim(), done: false, doneAt: null }]);
    setNewTitle("");
  }

  function toggleStep(index) {
    onChange(steps.map((step, i) => (i === index ? { ...step, done: !step.done } : step)));
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
              {step.done && step.doneAt && <span className="shrink-0 text-xs text-status-implementation-ink">{formatDate(step.doneAt, "d MMM")}</span>}
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
