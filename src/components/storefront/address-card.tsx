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
import { AddressFormDialog } from "@/components/storefront/address-form-dialog";
import { deleteAddress } from "@/server/actions/address.actions";
import type { Address } from "@/generated/prisma/client";

export function AddressCard({ address }: { address: Address }) {
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteAddress(address.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Address removed");
    router.refresh();
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <p className="font-medium text-slate-900">{address.fullName}</p>
        {address.isDefault && <Badge variant="secondary">Default</Badge>}
      </div>
      <p className="text-sm text-slate-600">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
      </p>
      <p className="text-sm text-slate-600">
        {address.city}, {address.state} {address.postalCode}
      </p>
      <p className="text-sm text-slate-600">{address.phone}</p>

      <div className="mt-3 flex gap-2">
        <AddressFormDialog address={address} />
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
            <Trash2 className="size-3.5" /> Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this address?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
