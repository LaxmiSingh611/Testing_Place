"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export function OrderStatusChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const data = STATUS_ORDER.map((status) => ({ status, count: statusCounts[status] ?? 0 }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
