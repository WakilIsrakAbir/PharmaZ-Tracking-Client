import { cn } from "@/lib/utils";

// What to show when there is nothing yet, with a pointer to the next step.
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {description && <p className="mt-1.5 max-w-md text-sm text-balance text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
