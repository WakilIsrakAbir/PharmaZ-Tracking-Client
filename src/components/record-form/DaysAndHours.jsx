import { Input } from "@/components/ui/input";
import { DAYS } from "@/lib/constants";

// Field 11: which days, and from–to hours.
export function DaysAndHours({ register }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map(({ value, label }) => (
          <label
            key={value}
            className="cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors select-none hover:bg-muted/50 has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input type="checkbox" value={value} className="sr-only" {...register("availableDays")} />
            {label}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">From</span>
        <Input type="time" aria-label="From" className="w-36" {...register("availableFrom")} />
        <span className="text-muted-foreground">to</span>
        <Input type="time" aria-label="To" className="w-36" {...register("availableTo")} />
      </div>
    </div>
  );
}
