"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CreditCard, Smartphone, Banknote, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { processMockPayment } from "@/server/actions/checkout.actions";
import type { MockPaymentMethod } from "@/validation/checkout.schema";

const METHODS: { value: MockPaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: "MOCK_CARD", label: "Credit / Debit Card", icon: CreditCard },
  { value: "MOCK_UPI", label: "UPI", icon: Smartphone },
  { value: "COD", label: "Cash on Delivery", icon: Banknote },
];

const PROCESSING_MESSAGES = ["Contacting payment gateway...", "Verifying details...", "Almost done..."];

export function MockPaymentForm({ orderId, amount }: { orderId: string; amount: number }) {
  const [method, setMethod] = useState<MockPaymentMethod>("MOCK_CARD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, PROCESSING_MESSAGES.length - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handlePay = async () => {
    setFailureReason(null);
    setIsProcessing(true);
    setMessageIndex(0);

    const result = await processMockPayment(orderId, method);
    setIsProcessing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (result.status === "SUCCEEDED") {
      router.push(`/checkout/confirmation/${orderId}`);
    } else {
      setFailureReason("Payment declined by mock gateway. Please try again.");
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-white py-16">
        <Loader2 className="size-10 animate-spin text-amber-500" />
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-slate-600"
          >
            {PROCESSING_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-6">
      {failureReason && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="size-4 shrink-0" />
          {failureReason}
        </div>
      )}

      <div className="space-y-2">
        {METHODS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
              method === value && "border-amber-500 ring-1 ring-amber-500",
            )}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={method === value}
              onChange={() => setMethod(value)}
            />
            <Icon className="size-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-800">{label}</span>
          </label>
        ))}
      </div>

      <Button className="w-full" onClick={handlePay}>
        {failureReason ? "Try again — " : "Pay "}
        {formatPrice(amount)}
      </Button>
      <p className="text-center text-xs text-slate-400">
        This is a simulated payment for demo purposes. No real transaction occurs.
      </p>
    </div>
  );
}
