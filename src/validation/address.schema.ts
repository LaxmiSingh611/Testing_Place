import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number"),
  line1: z.string().trim().min(3, "Address is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z.string().trim().regex(/^[0-9]{4,10}$/, "Enter a valid postal code"),
  country: z.string().trim().default("IN"),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;
