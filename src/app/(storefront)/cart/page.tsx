"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartQuery } from "@/hooks/use-cart-query";
import { CartItemRow } from "@/components/storefront/cart-item-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { data, isLoading } = useCartQuery();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Your Cart</h1>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && (!data || data.items.length === 0) && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-20 text-center text-slate-500">
          <ShoppingCart className="size-12 text-slate-300" />
          <p>Your cart is empty.</p>
          <Button render={<Link href="/products" />} nativeButton={false}>
            Start shopping
          </Button>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="divide-y rounded-lg border bg-white px-4">
            {data.items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>

          <div className="h-fit space-y-4 rounded-lg border bg-white p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal ({data.itemCount} items)</span>
              <span className="font-semibold text-slate-900">{formatPrice(data.subtotal)}</span>
            </div>
            <Button render={<Link href="/checkout" />} nativeButton={false} className="w-full">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
