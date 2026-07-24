"use client";

import { ShoppingCart } from "lucide-react";
import { useCartQuery } from "@/hooks/use-cart-query";
import { useCartUIStore } from "@/store/cart-ui-store";

export function CartTrigger() {
  const { data } = useCartQuery();
  const openDrawer = useCartUIStore((s) => s.openDrawer);
  const itemCount = data?.itemCount ?? 0;

  return (
    <button type="button" onClick={openDrawer} className="relative flex items-center gap-1 text-sm font-medium">
      <span className="relative">
        <ShoppingCart className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
            {itemCount}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">Cart</span>
    </button>
  );
}
