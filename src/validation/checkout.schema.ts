import { z } from "zod";

/** Billing address is set equal to the shipping address for this MVP — no separate billing step. */
export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, "Select a shipping address"),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const mockPaymentMethodSchema = z.enum(["MOCK_CARD", "MOCK_UPI", "COD"]);
export type MockPaymentMethod = z.infer<typeof mockPaymentMethodSchema>;
