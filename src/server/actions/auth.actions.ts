"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { signUpSchema, type SignUpInput } from "@/validation/auth.schema";

export async function registerUser(input: SignUpInput) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = checkRateLimit(`sign-up:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return { success: false as const, error: "Too many sign-up attempts. Please try again later." };
  }

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false as const, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash, role: "USER" },
    });
    await tx.cart.create({ data: { userId: user.id } });
  });

  return { success: true as const };
}
