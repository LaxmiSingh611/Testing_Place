import { getAllCategoriesFlat } from "@/server/queries/category.queries";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await getAllCategoriesFlat();

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
