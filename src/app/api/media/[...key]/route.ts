import { getStorage } from "@/server/storage";

/**
 * Medya sunum proxy'si (public): Vercel Blob içeriğini site aynı kökünden servis eder.
 *  - Private mağazada blob'lar yalnızca sunucu tarafı kimlikle okunabilir; bu rota
 *    içeriği okuyup akıtır → site görselleri kalıcı, aynı-kök URL'lerle çalışır.
 *  - Public mağazada da aynı kök kullanılır (CSP img-src 'self' uyumu, kararlı URL).
 *  - Key'ler UUID taşır (tahmin edilemez) ve yükleme sonrası değişmez → immutable cache.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
};

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const storageKey = (key ?? []).join("/");

  // Key biçim koruması: yalnızca güvenli karakterler, yol geçişi yok.
  if (!storageKey || storageKey.includes("..") || !/^[a-zA-Z0-9][a-zA-Z0-9/._-]*$/.test(storageKey)) {
    return new Response("Geçersiz medya adresi.", { status: 400 });
  }

  const storage = getStorage();
  const buf = await storage.get(storageKey).catch(() => null);
  if (!buf) return new Response("Medya bulunamadı.", { status: 404 });

  const ext = storageKey.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(buf.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
