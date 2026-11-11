import "server-only";
import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";
import { VercelBlobProvider } from "./vercel-blob";

const globalForStorage = globalThis as unknown as { nofStorage: StorageProvider | undefined };

/**
 * STORAGE_PROVIDER env'ine göre adapter üretir.
 * - STORAGE_PROVIDER=vercel-blob → Vercel Blob (token yoksa sdk net hata verir)
 * - STORAGE_PROVIDER boş/unset ve BLOB_READ_WRITE_TOKEN tanımlıysa → Vercel Blob
 *   (üretimde tek env ile medya yükleme çalışsın diye otomatik seçim)
 * - aksi halde local (public/uploads; Vercel'de salt-okunur olduğu için üretimde
 *   kullanılamaz — upload route açık uyarı döner)
 */
export function getStorage(): StorageProvider {
  if (globalForStorage.nofStorage) return globalForStorage.nofStorage;
  const wanted = (process.env.STORAGE_PROVIDER ?? "").trim();
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  let provider: StorageProvider;
  if (wanted === "vercel-blob" || (!wanted && hasBlobToken)) {
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
