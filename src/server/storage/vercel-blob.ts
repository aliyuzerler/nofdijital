import "server-only";
import type { StorageProvider, StorageObjectMeta } from "./provider";
import type { PutBlobResult } from "@vercel/blob";

/**
 * Vercel Blob adapter (production). BLOB_READ_WRITE_TOKEN yalnızca server runtime'da;
 * token yoksa provider seçilmez (fallback local).
 */
export class VercelBlobProvider implements StorageProvider {
  readonly name = "vercel-blob";

  private async sdk() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN tanımlı değil");
    }
    return import("@vercel/blob");
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<{ key: string; publicUrl: string }> {
    const { put } = await this.sdk();
    const res: PutBlobResult = await put(key, data, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return { key, publicUrl: res.url };
  }

  async get(key: string): Promise<Buffer | null> {
    // Blob public URL üzerinden okunur; sunucu tarafında gerekliyse fetch kullanılır.
    const url = this.resolveUrl(key);
    if (!url) return null;
    const res = await fetch(url).catch(() => null);
    return res && res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  }

  async head(key: string): Promise<StorageObjectMeta | null> {
    const { head } = await this.sdk();
    const meta = await head(key).catch(() => null);
    return meta ? { sizeBytes: meta.size, mimeType: meta.contentType } : null;
  }

  async delete(key: string): Promise<void> {
    // Blob'da kayıt yoksa hata vermesin (lokal adapter davranışıyla uyumlu).
    try {
      const { del } = await this.sdk();
      await del(key);
    } catch {
      /* yok say */
    }
  }

  async copy(fromKey: string, toKey: string): Promise<{ key: string; publicUrl: string }> {
    const { copy } = await this.sdk();
    const res = await copy(fromKey, toKey, { access: "public", addRandomSuffix: false });
    return { key: toKey, publicUrl: res.url };
  }

  private resolveUrl(key: string): string | null {
    return process.env.BLOB_PUBLIC_BASE_URL ? `${process.env.BLOB_PUBLIC_BASE_URL}/${key}` : null;
  }

  getPublicUrl(key: string): string {
    return `${process.env.BLOB_PUBLIC_BASE_URL ?? ""}/${key}`;
  }
}
