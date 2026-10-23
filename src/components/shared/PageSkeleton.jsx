import { Skeleton } from "@/components/ui/skeleton";

// Grey placeholder shapes while a page loads.
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
