import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSellerByUserId } from "@/server/queries/seller.queries";
import { SellerSidebar } from "@/components/seller/seller-sidebar";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sell");

  const seller = await getSellerByUserId(session.user.id);
  if (!seller) redirect("/sell");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SellerSidebar storeName={seller.storeName} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
