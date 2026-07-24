import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Star, Store } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/server/queries/product.queries";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.title} — bazaar.in`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.category.id, product.id);
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div className="space-y-4">
          <div>
            <p className="text-sm text-amber-600">{product.category.name}</p>
            <h1 className="text-2xl font-semibold text-slate-900">{product.title}</h1>
          </div>

          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{product.ratingAverage.toFixed(1)}</span>
              <span>({product.ratingCount} reviews)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                <span className="text-sm font-semibold text-emerald-600">{discountPct}% off</span>
              </>
            )}
          </div>

          <p className="text-sm text-slate-600">
            {product.stock > 0 ? (
              <span className="text-emerald-600">In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>

          <AddToCartButton productId={product.id} stock={product.stock} />

          {product.seller && (
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <Store className="size-4" />
              Sold by{" "}
              <Link href={`/sellers/${product.seller.storeSlug}`} className="font-medium text-amber-600 hover:underline">
                {product.seller.storeName}
              </Link>
            </p>
          )}

          <div className="border-t pt-4">
            <h2 className="mb-2 font-medium text-slate-900">Product description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
          </div>
        </div>
      </div>

      {product.reviews.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Customer reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  {review.title && <span className="font-medium text-slate-900">{review.title}</span>}
                </div>
                <p className="mt-1 text-sm text-slate-600">{review.body}</p>
                <p className="mt-2 text-xs text-slate-400">— {review.userName}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">You might also like</h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
