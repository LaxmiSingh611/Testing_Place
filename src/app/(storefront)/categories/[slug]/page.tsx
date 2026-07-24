import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/server/queries/category.queries";
import { getProducts, type ProductSort } from "@/server/queries/product.queries";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductsPagination } from "@/components/shared/products-pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category ? `${category.name} — bazaar.in` : "Category not found" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = sp.page ? Number(sp.page) : 1;
  const sort = (sp.sort as ProductSort | undefined) ?? "newest";
  const { products, total, totalPages } = await getProducts({ categorySlug: slug, sort, page });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">{category.name}</h1>

      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="rounded-full border bg-white px-3 py-1 text-sm text-slate-700 hover:border-amber-400 hover:text-amber-600"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <p className="mb-4 text-sm text-slate-500">{total} results</p>
      <ProductGrid products={products} />
      <ProductsPagination page={page} totalPages={totalPages} searchParams={{ ...sp, sort }} />
    </div>
  );
}
