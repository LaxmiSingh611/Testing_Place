"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema, type CategoryInput } from "@/validation/category.schema";
import { createCategory, updateCategory } from "@/server/actions/category.actions";
import { slugify } from "@/lib/utils";
import type { Category } from "@/generated/prisma/client";

export function CategoryForm({
  category,
  parentOptions,
  onSaved,
}: {
  category?: Category;
  parentOptions: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          imageUrl: category.imageUrl ?? "",
          parentId: category.parentId,
        }
      : { parentId: null },
  });

  const onSubmit = async (values: CategoryInput) => {
    const result = category ? await updateCategory(category.id, values) : await createCategory(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(category ? "Category updated" : "Category created");
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name")}
          onBlur={(e) => {
            if (!getValues("slug")) setValue("slug", slugify(e.target.value));
          }}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...register("slug")} />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="parentId">Parent category</Label>
        <select
          id="parentId"
          {...register("parentId")}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">None (top-level)</option>
          {parentOptions
            .filter((p) => p.id !== category?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" rows={2} {...register("description")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : category ? "Save changes" : "Create category"}
      </Button>
    </form>
  );
}
