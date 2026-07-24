"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export type CartLineItem = {
  id: string;
  productId: string;
  title: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
  lineTotal: number;
};

export type CartSummary = {
  items: CartLineItem[];
  subtotal: number;
  itemCount: number;
};

export async function getCartSummary(): Promise<CartSummary> {
  const userId = await getSessionUserId();
  if (!userId) return { items: [], subtotal: 0, itemCount: 0 };

  const cart = await getOrCreateCart(userId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      },
    },
  });

  const mapped: CartLineItem[] = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    title: item.product.title,
    slug: item.product.slug,
    price: Number(item.product.price),
    image: item.product.images[0]?.url ?? null,
    quantity: item.quantity,
    stock: item.product.stock,
    lineTotal: Number(item.product.price) * item.quantity,
  }));

  return {
    items: mapped,
    subtotal: mapped.reduce((sum, i) => sum + i.lineTotal, 0),
    itemCount: mapped.reduce((sum, i) => sum + i.quantity, 0),
  };
}

type ActionResult = { success: true } | { success: false; error: string };

export async function addToCart(productId: string, quantity = 1): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "Please sign in to add items to your cart" };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) return { success: false, error: "This product is not available" };

  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const desiredQty = (existing?.quantity ?? 0) + quantity;
  if (desiredQty > product.stock) {
    return { success: false, error: `Only ${product.stock} left in stock` };
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: desiredQty },
    create: { cartId: cart.id, productId, quantity: desiredQty },
  });

  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "Please sign in" };

  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.userId !== userId) return { success: false, error: "Item not found" };

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  } else {
    if (quantity > item.product.stock) {
      return { success: false, error: `Only ${item.product.stock} left in stock` };
    }
    await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function removeCartItem(cartItemId: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "Please sign in" };

  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
  if (!item || item.cart.userId !== userId) return { success: false, error: "Item not found" };

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/cart");
  return { success: true };
}
