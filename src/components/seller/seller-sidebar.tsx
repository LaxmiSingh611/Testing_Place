"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ClipboardList, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/seller", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Orders", href: "/seller/orders", icon: ClipboardList },
];

export function SellerSidebar({ storeName }: { storeName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-4">
        <Link href="/" className="text-lg font-bold">
          bazaar<span className="text-amber-400">.in</span>
        </Link>
        <p className="truncate text-xs text-slate-400">{storeName}</p>
      </div>
      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/seller" ? pathname === "/seller" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                isActive ? "bg-amber-400 text-slate-900" : "text-slate-300 hover:bg-slate-800",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="size-4" />
          Back to store
        </Link>
      </div>
    </aside>
  );
}
