import { Skeleton } from "@/components/ui/skeleton";

// Grey placeholder rows while the team loads.
export function RowsSkeleton() {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading the team">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      ))}
    </div>
  );
}
