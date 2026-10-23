import { Skeleton } from "@/components/ui/skeleton";

// Grey placeholder rows while the list loads.
export function RowsSkeleton() {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-3 p-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}
