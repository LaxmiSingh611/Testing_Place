import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveProductImage } from "@/lib/storage";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  let sellerId: string | null = null;
  if (session.user.role !== "ADMIN") {
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller || !seller.isActive) {
      return NextResponse.json({ error: "Seller access required" }, { status: 403 });
    }
    sellerId = seller.id;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const productId = formData.get("productId");

  if (!(file instanceof File) || typeof productId !== "string") {
    return NextResponse.json({ error: "Missing file or productId" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large (max 8MB)" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (sellerId && product.sellerId !== sellerId) {
    return NextResponse.json({ error: "You don't have access to this product" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await saveProductImage(buffer, file.type);

  const lastImage = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { position: "desc" },
  });

  const image = await prisma.productImage.create({
    data: { productId, url, position: (lastImage?.position ?? -1) + 1 },
  });

  return NextResponse.json({ image });
}
