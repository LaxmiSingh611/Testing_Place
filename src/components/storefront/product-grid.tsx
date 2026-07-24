"use client";

import { motion } from "framer-motion";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductCard as ProductCardType } from "@/server/queries/product.queries";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-slate-500">
        No products found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
}
