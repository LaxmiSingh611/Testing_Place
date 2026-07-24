"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { productSchema, type ProductInput } from "@/validation/product.schema";
import { createProduct, updateProduct } from "@/server/actions/product.actions";
import { slugify } from "@/lib/utils";

type ProductFormInput = z.input<typeof productSchema>;

type SerializedProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  isActive: boolean;
  categoryId: string;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: SerializedProduct;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          title: product.title,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? undefined,
          stock: product.stock,
          sku: product.sku ?? "",
          isActive: product.isActive,
          categoryId: product.categoryId,
        }
      : { isActive: true },
  });

  const isActive = watch("isActive");

  const onSubmit = async (values: ProductInput) => {
    if (product) {
      const result = await updateProduct(product.id, values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Product updated");
      router.refresh();
      return;
    }

    const result = await createProduct(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Product created — now add some images");
    router.push(`/admin/products/${result.productId}/edit`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register("title")}
          onBlur={(e) => {
            if (!getValues("slug")) setValue("slug", slugify(e.target.value));
          }}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...register("slug")} />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" type="number" step="0.01" {...register("price")} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="compareAtPrice">Compare-at price (optional)</Label>
          <Input id="compareAtPrice" type="number" step="0.01" {...register("compareAtPrice")} />
          {errors.compareAtPrice && <p className="text-sm text-destructive">{errors.compareAtPrice.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" {...register("stock")} />
          {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU (optional)</Label>
          <Input id="sku" {...register("sku")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          {...register("categoryId")}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked === true)}
        />
        <Label htmlFor="isActive" className="font-normal">
          Visible to customers
        </Label>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : product ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
