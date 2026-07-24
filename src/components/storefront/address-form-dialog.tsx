"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddressForm } from "@/components/storefront/address-form";
import type { Address } from "@/generated/prisma/client";

export function AddressFormDialog({ address }: { address?: Address }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={address ? "outline" : "default"} size={address ? "sm" : "default"} />
        }
      >
        {address ? (
          <>
            <Pencil className="size-3.5" /> Edit
          </>
        ) : (
          <>
            <Plus className="size-4" /> Add new address
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add a new address"}</DialogTitle>
        </DialogHeader>
        <AddressForm
          address={address}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
