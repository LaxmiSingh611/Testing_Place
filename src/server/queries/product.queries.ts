import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCategoryIdsInTree } from "@/server/queries/category.queries";

export type ProductCard = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
};

export type ProductSort = "newest" | "price-asc" | "price-desc";

export type ProductFilters = {
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

function toProductCard(product: {
  id: string;
  title: string;
  slug: string;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  stock: number;
  images: { url: string }[];
}): ProductCard {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    stock: product.stock,
    image: product.images[0]?.url ?? null,
  };
}

const CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
};

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: CARD_SELECT,
  });
  return products.map(toProductCard);
}

export async function getProducts(
  filters: ProductFilters,
): Promise<{ products: ProductCard[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: filters.categorySlug },
      select: { id: true },
    });
    if (!category) {
      return { products: [], total: 0, page, pageSize, totalPages: 0 };
    }
    const categoryIds = await getCategoryIdsInTree(category.id);
    where.categoryId = { in: categoryIds };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    };
  }

  if (filters.q) {
    // Full-text search: rank via the generated tsvector column (raw SQL, since
    // Prisma treats it as Unsupported), then apply the other filters/pagination
    // in-memory — the catalog is small enough that this is simpler than a
    // hand-written raw-SQL join for category/price filtering.
    const ranked = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product"
      WHERE "isActive" = true AND "searchVector" @@ plainto_tsquery('english', ${filters.q})
      ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${filters.q})) DESC
      LIMIT 500
    `;
    const rankedIds = ranked.map((r) => r.id);
    if (rankedIds.length === 0) {
      return { products: [], total: 0, page, pageSize, totalPages: 0 };
    }

    where.id = { in: rankedIds };
    const matching = await prisma.product.findMany({ where, select: CARD_SELECT });

    if (filters.sort === "price-asc") {
      matching.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filters.sort === "price-desc") {
      matching.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      const rankIndex = new Map(rankedIds.map((id, i) => [id, i]));
      matching.sort((a, b) => (rankIndex.get(a.id) ?? 0) - (rankIndex.get(b.id) ?? 0));
    }

    const total = matching.length;
    const paged = matching.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return {
      products: paged.map(toProductCard),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price-asc"
      ? { price: "asc" }
      : filters.sort === "price-desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: CARD_SELECT,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(toProductCard),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: "asc" } },
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product) return null;

  const ratingAgg = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    stock: product.stock,
    sku: product.sku,
    category: product.category,
    images: product.images.map((img) => ({ id: img.id, url: img.url, altText: img.altText })),
    reviews: product.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      userName: r.user.name,
      createdAt: r.createdAt.toISOString(),
    })),
    ratingAverage: ratingAgg._avg.rating ?? 0,
    ratingCount: ratingAgg._count.rating,
  };
}

export async function getProductsAdmin({
  q,
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.ProductWhereInput = q ? { title: { contains: q, mode: "insensitive" } } : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: Number(p.price),
      stock: p.stock,
      isActive: p.isActive,
      categoryName: p.category.name,
      image: p.images[0]?.url ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductByIdAdmin(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!product) return null;

  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
  };
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 6,
): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { categoryId, isActive: true, id: { not: excludeProductId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: CARD_SELECT,
  });
  return products.map(toProductCard);
}
