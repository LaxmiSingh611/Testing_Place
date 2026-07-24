"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartUIStore } from "@/store/cart-ui-store";
import { useCartQuery } from "@/hooks/use-cart-query";
import { CartItemRow } from "@/components/storefront/cart-item-row";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { isDrawerOpen, closeDrawer } = useCartUIStore();
  const { data, isLoading } = useCartQuery();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart{data && data.itemCount > 0 ? ` (${data.itemCount})` : ""}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 divide-y overflow-y-auto px-4">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {!isLoading && (!data || data.items.length === 0) && (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-500">
              <ShoppingCart className="size-10 text-slate-300" />
              <p>Your cart is empty.</p>
            </div>
          )}

          {data?.items.map((item) => (
            <CartItemRow key={item.id} item={item} onNavigate={closeDrawer} />
          ))}
        </div>

        {data && data.items.length > 0 && (
          <div className="space-y-3 border-t p-4">
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Subtotal</span>
              <span>{formatPrice(data.subtotal)}</span>
            </div>
            <Button
              render={<Link href="/checkout" />}
              nativeButton={false}
              className="w-full"
              onClick={closeDrawer}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
