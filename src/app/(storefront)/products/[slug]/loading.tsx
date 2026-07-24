import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
