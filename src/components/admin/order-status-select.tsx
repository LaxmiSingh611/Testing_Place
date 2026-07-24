"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_TRANSITIONS, type OrderStatusInput } from "@/validation/order.schema";
import { updateOrderStatus } from "@/server/actions/order.actions";

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const nextOptions = ORDER_STATUS_TRANSITIONS[status] ?? [];
  const [selected, setSelected] = useState<string>(nextOptions[0] ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (nextOptions.length === 0) {
    return <p className="text-sm text-slate-500">No further status transitions available.</p>;
  }

  const handleUpdate = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    const result = await updateOrderStatus(orderId, selected as OrderStatusInput);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Order marked as ${selected}`);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      >
        {nextOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Button size="sm" disabled={isSubmitting} onClick={handleUpdate}>
        {isSubmitting ? "Updating..." : "Update status"}
      </Button>
    </div>
  );
}
