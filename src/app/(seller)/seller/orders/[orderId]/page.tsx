import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSellerByUserId, getSellerOrderById } from "@/server/queries/seller.queries";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/sell");
  const seller = await getSellerByUserId(session.user.id);
  if (!seller) redirect("/sell");

  const order = await getSellerOrderById(orderId, seller.id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">
            {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
        </div>
        <Badge variant="secondary">{order.status}</Badge>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-2 font-medium text-slate-900">Update status</h2>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Your items in this order</h2>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-800">{item.titleSnapshot}</p>
                <p className="text-slate-500">Qty {item.quantity}</p>
              </div>
              <span className="font-medium text-slate-900">{formatPrice(item.priceSnapshot * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t pt-3 font-semibold text-slate-900">
          <span>Your total</span>
          <span>{formatPrice(order.sellerTotal)}</span>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5 text-sm">
        <h2 className="mb-2 font-medium text-slate-900">Shipping address</h2>
        <p className="text-slate-600">{order.shippingAddress.fullName}</p>
        <p className="text-slate-600">
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city},{" "}
          {order.shippingAddress.state} {order.shippingAddress.postalCode}
        </p>
        <p className="text-slate-600">{order.shippingAddress.phone}</p>
      </div>
    </div>
  );
}
