import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/server/queries/order.queries";
import { OrderStatusTimeline } from "@/components/storefront/order-status-timeline";
import { formatPrice } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const order = await getOrderById(orderId, session.user.id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{order.orderNumber}</h1>
        <p className="text-sm text-slate-500">
          Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <OrderStatusTimeline status={order.status} />
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Items</h2>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{item.titleSnapshot}</p>
                <p className="text-slate-500">Qty {item.quantity}</p>
              </div>
              <span className="font-medium text-slate-900">
                {formatPrice(Number(item.priceSnapshot) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-2 font-medium text-slate-900">Shipping address</h2>
        <p className="text-sm text-slate-600">{order.shippingAddress.fullName}</p>
        <p className="text-sm text-slate-600">
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city},{" "}
          {order.shippingAddress.state} {order.shippingAddress.postalCode}
        </p>
        <p className="text-sm text-slate-600">{order.shippingAddress.phone}</p>
      </div>

      {order.payment && (
        <div className="rounded-lg border bg-white p-5 text-sm">
          <h2 className="mb-2 font-medium text-slate-900">Payment</h2>
          <p className="text-slate-600">
            Method: {order.payment.method.replace("MOCK_", "")} · Status: {order.payment.status}
          </p>
        </div>
      )}
    </div>
  );
}
