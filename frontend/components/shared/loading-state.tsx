import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "table" | "cards";
  /** Number of rows (table) or cards to render */
  count?: number;
  /** Number of columns for the table skeleton */
  columns?: number;
  className?: string;
}

export function LoadingState({
  variant = "table",
  count = 5,
  columns = 4,
  className,
}: LoadingStateProps) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between pt-1">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table variant
  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Header row */}
      <div className="flex gap-4 px-4 py-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-md border px-4 py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={j}
              className={cn("h-4 flex-1", j === 0 ? "max-w-[120px]" : "")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
