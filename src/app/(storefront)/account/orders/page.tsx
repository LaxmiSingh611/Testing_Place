import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrdersByUser } from "@/server/queries/order.queries";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();
  const { page: pageParam } = await searchParams;
  const page = pageParam ? Number(pageParam) : 1;
  const { orders, total } = await getOrdersByUser(session.user.id, page);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center text-slate-500">
        <PackageOpen className="size-10 text-slate-300" />
        <p>You haven&apos;t placed any orders yet.</p>
        <Link href="/products" className="font-medium text-amber-600 hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Your orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex items-center justify-between rounded-lg border bg-white p-4 hover:border-amber-400"
          >
            <div>
              <p className="font-medium text-slate-900">{order.orderNumber}</p>
              <p className="text-sm text-slate-500">
                {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} ·{" "}
                {order.items.length} item{order.items.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">{formatPrice(order.total)}</span>
              <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>{order.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
