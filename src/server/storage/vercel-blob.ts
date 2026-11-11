import "server-only";
import type { StorageProvider, StorageObjectMeta } from "./provider";

/**
 * Vercel Blob adapter (production). İki kimlik modu:
 *  1) klasik BLOB_READ_WRITE_TOKEN,
 *  2) OIDC — BLOB_STORE_ID + Vercel'in çalışma anında otomatik sağladığı VERCEL_OIDC_TOKEN.
 *
 * Mağaza erişim türü desteği (private/public):
 *  - Public mağazada put access:'public' ile yazılır.
 *  - Private mağazada public put "Cannot use public access on a private store"
 *    hatası verir; adapter bunu yakalar ve access:'private' ile yeniden dener
 *    (süreç ömründe hatırlanır). Private blob'lar yalnızca sunucu tarafında
 *    kimlikle okunabilir → site, içeriği /api/media/<key> proxy rotasından sunar.
 *  - publicUrl her durumda aynı kökten (/api/media/<key>) verilir: CSP 'img-src self'
 *    uyumlu, URL kalıcı (imzalı/geçici URL'e bağımlı değil), tarayıcı immutable cache.
 */
const storeState = globalThis as unknown as { nofBlobPrivate?: boolean };

function isPrivateStoreError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /private store|public access/i.test(msg);
}

export class VercelBlobProvider implements StorageProvider {
  readonly name = "vercel-blob";

  private async sdk() {
    // İki kimlik modu: (1) klasik BLOB_READ_WRITE_TOKEN, (2) OIDC — BLOB_STORE_ID +
    // Vercel'in çalışma anında otomatik sağladığı VERCEL_OIDC_TOKEN. İkisi de yoksa
    // SDK kendi "No token found" hatasını verir; burada erken ve net uyarı veriyoruz.
    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
      throw new Error("Vercel Blob kimlik bilgisi tanımlı değil (BLOB_READ_WRITE_TOKEN veya BLOB_STORE_ID)");
    }
    return import("@vercel/blob");
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<{ key: string; publicUrl: string }> {
    const { put } = await this.sdk();
    if (!storeState.nofBlobPrivate) {
      try {
        await put(key, data, { access: "public", contentType: mimeType, addRandomSuffix: false });
      } catch (e) {
        if (!isPrivateStoreError(e)) throw e;
        // Mağaza private erişimle oluşturulmuş: private yazıma otomatik geç.
        storeState.nofBlobPrivate = true;
      }
    }
    if (storeState.nofBlobPrivate) {
      await put(key, data, { access: "private", contentType: mimeType, addRandomSuffix: false });
    }
    return { key, publicUrl: this.getPublicUrl(key) };
  }

  async get(key: string): Promise<Buffer | null> {
    if (storeState.nofBlobPrivate) return this.getViaSdk(key);
    // Public/unknown mağaza: head ile kalıcı URL al, doğrudan oku; olmazsa SDK ile dene.
    const { head } = await this.sdk();
    const meta = await head(key).catch(() => null);
    if (meta?.url) {
      const res = await fetch(meta.url).catch(() => null);
      if (res?.ok) return Buffer.from(await res.arrayBuffer());
    }
    return this.getViaSdk(key);
  }

  private async getViaSdk(key: string): Promise<Buffer | null> {
    try {
      const { get } = await this.sdk();
      const res = await get(key, { access: "private" });
      if (!res || res.statusCode !== 200 || !res.stream) return null;
      const chunks: Buffer[] = [];
      const reader = res.stream.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
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
    const access = storeState.nofBlobPrivate ? "private" : "public";
    try {
      await copy(fromKey, toKey, { access, addRandomSuffix: false });
    } catch (e) {
      if (!isPrivateStoreError(e)) throw e;
      storeState.nofBlobPrivate = true;
      await copy(fromKey, toKey, { access: "private", addRandomSuffix: false });
    }
    return { key: toKey, publicUrl: this.getPublicUrl(toKey) };
  }

  getPublicUrl(key: string): string {
    // Her zaman site-içi proxy: kalıcı URL, CSP self uyumu, immutable tarayıcı cache.
    return `/api/media/${key}`;
  }
}
