"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { addressSchema, type AddressInput } from "@/validation/address.schema";
import { createAddress, updateAddress } from "@/server/actions/address.actions";
import type { Address } from "@/generated/prisma/client";

type AddressFormInput = z.input<typeof addressSchema>;

export function AddressForm({
  address,
  onSaved,
}: {
  address?: Address;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInput, unknown, AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 ?? "",
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        }
      : { country: "IN", isDefault: false },
  });

  const isDefault = watch("isDefault");

  const onSubmit = async (values: AddressInput) => {
    const result = address ? await updateAddress(address.id, values) : await createAddress(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(address ? "Address updated" : "Address added");
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="line1">Address line 1</Label>
        <Input id="line1" {...register("line1")} />
        {errors.line1 && <p className="text-sm text-destructive">{errors.line1.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="line2">Address line 2 (optional)</Label>
        <Input id="line2" {...register("line2")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} />
          {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...register("state")} />
          {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" {...register("postalCode")} />
          {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isDefault"
          checked={isDefault}
          onCheckedChange={(checked) => setValue("isDefault", checked === true)}
        />
        <Label htmlFor="isDefault" className="font-normal">
          Set as default address
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : address ? "Save changes" : "Add address"}
      </Button>
    </form>
  );
}
