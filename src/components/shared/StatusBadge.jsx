import { STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// "● Setup" in the status color. In Implementation it also shows the steps done: "● Implementation · 2/4".
// `steps` is { done, total } or null.
export function StatusBadge({ status, steps, className }) {
  const { label, badge, dot } = STATUSES[status] ?? STATUSES.ongoing;
  const showSteps = status === "implementation" && steps?.total > 0;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", badge, className)}>
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {label}
      {showSteps && (
        <>
          <span className="font-medium tabular-nums" aria-hidden="true">
            · {steps.done}/{steps.total}
          </span>
          <span className="sr-only">
            , {steps.done} of {steps.total} steps done
          </span>
        </>
      )}
    </span>
  );
}
