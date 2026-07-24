"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canTransitionOrderStatus, type OrderStatusInput } from "@/validation/order.schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatusInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Please sign in" };
  if (session.user.role !== "ADMIN") return { success: false, error: "Admin access required" };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: "Order not found" };

  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    return { success: false, error: `Cannot move an order from ${order.status} to ${nextStatus}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: nextStatus } });

    if (nextStatus === "CANCELLED" || nextStatus === "REFUNDED") {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { success: true };
}
