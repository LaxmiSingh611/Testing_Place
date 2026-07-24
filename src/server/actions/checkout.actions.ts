"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/order-number";
import { randomDelayMs, resolveMockOutcome } from "@/lib/mock-payment";
import { checkRateLimit } from "@/lib/rate-limit";
import { createOrderSchema, type CreateOrderInput, type MockPaymentMethod } from "@/validation/checkout.schema";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;

type CreateOrderResult = { success: true; orderId: string } | { success: false; error: string };

export async function createOrderFromCart(input: CreateOrderInput): Promise<CreateOrderResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Please sign in" };

  const { allowed } = checkRateLimit(`checkout:${userId}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!allowed) return { success: false, error: "Too many checkout attempts. Please wait a few minutes." };

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const address = await prisma.address.findUnique({ where: { id: parsed.data.shippingAddressId } });
  if (!address || address.userId !== userId) return { success: false, error: "Address not found" };

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
      },
    },
  });
  if (!cart || cart.items.length === 0) return { success: false, error: "Your cart is empty" };

  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      return { success: false, error: `${item.product.title} only has ${item.product.stock} left in stock` };
    }
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const orderId = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: "PENDING",
        subtotal,
        shippingFee,
        tax: 0,
        total,
        shippingAddressId: address.id,
        billingAddressId: address.id,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            titleSnapshot: item.product.title,
            priceSnapshot: item.product.price,
            quantity: item.quantity,
            imageUrlSnapshot: item.product.images[0]?.url ?? null,
          })),
        },
        payment: {
          create: { method: "MOCK_CARD", status: "PENDING", amount: total },
        },
      },
    });

    for (const item of cart.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order.id;
  });

  revalidatePath("/cart");
  return { success: true, orderId };
}

type ProcessPaymentResult =
  | { success: true; status: "SUCCEEDED" | "FAILED" }
  | { success: false; error: string };

export async function processMockPayment(orderId: string, method: MockPaymentMethod): Promise<ProcessPaymentResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Please sign in" };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order || order.userId !== userId || !order.payment) {
    return { success: false, error: "Order not found" };
  }
  if (order.payment.status === "SUCCEEDED") {
    return { success: true, status: "SUCCEEDED" };
  }

  await prisma.payment.update({ where: { id: order.payment.id }, data: { status: "PROCESSING", method } });

  await new Promise((resolve) => setTimeout(resolve, randomDelayMs()));

  const outcome = method === "COD" ? "SUCCEEDED" : resolveMockOutcome();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: order.payment!.id },
      data: {
        status: outcome,
        processedAt: new Date(),
        failureReason: outcome === "FAILED" ? "Payment declined by mock gateway. Please try again." : null,
      },
    });

    if (outcome === "SUCCEEDED") {
      await tx.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
    } else {
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }
  });

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/checkout/confirmation/${orderId}`);
  return { success: true, status: outcome };
}
