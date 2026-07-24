import { redirect } from "next/navigation";
import { getCartSummary } from "@/server/actions/cart.actions";
import { listAddresses } from "@/server/actions/address.actions";
import { CheckoutForm } from "@/components/storefront/checkout-form";

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;

export default async function CheckoutPage() {
  const [cart, addresses] = await Promise.all([getCartSummary(), listAddresses()]);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  const shippingFee = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Checkout</h1>
      <CheckoutForm
        addresses={addresses}
        subtotal={cart.subtotal}
        shippingFee={shippingFee}
        total={cart.subtotal + shippingFee}
      />
    </div>
  );
}
