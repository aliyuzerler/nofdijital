import "server-only";
import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";
import { VercelBlobProvider } from "./vercel-blob";

const globalForStorage = globalThis as unknown as { nofStorage: StorageProvider | undefined };

/** STORAGE_PROVIDER env'ine göre adapter üretir (varsayılan local). */
export function getStorage(): StorageProvider {
  if (globalForStorage.nofStorage) return globalForStorage.nofStorage;
  const wanted = process.env.STORAGE_PROVIDER ?? "local";
  let provider: StorageProvider;
  if (wanted === "vercel-blob" && process.env.BLOB_READ_WRITE_TOKEN) {
    provider = new VercelBlobProvider();
  } else if (wanted === "s3") {
    // Faz 7/VPS taşımada aktiflenecek S3/MinIO adapter'ı; şimdilik local fallback.
    provider = new LocalStorageProvider();
  } else {
    provider = new LocalStorageProvider();
  }
  globalForStorage.nofStorage = provider;
  return provider;
}
