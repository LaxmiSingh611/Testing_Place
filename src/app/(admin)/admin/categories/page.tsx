import { getAllCategoriesWithCounts } from "@/server/queries/category.queries";
import { CategoryTree } from "@/components/admin/category-tree";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesWithCounts();
  const parentOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
        <CategoryFormDialog parentOptions={parentOptions} />
      </div>
      <CategoryTree categories={categories} />
    </div>
  );
}
