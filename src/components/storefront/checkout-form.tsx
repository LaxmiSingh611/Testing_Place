"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { createOrderFromCart } from "@/server/actions/checkout.actions";
import { AddressFormDialog } from "@/components/storefront/address-form-dialog";
import { CART_QUERY_KEY } from "@/hooks/use-cart-query";
import type { Address } from "@/generated/prisma/client";

export function CheckoutForm({
  addresses,
  subtotal,
  shippingFee,
  total,
}: {
  addresses: Address[];
  subtotal: number;
  shippingFee: number;
  total: number;
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedId && addresses.some((a) => a.id === selectedId)) return;
    setSelectedId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  const handlePlaceOrder = async () => {
    if (!selectedId) {
      toast.error("Please select a shipping address");
      return;
    }
    setIsSubmitting(true);
    const result = await createOrderFromCart({ shippingAddressId: selectedId });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    router.push(`/checkout/payment/${result.orderId}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Shipping address</h2>
          <AddressFormDialog />
        </div>

        {addresses.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
            Add a shipping address to continue.
          </p>
        )}

        <div className="space-y-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4",
                selectedId === address.id && "border-amber-500 ring-1 ring-amber-500",
              )}
            >
              <input
                type="radio"
                name="shippingAddress"
                className="mt-1"
                checked={selectedId === address.id}
                onChange={() => setSelectedId(address.id)}
              />
              <div className="text-sm">
                <p className="font-medium text-slate-900">{address.fullName}</p>
                <p className="text-slate-600">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                  {address.postalCode}
                </p>
                <p className="text-slate-600">{address.phone}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="h-fit space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-semibold text-slate-900">Order summary</h2>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
        </div>
        <div className="flex justify-between border-t pt-3 font-semibold text-slate-900">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Button className="w-full" disabled={!selectedId || isSubmitting} onClick={handlePlaceOrder}>
          {isSubmitting ? "Placing order..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}
