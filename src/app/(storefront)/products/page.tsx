import { getProducts, type ProductSort } from "@/server/queries/product.queries";
import { getAllCategoriesFlat } from "@/server/queries/category.queries";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductFilters } from "@/components/storefront/product-filters";
import { ProductsPagination } from "@/components/shared/products-pagination";

type SearchParams = Record<string, string | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = sp.page ? Number(sp.page) : 1;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort = (sp.sort as ProductSort | undefined) ?? "newest";

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getProducts({ categorySlug: sp.category, q: sp.q, minPrice, maxPrice, sort, page }),
    getAllCategoriesFlat(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">
        {sp.q ? `Results for "${sp.q}"` : "All products"}
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <ProductFilters categories={categories} current={{ ...sp, sort }} />
        <div>
          <p className="mb-4 text-sm text-slate-500">{total} results</p>
          <ProductGrid products={products} />
          <ProductsPagination page={page} totalPages={totalPages} searchParams={sp} />
        </div>
      </div>
    </div>
  );
}
