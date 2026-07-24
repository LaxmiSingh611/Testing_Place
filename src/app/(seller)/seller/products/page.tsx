import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSellerByUserId, getSellerProducts } from "@/server/queries/seller.queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductDeleteButton } from "@/components/admin/product-delete-button";
import { formatPrice } from "@/lib/utils";

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sell");
  const seller = await getSellerByUserId(session.user.id);
  if (!seller) redirect("/sell");

  const { q, page: pageParam } = await searchParams;
  const page = pageParam ? Number(pageParam) : 1;
  const { products, total } = await getSellerProducts({ sellerId: seller.id, q, page });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your products ({total})</h1>
        <Button render={<Link href="/seller/products/new" />} nativeButton={false}>
          <Plus className="size-4" /> New product
        </Button>
      </div>

      <form action="/seller/products" method="GET">
        <Input name="q" defaultValue={q} placeholder="Search your products..." className="max-w-sm" />
      </form>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b last:border-0">
                <td className="flex items-center gap-3 p-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded bg-slate-100">
                    {product.image && <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />}
                  </div>
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="font-medium text-slate-800 hover:text-amber-600"
                  >
                    {product.title}
                  </Link>
                </td>
                <td className="p-3 text-slate-600">{product.categoryName}</td>
                <td className="p-3 text-slate-600">{formatPrice(product.price)}</td>
                <td className="p-3 text-slate-600">{product.stock}</td>
                <td className="p-3">
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Active" : "Hidden"}
                  </Badge>
                </td>
                <td className="p-3">
                  <ProductDeleteButton productId={product.id} title={product.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">You haven&apos;t listed any products yet.</p>
        )}
      </div>
    </div>
  );
}
