import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/server/queries/order.queries";
import { MockPaymentForm } from "@/components/storefront/mock-payment-form";
import { formatPrice } from "@/lib/utils";

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const order = await getOrderById(orderId, session.user.id);
  if (!order) notFound();

  if (order.payment?.status === "SUCCEEDED") {
    redirect(`/checkout/confirmation/${orderId}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Complete your payment</h1>
      <p className="mb-6 text-sm text-slate-500">
        Order {order.orderNumber} — {formatPrice(order.total)}
      </p>
      <MockPaymentForm orderId={order.id} amount={order.total} />
    </div>
  );
}
