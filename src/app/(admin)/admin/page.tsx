import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { getDashboardStats } from "@/server/queries/dashboard.queries";
import { StatsCard } from "@/components/admin/stats-card";
import { OrderStatusChart } from "@/components/admin/order-status-chart";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total revenue" value={stats.totalRevenue} icon="revenue" variant="currency" />
        <StatsCard label="Total orders" value={stats.totalOrders} icon="orders" />
        <StatsCard label="Active products" value={stats.activeProductCount} icon="products" />
        <StatsCard label="Customers" value={stats.customerCount} icon="customers" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium text-slate-900">Orders by status</h2>
          <OrderStatusChart statusCounts={stats.statusCounts} />
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 flex items-center gap-2 font-medium text-slate-900">
            <TriangleAlert className="size-4 text-amber-500" />
            Low stock
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-500">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/products/${product.id}/edit`} className="text-slate-700 hover:text-amber-600">
                    {product.title}
                  </Link>
                  <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>{product.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium text-slate-900">Recent orders</h2>
        <div className="divide-y">
          {stats.recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between py-2.5 text-sm hover:text-amber-600"
            >
              <div>
                <p className="font-medium text-slate-800">{order.orderNumber}</p>
                <p className="text-slate-500">{order.customerName}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">{formatPrice(order.total)}</span>
                <Badge variant="secondary">{order.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
