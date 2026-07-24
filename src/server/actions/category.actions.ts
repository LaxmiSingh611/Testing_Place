"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { categorySchema, type CategoryInput } from "@/validation/category.schema";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Please sign in" };
  if (session.user.role !== "ADMIN") return { success: false, error: "Admin access required" };
  return null;
}

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { success: false, error: "A category with this slug already exists" };

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      parentId: parsed.data.parentId || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { success: true };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (parsed.data.parentId === id) return { success: false, error: "A category cannot be its own parent" };

  const conflict = await prisma.category.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (conflict) return { success: false, error: "A category with this slug already exists" };

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      parentId: parsed.data.parentId || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const [childCount, productCount] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.product.count({ where: { categoryId: id } }),
  ]);

  if (childCount > 0) return { success: false, error: "Remove or reassign its subcategories first" };
  if (productCount > 0) return { success: false, error: "Reassign its products to another category first" };

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { success: true };
}
