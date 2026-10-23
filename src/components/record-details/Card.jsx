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
