"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; altText: string | null };

export function ProductGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div>
      <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              <Image
                src={active.url}
                alt={active.altText ?? title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">No image available</div>
          )}
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border-2",
                index === activeIndex ? "border-amber-500" : "border-transparent",
              )}
            >
              <Image src={image.url} alt={image.altText ?? title} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
