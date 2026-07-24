import { z } from "zod";

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;

/** Allowed forward transitions; admins can also cancel from any pre-shipped state. */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionOrderStatus(from: string, to: string): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
