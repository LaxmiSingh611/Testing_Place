"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteProductImage, moveProductImage } from "@/server/actions/product.actions";

type ImageItem = { id: string; url: string; position: number };
type UploadingItem = { tempId: string; fileName: string; progress: number };

export function MultiImageUploader({ productId, images }: { productId: string; images: ImageItem[] }) {
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const uploadFile = (file: File) => {
    const tempId = crypto.randomUUID();
    setUploading((prev) => [...prev, { tempId, fileName: file.name, progress: 0 }]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/uploads");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploading((prev) => prev.map((u) => (u.tempId === tempId ? { ...u, progress } : u)));
      }
    };
    xhr.onload = () => {
      setUploading((prev) => prev.filter((u) => u.tempId !== tempId));
      if (xhr.status === 200) {
        router.refresh();
      } else {
        const message = (() => {
          try {
            return JSON.parse(xhr.responseText).error;
          } catch {
            return "Upload failed";
          }
        })();
        toast.error(message ?? "Upload failed");
      }
    };
    xhr.onerror = () => {
      setUploading((prev) => prev.filter((u) => u.tempId !== tempId));
      toast.error("Upload failed");
    };
    xhr.send(formData);
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadFile);
  };

  const handleDelete = async (imageId: string) => {
    const result = await deleteProductImage(imageId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  };

  const handleMove = async (imageId: string, direction: "left" | "right") => {
    await moveProductImage(imageId, direction);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging ? "border-amber-500 bg-amber-50" : "border-slate-300 hover:border-slate-400",
        )}
      >
        <UploadCloud className="size-8 text-slate-400" />
        <p className="text-sm text-slate-600">Drag &amp; drop images here, or click to browse</p>
        <p className="text-xs text-slate-400">JPEG, PNG, WebP or AVIF, up to 8MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <AnimatePresence>
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="group relative aspect-square overflow-hidden rounded-md border bg-slate-100"
            >
              <Image src={image.url} alt="" fill sizes="150px" className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(image.id, "left")}
                    className="rounded bg-white/90 p-1"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(image.id)} className="rounded bg-white/90 p-1">
                  <X className="size-4" />
                </button>
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(image.id, "right")}
                    className="rounded bg-white/90 p-1"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {uploading.map((item) => (
          <div
            key={item.tempId}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border bg-slate-50 p-2"
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className="h-full bg-amber-400"
                animate={{ width: `${item.progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <p className="w-full truncate text-center text-xs text-slate-500">{item.fileName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
