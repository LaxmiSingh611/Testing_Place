import Link from "next/link";

const SECTIONS = [
  {
    title: "Get to know us",
    links: [
      { label: "About bazaar.in", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press releases", href: "#" },
    ],
  },
  {
    title: "Connect with us",
    links: [
      { label: "Facebook", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Instagram", href: "#" },
    ],
  },
  {
    title: "Let us help you",
    links: [
      { label: "Your account", href: "/account" },
      { label: "Your orders", href: "/account/orders" },
      { label: "Help center", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="mb-3 text-sm font-semibold text-slate-100">{section.title}</h3>
            <ul className="space-y-2 text-sm">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-amber-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Demo project — not affiliated with Amazon. Built for learning purposes.
      </div>
    </footer>
  );
}
