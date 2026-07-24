"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryForm } from "@/components/admin/category-form";
import type { Category } from "@/generated/prisma/client";

export function CategoryFormDialog({
  category,
  parentOptions,
}: {
  category?: Category;
  parentOptions: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={category ? "outline" : "default"} size={category ? "sm" : "default"} />}>
        {category ? (
          <>
            <Pencil className="size-3.5" /> Edit
          </>
        ) : (
          <>
            <Plus className="size-4" /> New category
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <CategoryForm
          category={category}
          parentOptions={parentOptions}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
