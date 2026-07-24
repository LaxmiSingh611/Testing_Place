import { notFound } from "next/navigation";
import { getProductByIdAdmin } from "@/server/queries/product.queries";
import { getAllCategoriesFlat } from "@/server/queries/category.queries";
import { ProductForm } from "@/components/admin/product-form";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const [product, categories] = await Promise.all([getProductByIdAdmin(productId), getAllCategoriesFlat()]);

  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Edit product</h1>
      <ProductForm product={product} categories={categories} />

      <div className="space-y-3 rounded-lg border bg-white p-5">
        <h2 className="font-medium text-slate-900">Images</h2>
        <MultiImageUploader productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
