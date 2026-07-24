import Link from "next/link";
import { getFeaturedProducts } from "@/server/queries/product.queries";
import { getTopLevelCategories } from "@/server/queries/category.queries";
import { ProductGrid } from "@/components/storefront/product-grid";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(8),
    getTopLevelCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
      <section className="overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 px-8 py-14 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Everything you need, delivered fast.</h1>
        <p className="mt-3 max-w-xl text-slate-200">
          Shop electronics, fashion, home essentials and more — all in one place.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-md bg-amber-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-amber-300"
        >
          Shop now
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="rounded-lg border bg-white p-4 text-center font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Featured products</h2>
          <Link href="/products" className="text-sm font-medium text-amber-600 hover:underline">
            View all
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>
    </div>
  );
}
