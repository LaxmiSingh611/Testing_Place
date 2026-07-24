"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAddToCartMutation } from "@/hooks/use-cart-query";
import { useCartUIStore } from "@/store/cart-ui-store";

export function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCartMutation();
  const openDrawer = useCartUIStore((s) => s.openDrawer);
  const router = useRouter();

  const outOfStock = stock === 0;

  const handleAddToCart = () => {
    addToCart.mutate(
      { productId, quantity },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success("Added to cart");
            openDrawer();
          } else if (result.error === "Please sign in to add items to your cart") {
            toast.error(result.error);
            router.push("/sign-in");
          } else {
            toast.error(result.error);
          }
        },
        onError: () => toast.error("Something went wrong, please try again"),
      },
    );
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-md border">
        <button
          type="button"
          className="p-2 disabled:opacity-40"
          disabled={quantity <= 1}
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <button
          type="button"
          className="p-2 disabled:opacity-40"
          disabled={quantity >= stock}
          onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button className="flex-1" disabled={outOfStock || addToCart.isPending} onClick={handleAddToCart}>
        {outOfStock ? "Out of stock" : addToCart.isPending ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  );
}
