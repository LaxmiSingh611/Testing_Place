import { z } from "zod";

export const sellerApplicationSchema = z.object({
  storeName: z.string().trim().min(2, "Store name must be at least 2 characters"),
  storeSlug: z
    .string()
    .trim()
    .min(2, "Store URL must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Store URL can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().trim().max(500).optional(),
});
export type SellerApplicationInput = z.infer<typeof sellerApplicationSchema>;
