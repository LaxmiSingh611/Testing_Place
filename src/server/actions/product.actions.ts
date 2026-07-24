"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteProductImage as deleteImageFile } from "@/lib/storage";
import { productSchema, type ProductInput } from "@/validation/product.schema";

type ActionResult = { success: true } | { success: false; error: string };
type CreateResult = { success: true; productId: string } | { success: false; error: string };

type Actor = { kind: "admin" } | { kind: "seller"; sellerId: string };
type ActorResult = { success: true; actor: Actor } | { success: false; error: string };

async function getActingContext(): Promise<ActorResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Please sign in" };
  if (session.user.role === "ADMIN") return { success: true, actor: { kind: "admin" } };

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller || !seller.isActive) return { success: false, error: "Seller access required" };
  return { success: true, actor: { kind: "seller", sellerId: seller.id } };
}

async function assertProductAccess(
  productId: string,
  actor: Actor,
): Promise<{ ok: true; product: { id: string; sellerId: string | null } } | { ok: false; error: string }> {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, sellerId: true } });
  if (!product) return { ok: false, error: "Product not found" };
  if (actor.kind === "seller" && product.sellerId !== actor.sellerId) {
    return { ok: false, error: "You don't have access to this product" };
  }
  return { ok: true, product };
}

function revalidateProductPaths(productId?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/seller/products");
  revalidatePath("/products");
  if (productId) {
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath(`/seller/products/${productId}/edit`);
  }
}

export async function createProduct(input: ProductInput): Promise<CreateResult> {
  const ctx = await getActingContext();
  if (!ctx.success) return ctx;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { success: false, error: "A product with this slug already exists" };

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { success: false, error: "Selected category does not exist" };

  const product = await prisma.product.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice || null,
      stock: parsed.data.stock,
      sku: parsed.data.sku || null,
      isActive: parsed.data.isActive,
      categoryId: parsed.data.categoryId,
      sellerId: ctx.actor.kind === "seller" ? ctx.actor.sellerId : null,
    },
  });

  revalidateProductPaths();
  return { success: true, productId: product.id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const ctx = await getActingContext();
  if (!ctx.success) return ctx;

  const access = await assertProductAccess(id, ctx.actor);
  if (!access.ok) return { success: false, error: access.error };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const conflict = await prisma.product.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (conflict) return { success: false, error: "A product with this slug already exists" };

  await prisma.product.update({
    where: { id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice || null,
      stock: parsed.data.stock,
      sku: parsed.data.sku || null,
      isActive: parsed.data.isActive,
      categoryId: parsed.data.categoryId,
    },
  });

  revalidateProductPaths(id);
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const ctx = await getActingContext();
  if (!ctx.success) return ctx;

  const access = await assertProductAccess(id, ctx.actor);
  if (!access.ok) return { success: false, error: access.error };

  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

  if (orderItemCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    revalidateProductPaths();
    return { success: true };
  }

  const images = await prisma.productImage.findMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  await Promise.all(images.map((img) => deleteImageFile(img.url)));

  revalidateProductPaths();
  return { success: true };
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  const ctx = await getActingContext();
  if (!ctx.success) return ctx;

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: { product: { select: { sellerId: true } } },
  });
  if (!image) return { success: false, error: "Image not found" };
  if (ctx.actor.kind === "seller" && image.product.sellerId !== ctx.actor.sellerId) {
    return { success: false, error: "You don't have access to this product" };
  }

  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteImageFile(image.url);

  revalidateProductPaths(image.productId);
  return { success: true };
}

export async function moveProductImage(imageId: string, direction: "left" | "right"): Promise<ActionResult> {
  const ctx = await getActingContext();
  if (!ctx.success) return ctx;

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: { product: { select: { sellerId: true } } },
  });
  if (!image) return { success: false, error: "Image not found" };
  if (ctx.actor.kind === "seller" && image.product.sellerId !== ctx.actor.sellerId) {
    return { success: false, error: "You don't have access to this product" };
  }

  const neighbor = await prisma.productImage.findFirst({
    where: {
      productId: image.productId,
      position: direction === "left" ? { lt: image.position } : { gt: image.position },
    },
    orderBy: { position: direction === "left" ? "desc" : "asc" },
  });
  if (!neighbor) return { success: true };

  await prisma.$transaction([
    prisma.productImage.update({ where: { id: image.id }, data: { position: neighbor.position } }),
    prisma.productImage.update({ where: { id: neighbor.id }, data: { position: image.position } }),
  ]);

  revalidateProductPaths(image.productId);
  return { success: true };
}
