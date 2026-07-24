import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "REFUNDED" || status === "PENDING") {
    return (
      <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
        {status === "PENDING" ? "Awaiting payment" : status === "CANCELLED" ? "Order cancelled" : "Refunded"}
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  isComplete ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400",
                )}
              >
                {isComplete ? <Check className="size-4" /> : index + 1}
              </div>
              <span className={cn("text-xs", isComplete ? "text-slate-900" : "text-slate-400")}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn("mx-2 h-0.5 flex-1", index < currentIndex ? "bg-emerald-500" : "bg-slate-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
