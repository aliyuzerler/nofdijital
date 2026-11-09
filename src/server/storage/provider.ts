import "server-only";

/**
 * StorageProvider arayüzü (docs/09-PORTABILITY):
 * Medya sağlayıcısı uygulama iş mantığından soyutlanır. Provider + storage_key
 * DB'de tutulur; public URL adapter'dan üretilir.
 */
export interface StorageObjectMeta {
  sizeBytes: number;
  mimeType: string;
}

export interface StorageProvider {
  readonly name: string;
  /** Dosyayı depolar; deterministik key döner. */
  upload(key: string, data: Buffer, mimeType: string): Promise<{ key: string; publicUrl: string }>;
  /** Key'e göre dosyayı okur (local adapter için). */
  get(key: string): Promise<Buffer | null>;
  head(key: string): Promise<StorageObjectMeta | null>;
  delete(key: string): Promise<void>;
  copy(fromKey: string, toKey: string): Promise<{ key: string; publicUrl: string }>;
  getPublicUrl(key: string): string;
}
