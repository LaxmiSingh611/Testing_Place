"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  addToCart,
  getCartSummary,
  removeCartItem,
  updateCartItemQuantity,
  type CartSummary,
} from "@/server/actions/cart.actions";

export const CART_QUERY_KEY = ["cart"] as const;

export function useCartQuery() {
  const { status } = useSession();
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCartSummary(),
    enabled: status !== "loading",
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      addToCart(productId, quantity),
    onSuccess: (result) => {
      if (result.success) queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useUpdateQuantityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      updateCartItemQuantity(cartItemId, quantity),
    onMutate: async ({ cartItemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartSummary>(CART_QUERY_KEY);

      if (previous) {
        const items =
          quantity <= 0
            ? previous.items.filter((i) => i.id !== cartItemId)
            : previous.items.map((i) => (i.id === cartItemId ? { ...i, quantity, lineTotal: i.price * quantity } : i));
        const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        queryClient.setQueryData<CartSummary>(CART_QUERY_KEY, { items, subtotal, itemCount });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(CART_QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY }),
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => removeCartItem(cartItemId),
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartSummary>(CART_QUERY_KEY);

      if (previous) {
        const items = previous.items.filter((i) => i.id !== cartItemId);
        const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        queryClient.setQueryData<CartSummary>(CART_QUERY_KEY, { items, subtotal, itemCount });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(CART_QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY }),
  });
}
