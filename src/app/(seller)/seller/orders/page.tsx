import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSellerByUserId, getOrdersForSeller } from "@/server/queries/seller.queries";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sell");
  const seller = await getSellerByUserId(session.user.id);
  if (!seller) redirect("/sell");

  const { status, page: pageParam } = await searchParams;
  const page = pageParam ? Number(pageParam) : 1;
  const { orders, total } = await getOrdersForSeller(seller.id, { status, page });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Orders ({total})</h1>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/seller/orders"
          className={`rounded-full border px-3 py-1 text-sm ${!status ? "bg-slate-900 text-white" : "text-slate-600"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/seller/orders?status=${s}`}
            className={`rounded-full border px-3 py-1 text-sm ${status === s ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Your items</th>
              <th className="p-3">Your total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3">
                  <Link href={`/seller/orders/${order.id}`} className="font-medium text-slate-800 hover:text-amber-600">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="p-3 text-slate-600">{order.items.length}</td>
                <td className="p-3 text-slate-600">{formatPrice(order.sellerTotal)}</td>
                <td className="p-3">
                  <Badge variant="secondary">{order.status}</Badge>
                </td>
                <td className="p-3 text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No orders yet.</p>}
      </div>
    </div>
  );
}
