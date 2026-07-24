import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ProductCard } from "@/server/queries/product.queries";

export async function getSellerByUserId(userId: string) {
  return prisma.seller.findUnique({ where: { userId } });
}

export async function getSellerByStoreSlug(storeSlug: string) {
  return prisma.seller.findUnique({ where: { storeSlug, isActive: true } });
}

/** Active-product listing for the public seller storefront page (`/sellers/[storeSlug]`). */
export async function getSellerStorefrontProducts(sellerId: string): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { sellerId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    stock: p.stock,
    image: p.images[0]?.url ?? null,
  }));
}

export async function getSellerProducts({
  sellerId,
  q,
  page = 1,
  pageSize = 20,
}: {
  sellerId: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.ProductWhereInput = {
    sellerId,
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };

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

export async function getSellerProductById(id: string, sellerId: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!product || product.sellerId !== sellerId) return null;

  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
  };
}

export async function getSellerDashboardStats(sellerId: string) {
  const sellerOrdersWhere: Prisma.OrderWhereInput = { items: { some: { product: { sellerId } } } };

  const [productCount, orderCount, revenueRows, recentOrders, lowStockProducts] = await Promise.all([
    prisma.product.count({ where: { sellerId } }),
    prisma.order.count({ where: sellerOrdersWhere }),
    // groupBy/aggregate can only sum a single column — this needs priceSnapshot * quantity per row,
    // so it's computed in SQL rather than risking a wrong number from summing unit prices alone.
    prisma.$queryRaw<{ revenue: string }[]>`
      SELECT COALESCE(SUM(oi."priceSnapshot" * oi."quantity"), 0)::text AS revenue
      FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi."productId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE p."sellerId" = ${sellerId} AND o.status NOT IN ('PENDING', 'CANCELLED')
    `,
    prisma.order.findMany({
      where: sellerOrdersWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNumber: true, status: true, createdAt: true },
    }),
    prisma.product.findMany({
      where: { sellerId, isActive: true, stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, title: true, stock: true },
    }),
  ]);

  return {
    productCount,
    orderCount,
    revenue: Number(revenueRows[0]?.revenue ?? 0),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    lowStockProducts,
  };
}

const SELLER_ORDER_ITEM_SELECT = {
  id: true,
  titleSnapshot: true,
  priceSnapshot: true,
  quantity: true,
  imageUrlSnapshot: true,
} satisfies Prisma.OrderItemSelect;

type RawSellerOrderItem = {
  id: string;
  titleSnapshot: string;
  priceSnapshot: Prisma.Decimal;
  quantity: number;
  imageUrlSnapshot: string | null;
};

function serializeSellerOrderItems(items: RawSellerOrderItem[]) {
  const serialized = items.map((item) => ({
    id: item.id,
    titleSnapshot: item.titleSnapshot,
    priceSnapshot: Number(item.priceSnapshot),
    quantity: item.quantity,
    imageUrlSnapshot: item.imageUrlSnapshot,
  }));
  const sellerTotal = serialized.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  return { items: serialized, sellerTotal };
}

export async function getOrdersForSeller(
  sellerId: string,
  { status, page = 1, pageSize = 10 }: { status?: string; page?: number; pageSize?: number } = {},
) {
  const where: Prisma.OrderWhereInput = {
    items: { some: { product: { sellerId } } },
    ...(status ? { status: status as never } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        items: { where: { product: { sellerId } }, select: SELLER_ORDER_ITEM_SELECT },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order) => {
      const { items, sellerTotal } = serializeSellerOrderItems(order.items);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        items,
        sellerTotal,
      };
    }),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Deliberately does NOT reuse the customer/admin order query shape — this must never expose
 * another seller's line items, the full Payment record, or the order's overall total, only the
 * calling seller's own items (+ shipping address, which they legitimately need to ship).
 */
export async function getSellerOrderById(orderId: string, sellerId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      shippingAddress: true,
      items: { where: { product: { sellerId } }, select: SELLER_ORDER_ITEM_SELECT },
    },
  });
  if (!order || order.items.length === 0) return null;

  const { items, sellerTotal } = serializeSellerOrderItems(order.items);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    shippingAddress: order.shippingAddress,
    items,
    sellerTotal,
  };
}
