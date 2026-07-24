import Link from "next/link";

const NAV_ITEMS = [
  { label: "Profile", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 md:flex-col">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
