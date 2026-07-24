"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sellerApplicationSchema, type SellerApplicationInput } from "@/validation/seller.schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function applyToBecomeSeller(input: SellerApplicationInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Please sign in" };

  const existing = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (existing) return { success: false, error: "You already have a seller account" };

  const parsed = sellerApplicationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const slugTaken = await prisma.seller.findUnique({ where: { storeSlug: parsed.data.storeSlug } });
  if (slugTaken) return { success: false, error: "That store URL is already taken" };

  await prisma.seller.create({
    data: {
      userId: session.user.id,
      storeName: parsed.data.storeName,
      storeSlug: parsed.data.storeSlug,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/sell");
  revalidatePath("/seller");
  return { success: true };
}
