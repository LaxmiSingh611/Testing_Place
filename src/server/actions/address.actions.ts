"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addressSchema, type AddressInput } from "@/validation/address.schema";

type ActionResult = { success: true } | { success: false; error: string };

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function listAddresses() {
  const userId = await requireUserId();
  if (!userId) return [];

  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(input: AddressInput): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Please sign in" };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid address" };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const count = await tx.address.count({ where: { userId } });
    await tx.address.create({
      data: { ...parsed.data, userId, isDefault: parsed.data.isDefault || count === 0 },
    });
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function updateAddress(id: string, input: AddressInput): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Please sign in" };

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { success: false, error: "Address not found" };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid address" };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    await tx.address.update({ where: { id }, data: parsed.data });
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Please sign in" };

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { success: false, error: "Address not found" };

  await prisma.address.delete({ where: { id } });
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}
