import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const ORDER_INCLUDE = {
  items: true,
  payment: true,
  shippingAddress: true,
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

function serializeOrder<T extends OrderWithRelations>(order: T) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    tax: Number(order.tax),
    total: Number(order.total),
    items: order.items.map((item) => ({ ...item, priceSnapshot: Number(item.priceSnapshot) })),
    payment: order.payment ? { ...order.payment, amount: Number(order.payment.amount) } : null,
  };
}

export async function getOrdersByUser(userId: string, page = 1, pageSize = 10) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders: orders.map(serializeOrder),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
  if (!order || order.userId !== userId) return null;
  return serializeOrder(order);
}

export async function getAllOrdersAdmin(status?: string, page = 1, pageSize = 20) {
  const where = status ? { status: status as never } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { ...ORDER_INCLUDE, user: { select: { name: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(serializeOrder),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
