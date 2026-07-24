import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "public/uploads/products";
const UPLOADS_PUBLIC_PATH = process.env.UPLOADS_PUBLIC_PATH ?? "/uploads/products";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Saves an uploaded product image to local disk (dev-local stand-in for S3).
 * Deliberately stores the original bytes as-is rather than re-encoding via sharp:
 * sharp's native binding fails to load in this environment (ERR_DLOPEN_FAILED),
 * and — because Turbopack eagerly pre-resolves dynamic imports at compile time,
 * outside of any try/catch around the actual call — a dynamic `import("sharp")`
 * here crashes the whole dev server on first compile rather than failing
 * gracefully at call time. If a future environment has a working sharp install,
 * resizing/webp conversion can be reintroduced behind an explicit opt-in.
 * Swappable later for an S3 client behind the same (buffer) => (publicUrl) signature.
 */
export async function saveProductImage(buffer: Buffer, mimeType = "image/jpeg"): Promise<string> {
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), UPLOADS_DIR);
  await mkdir(dir, { recursive: true });

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
