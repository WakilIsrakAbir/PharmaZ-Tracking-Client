import { Pill, Stethoscope } from "lucide-react";

import { TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// A stethoscope for doctors, a pill for pharmacies.
export function TypeIcon({ type, className }) {
  const Icon = type === "doctor" ? Stethoscope : Pill;
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}

export function TypeBadge({ type }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <TypeIcon type={type} className="size-3.5" />
      {TYPES[type].label}
    </span>
  );
}
