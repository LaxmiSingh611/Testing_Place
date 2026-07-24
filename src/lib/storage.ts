import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "public/uploads/products";
const UPLOADS_PUBLIC_PATH = process.env.UPLOADS_PUBLIC_PATH ?? "/uploads/products";

const MAX_DIMENSION = 1600;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

let sharpLoadFailed = false;

/**
 * Saves an uploaded product image to local disk (dev-local stand-in for S3),
 * re-encoding to webp and capping dimensions via sharp when its native binding
 * is available. Falls back to storing the original bytes untouched if sharp's
 * native module can't load in this environment (e.g. a missing platform
 * binary), so uploads still work without image optimization.
 * Swappable later for an S3 client behind the same (buffer) => (publicUrl) signature.
 */
export async function saveProductImage(buffer: Buffer, mimeType = "image/jpeg"): Promise<string> {
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), UPLOADS_DIR);
  await mkdir(dir, { recursive: true });

  if (!sharpLoadFailed) {
    try {
      const sharp = (await import("sharp")).default;
      const filename = `${randomUUID()}.webp`;
      const filePath = path.join(dir, filename);
      await sharp(buffer)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(filePath);
      return `${UPLOADS_PUBLIC_PATH}/${filename}`;
    } catch (error) {
      sharpLoadFailed = true;
      console.warn("sharp unavailable, storing uploaded images without optimization:", error);
    }
  }

  const ext = MIME_EXTENSIONS[mimeType] ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `${UPLOADS_PUBLIC_PATH}/${filename}`;
}

export async function deleteProductImage(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(UPLOADS_PUBLIC_PATH)) return;
  const filename = publicUrl.slice(UPLOADS_PUBLIC_PATH.length + 1);
  if (!filename || filename.includes("..") || filename.includes("/")) return;

  const filePath = path.join(process.cwd(), UPLOADS_DIR, filename);
  await unlink(filePath).catch(() => undefined);
}
