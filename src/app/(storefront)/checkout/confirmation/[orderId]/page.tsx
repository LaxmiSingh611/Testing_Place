import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/server/queries/order.queries";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const order = await getOrderById(orderId, session.user.id);
  if (!order) notFound();

  if (order.payment?.status !== "SUCCEEDED") {
    redirect(`/checkout/payment/${orderId}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-center">
      <CheckCircle2 className="mx-auto mb-4 size-16 text-emerald-500" />
      <h1 className="text-2xl font-semibold text-slate-900">Order placed successfully!</h1>
      <p className="mt-2 text-slate-600">
        Order <span className="font-medium">{order.orderNumber}</span> has been confirmed.
      </p>

      <div className="mt-8 space-y-3 rounded-lg border bg-white p-6 text-left">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-slate-700">
              {item.titleSnapshot} × {item.quantity}
            </span>
            <span className="font-medium text-slate-900">
              {formatPrice(Number(item.priceSnapshot) * item.quantity)}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-3 font-semibold text-slate-900">
          <span>Total paid</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button variant="outline" render={<Link href="/products" />} nativeButton={false}>
          Continue shopping
        </Button>
        <Button render={<Link href={`/account/orders/${order.id}`} />} nativeButton={false}>
          View order
        </Button>
      </div>
    </div>
  );
}
