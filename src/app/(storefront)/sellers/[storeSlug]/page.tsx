import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Store } from "lucide-react";
import { getSellerByStoreSlug, getSellerStorefrontProducts } from "@/server/queries/seller.queries";
import { ProductGrid } from "@/components/storefront/product-grid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const seller = await getSellerByStoreSlug(storeSlug);
  return { title: seller ? `${seller.storeName} — bazaar.in` : "Store not found" };
}

export default async function SellerStorefrontPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const seller = await getSellerByStoreSlug(storeSlug);
  if (!seller) notFound();

  const products = await getSellerStorefrontProducts(seller.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-start gap-4 rounded-lg border bg-white p-6">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Store className="size-7" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{seller.storeName}</h1>
          {seller.description && <p className="mt-1 text-sm text-slate-600">{seller.description}</p>}
          <p className="mt-1 text-xs text-slate-400">{products.length} products</p>
        </div>
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
