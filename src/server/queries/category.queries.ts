import { prisma } from "@/lib/db";

export type CategoryWithChildren = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children: { id: string; name: string; slug: string }[];
};

export async function getTopLevelCategories(): Promise<CategoryWithChildren[]> {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      children: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return categories;
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: { orderBy: { name: "asc" } },
      parent: true,
    },
  });
}

/** Returns [categoryId, ...descendantIds] so filtering by a parent includes its children's products. */
export async function getCategoryIdsInTree(categoryId: string): Promise<string[]> {
  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  return [categoryId, ...children.map((c) => c.id)];
}

export async function getAllCategoriesFlat() {
  return prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true },
  });
}

export async function getAllCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { children: true, products: true } },
    },
  });
  return categories;
}
