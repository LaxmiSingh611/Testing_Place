"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canTransitionOrderStatus, type OrderStatusInput } from "@/validation/order.schema";

type ActionResult = { success: true } | { success: false; error: string };

const RESTOCK_STATUSES = new Set(["CANCELLED", "REFUNDED"]);

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatusInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Please sign in" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { productId: true, product: { select: { sellerId: true } } } } },
  });
  if (!order) return { success: false, error: "Order not found" };

  let isMixedSellerOrder = false;

  if (session.user.role !== "ADMIN") {
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller || !seller.isActive) return { success: false, error: "Admin access required" };

    const ownsAnItem = order.items.some((item) => item.product.sellerId === seller.id);
    if (!ownsAnItem) return { success: false, error: "You don't have access to this order" };

    // A seller only fully controls an order that's exclusively their own items. If the order also
    // contains another seller's (or the platform's) items, restrict them to forward transitions —
    // CANCELLED/REFUNDED would restock every item in the order, not just theirs.
    isMixedSellerOrder = !order.items.every((item) => item.product.sellerId === seller.id);
    if (isMixedSellerOrder && RESTOCK_STATUSES.has(nextStatus)) {
      return { success: false, error: "This order contains other sellers' items — an admin must cancel or refund it" };
    }
  }

  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    return { success: false, error: `Cannot move an order from ${order.status} to ${nextStatus}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: nextStatus } });

    if (RESTOCK_STATUSES.has(nextStatus)) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { success: true };
}
