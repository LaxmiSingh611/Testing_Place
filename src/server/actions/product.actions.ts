"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteProductImage as deleteImageFile } from "@/lib/storage";
import { productSchema, type ProductInput } from "@/validation/product.schema";

type ActionResult = { success: true } | { success: false; error: string };
type CreateResult = { success: true; productId: string } | { success: false; error: string };

async function requireAdmin(): Promise<{ success: false; error: string } | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Please sign in" };
  if (session.user.role !== "ADMIN") return { success: false, error: "Admin access required" };
  return null;
}

export async function createProduct(input: ProductInput): Promise<CreateResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

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
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, productId: product.id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

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

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

  if (orderItemCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  }

  const images = await prisma.productImage.findMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  await Promise.all(images.map((img) => deleteImageFile(img.url)));

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { success: false, error: "Image not found" };

  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteImageFile(image.url);

  revalidatePath(`/admin/products/${image.productId}/edit`);
  revalidatePath("/products");
  return { success: true };
}

export async function moveProductImage(imageId: string, direction: "left" | "right"): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { success: false, error: "Image not found" };

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

  revalidatePath(`/admin/products/${image.productId}/edit`);
  return { success: true };
}
