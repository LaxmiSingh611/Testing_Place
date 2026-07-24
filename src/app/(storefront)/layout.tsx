import { Suspense } from "react";
import { NavBar, NavBarFallback } from "@/components/shared/nav-bar";
import { Footer } from "@/components/shared/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Suspense fallback={<NavBarFallback />}>
        <NavBar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
