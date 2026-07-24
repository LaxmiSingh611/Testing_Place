"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { IndianRupee, ShoppingBag, Package, Users } from "lucide-react";

const ICONS = {
  revenue: IndianRupee,
  orders: ShoppingBag,
  products: Package,
  customers: Users,
} as const;

export function StatsCard({
  label,
  value,
  icon,
  variant = "number",
}: {
  label: string;
  value: number;
  icon: keyof typeof ICONS;
  variant?: "currency" | "number";
}) {
  const Icon = ICONS[icon];
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = variant === "currency" ? `₹${v.toLocaleString("en-IN")}` : v.toLocaleString("en-IN");
      }
    });
  }, [rounded, variant]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border bg-white p-4"
    >
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span ref={ref} className="text-2xl font-semibold text-slate-900">
        {variant === "currency" ? "₹0" : "0"}
      </span>
    </motion.div>
  );
}
