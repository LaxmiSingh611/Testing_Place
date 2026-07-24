"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sellerApplicationSchema, type SellerApplicationInput } from "@/validation/seller.schema";
import { applyToBecomeSeller } from "@/server/actions/seller.actions";
import { slugify } from "@/lib/utils";

export function SellerApplicationForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SellerApplicationInput>({
    resolver: zodResolver(sellerApplicationSchema),
  });

  const onSubmit = async (values: SellerApplicationInput) => {
    const result = await applyToBecomeSeller(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Welcome — your store is live!");
    router.push("/seller");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-6">
      <div className="space-y-1.5">
        <Label htmlFor="storeName">Store name</Label>
        <Input
          id="storeName"
          {...register("storeName")}
          onBlur={(e) => {
            if (!getValues("storeSlug")) setValue("storeSlug", slugify(e.target.value));
          }}
        />
        {errors.storeName && <p className="text-sm text-destructive">{errors.storeName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="storeSlug">Store URL</Label>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <span>bazaar.in/sellers/</span>
          <Input id="storeSlug" className="flex-1" {...register("storeSlug")} />
        </div>
        {errors.storeSlug && <p className="text-sm text-destructive">{errors.storeSlug.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Tell customers about your store (optional)</Label>
        <Textarea id="description" rows={3} {...register("description")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating your store..." : "Start selling"}
      </Button>
    </form>
  );
}
