import { redirect } from "next/navigation";
import Link from "next/link";
import { Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSellerByUserId } from "@/server/queries/seller.queries";
import { Button } from "@/components/ui/button";
import { SellerApplicationForm } from "@/components/storefront/seller-application-form";

export default async function SellPage() {
  const session = await auth();

  if (session?.user) {
    const seller = await getSellerByUserId(session.user.id);
    if (seller) redirect("/seller");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 text-center">
        <Store className="mx-auto mb-3 size-10 text-amber-500" />
        <h1 className="text-2xl font-semibold text-slate-900">Sell on bazaar.in</h1>
        <p className="mt-2 text-slate-600">
          Set up your own store, list products, and start reaching customers today — no approval wait.
        </p>
      </div>

      {session?.user ? (
        <SellerApplicationForm />
      ) : (
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="mb-4 text-sm text-slate-600">Sign in to your account to start selling.</p>
          <Button render={<Link href="/sign-in?callbackUrl=/sell" />} nativeButton={false} className="w-full">
            Sign in to continue
          </Button>
        </div>
      )}
    </div>
  );
}
