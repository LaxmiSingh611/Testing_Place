import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-white p-3">
      <Skeleton className="mb-3 aspect-square w-full rounded-md" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
