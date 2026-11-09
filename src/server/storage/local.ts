import "server-only";
import { mkdir, writeFile, readFile, stat, copyFile, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import type { StorageProvider, StorageObjectMeta } from "./provider";

/** Sandbox/local geliştirme adapter'ı: public/uploads altına yazar. */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private baseDir: string;
  private urlPrefix = "/uploads";

  constructor(baseDir?: string) {
    this.baseDir = resolve(process.cwd(), baseDir ?? "public/uploads");
  }

  private abs(key: string): string {
    if (key.includes("..")) throw new Error("Geçersiz storage key");
    return resolve(this.baseDir, key);
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<{ key: string; publicUrl: string }> {
    const target = this.abs(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
    void mimeType;
    return { key, publicUrl: this.getPublicUrl(key) };
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.abs(key));
    } catch {
      return null;
    }
  }

  async head(key: string): Promise<StorageObjectMeta | null> {
    try {
      const s = await stat(this.abs(key));
      return { sizeBytes: s.size, mimeType: "application/octet-stream" };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.abs(key));
    } catch {
      /* yok say */
    }
  }

  async copy(fromKey: string, toKey: string): Promise<{ key: string; publicUrl: string }> {
    const target = this.abs(toKey);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(this.abs(fromKey), target);
    return { key: toKey, publicUrl: this.getPublicUrl(toKey) };
  }

  getPublicUrl(key: string): string {
    return `${this.urlPrefix}/${key}`;
  }
}
