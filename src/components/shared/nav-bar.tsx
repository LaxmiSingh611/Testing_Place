import Link from "next/link";
import { Search, UserRound, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getTopLevelCategories } from "@/server/queries/category.queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NavAccountMenu } from "@/components/shared/nav-account-menu";
import { CartTrigger } from "@/components/shared/cart-trigger";

export async function NavBar() {
  const [session, categories] = await Promise.all([auth(), getTopLevelCategories()]);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-slate-900 text-slate-50">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" className="shrink-0 text-xl font-bold tracking-tight">
            bazaar<span className="text-amber-400">.in</span>
          </Link>

          <form action="/products" method="GET" className="hidden flex-1 items-stretch sm:flex">
            <Input
              name="q"
              placeholder="Search products, brands and more"
              className="rounded-r-none border-0 bg-white text-slate-900 focus-visible:ring-0"
            />
            <Button type="submit" className="rounded-l-none bg-amber-400 text-slate-900 hover:bg-amber-300">
              <Search className="size-4" />
            </Button>
          </form>

          <div className="ml-auto flex items-center gap-4">
            <NavAccountMenu
              isSignedIn={Boolean(session?.user)}
              userName={session?.user?.name ?? null}
              isAdmin={session?.user?.role === "ADMIN"}
            />
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden items-center gap-1 text-sm font-medium text-amber-400 hover:underline sm:flex"
              >
                <ShieldCheck className="size-4" />
                Admin
              </Link>
            )}
            <CartTrigger />
          </div>
        </div>
        <form action="/products" method="GET" className="flex px-4 pb-3 sm:hidden">
          <Input name="q" placeholder="Search bazaar.in" className="rounded-r-none border-0 bg-white text-slate-900" />
          <Button type="submit" className="rounded-l-none bg-amber-400 text-slate-900 hover:bg-amber-300">
            <Search className="size-4" />
          </Button>
        </form>
      </div>

      <nav className="border-b bg-slate-800 text-slate-100">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2 text-sm">
          <Link href="/products" className="shrink-0 font-medium hover:text-amber-300">
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="shrink-0 hover:text-amber-300"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function NavBarFallback() {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 py-3">
      <div className="mx-auto flex max-w-7xl items-center px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-50">
          bazaar<span className="text-amber-400">.in</span>
        </Link>
        <UserRound className="ml-auto size-5 text-slate-50" />
      </div>
    </header>
  );
}
