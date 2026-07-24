import Link from "next/link";
import { cn } from "@/lib/utils";

export function ProductsPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1">
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            p === page ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
