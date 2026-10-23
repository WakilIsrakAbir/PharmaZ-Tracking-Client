import { RequiredLabel } from "@/components/record-form/NumberedField";
import { STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// The status, as three big choices.
export function StatusChoice({ register }) {
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-medium">
        <RequiredLabel>Status</RequiredLabel>
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {Object.entries(STATUSES).map(([value, status]) => (
          <label
            key={value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-secondary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input type="radio" value={value} className="mt-1 size-4 accent-primary" {...register("status")} />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn("size-2 rounded-full", status.dot)} />
                {status.label}
              </span>
              <span className="block text-xs text-muted-foreground">{status.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
