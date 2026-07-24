"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { deleteProduct } from "@/server/actions/product.actions";

export function ProductDeleteButton({ productId, title }: { productId: string; title: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteProduct(productId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Product removed");
    router.refresh();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="icon-sm" />}>
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{title}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            If this product has past orders, it will be hidden from customers instead of deleted, to preserve order
            history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
