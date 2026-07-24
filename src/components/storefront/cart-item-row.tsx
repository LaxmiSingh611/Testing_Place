"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRemoveCartItemMutation, useUpdateQuantityMutation } from "@/hooks/use-cart-query";
import type { CartLineItem } from "@/server/actions/cart.actions";

export function CartItemRow({ item, onNavigate }: { item: CartLineItem; onNavigate?: () => void }) {
  const updateQuantity = useUpdateQuantityMutation();
  const removeItem = useRemoveCartItemMutation();

  return (
    <div className="flex gap-3 py-3">
      <Link href={`/products/${item.slug}`} onClick={onNavigate} className="relative size-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {item.image && <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col">
        <Link href={`/products/${item.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm font-medium text-slate-800">
          {item.title}
        </Link>
        <p className="mt-1 text-sm font-semibold text-slate-900">{formatPrice(item.price)}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center rounded-md border">
            <button
              type="button"
              className="p-1.5 disabled:opacity-40"
              disabled={updateQuantity.isPending}
              onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="p-1.5 disabled:opacity-40"
              disabled={updateQuantity.isPending || item.quantity >= item.stock}
              onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-red-500 disabled:opacity-40"
            disabled={removeItem.isPending}
            onClick={() => removeItem.mutate(item.id)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
