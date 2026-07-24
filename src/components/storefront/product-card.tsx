"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import type { ProductCard as ProductCardType } from "@/server/queries/product.queries";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ProductCard({ product }: { product: ProductCardType }) {
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, boxShadow: "0 12px 24px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group rounded-lg border bg-white p-3"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-slate-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
          )}
          {discountPct && (
            <span className="absolute left-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {discountPct}% off
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-1 text-center text-xs font-medium text-white">
              Out of stock
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 min-h-10 text-sm text-slate-800">{product.title}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-semibold text-slate-900">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-slate-400 line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
