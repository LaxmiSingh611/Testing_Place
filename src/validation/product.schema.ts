import { z } from "zod";

export const productSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().positive("Compare-at price must be greater than 0").optional(),
  ),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().min(1, "Category is required"),
});
export type ProductInput = z.infer<typeof productSchema>;
