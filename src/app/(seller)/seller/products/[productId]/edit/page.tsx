import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSellerByUserId, getSellerProductById } from "@/server/queries/seller.queries";
import { getAllCategoriesFlat } from "@/server/queries/category.queries";
import { ProductForm } from "@/components/admin/product-form";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";

export default async function EditSellerProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/sell");
  const seller = await getSellerByUserId(session.user.id);
  if (!seller) redirect("/sell");

  const [product, categories] = await Promise.all([
    getSellerProductById(productId, seller.id),
    getAllCategoriesFlat(),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Edit product</h1>
      <ProductForm product={product} categories={categories} basePath="/seller/products" />

      <div className="space-y-3 rounded-lg border bg-white p-5">
        <h2 className="font-medium text-slate-900">Images</h2>
        <MultiImageUploader productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
