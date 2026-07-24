import { prisma } from "@/lib/db";

const LOW_STOCK_THRESHOLD = 5;

export async function getDashboardStats() {
  const [revenueAgg, statusGroups, lowStockProducts, recentOrders, productCount, customerCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { notIn: ["PENDING", "CANCELLED"] } },
      _sum: { total: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, title: true, stock: true, slug: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "USER" } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
  }

  return {
    totalRevenue: Number(revenueAgg._sum.total ?? 0),
    totalOrders: statusGroups.reduce((sum, g) => sum + g._count._all, 0),
    statusCounts,
    lowStockProducts,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
    })),
    activeProductCount: productCount,
    customerCount,
  };
}
