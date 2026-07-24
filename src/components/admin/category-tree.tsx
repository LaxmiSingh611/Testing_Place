"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { deleteCategory } from "@/server/actions/category.actions";
import type { Category } from "@/generated/prisma/client";

type CategoryWithCounts = Category & {
  _count: { children: number; products: number };
};

export function CategoryTree({ categories }: { categories: CategoryWithCounts[] }) {
  const router = useRouter();
  const topLevel = categories.filter((c) => !c.parentId);
  const parentOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  const handleDelete = async (id: string) => {
    const result = await deleteCategory(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Category deleted");
    router.refresh();
  };

  const renderRow = (category: CategoryWithCounts, indent: boolean) => (
    <div
      key={category.id}
      className={`flex items-center justify-between rounded-lg border bg-white p-3 ${indent ? "ml-6" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-900">{category.name}</span>
        <span className="text-xs text-slate-400">/{category.slug}</span>
        {category._count.products > 0 && <Badge variant="secondary">{category._count.products} products</Badge>}
        {category._count.children > 0 && <Badge variant="secondary">{category._count.children} subcategories</Badge>}
      </div>
      <div className="flex gap-2">
        <CategoryFormDialog category={category} parentOptions={parentOptions} />
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
            <Trash2 className="size-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{category.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                {category._count.children > 0 || category._count.products > 0
                  ? "This category has subcategories or products and cannot be deleted until they are reassigned."
                  : "This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(category.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {topLevel.map((parent) => (
        <div key={parent.id} className="space-y-2">
          {renderRow(parent, false)}
          {categories.filter((c) => c.parentId === parent.id).map((child) => renderRow(child, true))}
        </div>
      ))}
    </div>
  );
}
