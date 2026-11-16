"use client";

// A time picker that looks like the other boxes on the forms: a box with the time ("10:00 AM") that
// opens a list of times every 15 minutes, scrolled to the chosen one (type "2" to jump to 2:00).
// Values are "HH:mm" (24-hour), like <input type="time">, and "" for none.
//   <TimeSelect value={start} onChange={setStart} />
//   <TimeSelect value={end} onChange={setEnd} after={start} optional />   an end time: only later
//     times, each with how long the visit would be ("11:30 AM  1 hr 30 min"), and "No end time"
//     (`noneLabel` names that choice for other optional times, e.g. "Not set")
// A saved time that isn't on the 15-minute list (7:05 PM) is kept in the list, so it isn't lost.

import { Check, ChevronDown, Clock } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { formatMinutes, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEP = 15; // minutes between two times in the list
const DAY = 24 * 60;
const NONE = "none"; // "No end time": every option needs a value that isn't ""

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const fromMinutes = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Every time of the day on the list, or only those after `after`; plus `value` when it is off the list.
function timesFor(value, after) {
  const earliest = after ? toMinutes(after) + 1 : 0;
  const times = [];
  for (let minutes = Math.ceil(earliest / STEP) * STEP; minutes < DAY; minutes += STEP) times.push(minutes);
  if (value && toMinutes(value) >= earliest && !times.includes(toMinutes(value))) {
    times.push(toMinutes(value));
    times.sort((a, b) => a - b);
  }
  return times.map(fromMinutes);
}

// Where the end time goes when the start time moves: it keeps the visit's length, like a calendar
// app, and is dropped when it would pass midnight. "" stays "" (no end time).
export function movedEndTime(oldStart, oldEnd, newStart) {
  if (!oldEnd || !newStart) return "";
  const length = oldStart ? toMinutes(oldEnd) - toMinutes(oldStart) : 60;
  const end = toMinutes(newStart) + (length > 0 ? length : 60);
  return end < DAY ? fromMinutes(end) : "";
}

export function TimeSelect({ id, value, onChange, after, optional = false, noneLabel = "No end time", placeholder = "Pick a time", invalid = false, className, ...props }) {
  const times = timesFor(value, after);
  return (
    <SelectPrimitive.Root value={value || (optional ? NONE : "")} onValueChange={(next) => onChange(next === NONE ? "" : next)}>
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-background px-3 text-left text-base tabular-nums transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground md:text-sm",
          className,
        )}
        {...props}
      >
        <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <SelectPrimitive.Viewport className="max-h-64 scroll-my-1 p-1">
            {optional && <TimeOption value={NONE}>{noneLabel}</TimeOption>}
            {times.map((time) => (
              <TimeOption key={time} value={time} hint={after ? formatMinutes(toMinutes(time) - toMinutes(after)) : ""}>
                {formatTime(time)}
              </TimeOption>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// One time in the list. Only the time itself shows in the box once chosen, not the `hint`.
function TimeOption({ value, hint, children }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex cursor-default items-center gap-3 rounded-md py-1.5 pr-8 pl-2.5 text-sm tabular-nums outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[state=checked]:font-semibold"
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {hint && <span className="ml-auto text-xs font-normal text-muted-foreground">{hint}</span>}
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <Check className="size-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
