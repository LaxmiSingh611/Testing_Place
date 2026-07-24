import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSellerByUserId, getSellerDashboardStats } from "@/server/queries/seller.queries";
import { StatsCard } from "@/components/admin/stats-card";
import { Badge } from "@/components/ui/badge";

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sell");
  const seller = await getSellerByUserId(session.user.id);
  if (!seller) redirect("/sell");

  const stats = await getSellerDashboardStats(seller.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">{seller.storeName} dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard label="Total revenue" value={stats.revenue} icon="revenue" variant="currency" />
        <StatsCard label="Total orders" value={stats.orderCount} icon="orders" />
        <StatsCard label="Products" value={stats.productCount} icon="products" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 flex items-center gap-2 font-medium text-slate-900">
            <TriangleAlert className="size-4 text-amber-500" />
            Low stock
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-500">All your products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <Link href={`/seller/products/${product.id}/edit`} className="text-slate-700 hover:text-amber-600">
                    {product.title}
                  </Link>
                  <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>{product.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium text-slate-900">Recent orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="divide-y">
              {stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/seller/orders/${order.id}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:text-amber-600"
                >
                  <span className="font-medium text-slate-800">{order.orderNumber}</span>
                  <Badge variant="secondary">{order.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
