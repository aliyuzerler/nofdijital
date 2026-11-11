import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { mediaAssets } from "@/server/db/schema";
import { getStorage } from "@/server/storage";
import { getSessionUser } from "@/server/auth/guards";

/**
 * Medya yükleme (admin). Çoklu dosya, multipart/form-data → alan adı "files".
 * Güvenlik: oturum + rol (owner|editor), MIME allowlist + magic bytes,
 * 10 MB üst sınır, sharp ile doğrulama, sha256 checksum (duplicate uyarısı).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Magic byte kontrolleri — dosya uzantısına güvenme. */
function detectMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && (buf.toString("ascii", 8, 12) === "avif" || buf.toString("ascii", 8, 12) === "avis")) {
    return "image/avif";
  }
  return null;
}

function sanitizeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "dosya";
  const stem = base
    .normalize("NFKD")
    .replace(/[ıİ]/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return stem || "dosya";
}

const resultSchema = z.object({
  id: z.string(),
  publicUrl: z.string(),
  duplicate: z.boolean(),
});

export type UploadResult = z.infer<typeof resultSchema>;

/** Depolama hatalarını kullanıcı dostu Türkçe mesaja çevirir. */
function storageErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const code = (e as { code?: string } | null)?.code ?? "";
  if (code === "EROFS" || code === "EACCES" || /read-only|EROFS|EACCES/i.test(msg)) {
    return "Sunucu diski yazmaya kapalı (Vercel). Medya yüklemesi için Vercel Blob gerekli: Vercel > Depolama > Blob mağazası oluşturup projeye bağlayın (bağlantı sırasında 'Add a read-write token' işaretleyin) ve yeniden deploy edin.";
  }
  if (/BLOB_READ_WRITE_TOKEN|no token found|kimlik bilgisi tanımlı değil/i.test(msg)) {
    return "Vercel Blob kimlik bilgisi bulunamadı. Çözüm: Vercel > Depolama > Blob mağazası > Projects sekmesi > proje bağlantısını güncelleyip 'Add a read-write token' seçeneğini işaretleyin veya OIDC bağlantısını (BLOB_STORE_ID) etkinleştirin; ardından yeniden deploy edin.";
  }
  if (/private store|public access/i.test(msg)) {
    return "Blob mağazanıza private erişimle yazılamadı. Sistem normalde bu durumda otomatik olarak private yazıma geçer; bu hatayı görüyorsanız mağaza izinlerinde bir kısıt vardır. Çözüm: Vercel > Depolama > Blob mağazanızın projeye bağlı olduğundan ve yazma izni (read-write) içerdiğinden emin olun, ardından yeniden deploy edin.";
  }
  return `Depolama hatası: ${msg.slice(0, 160)}`;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "Oturum bulunamadı." }, { status: 401 });
  if (user.role !== "owner" && user.role !== "editor") {
    return Response.json({ ok: false, error: "Yetkiniz yok." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: "Geçersiz form verisi." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ ok: false, error: "Dosya bulunamadı." }, { status: 400 });
  if (files.length > 12) return Response.json({ ok: false, error: "Bir seferde en fazla 12 dosya yükleyin." }, { status: 400 });

  const db = await getDb();
  const storage = getStorage();
  const results: UploadResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      if (file.size <= 0) throw new Error(`${file.name}: boş dosya.`);
      if (file.size > MAX_BYTES) throw new Error(`${file.name}: 10 MB sınırını aşıyor.`);

      const buf = Buffer.from(await file.arrayBuffer());
      const sniffed = detectMime(buf);
      if (!sniffed || !ALLOWED.has(sniffed)) throw new Error(`${file.name}: desteklenmeyen biçim (jpeg/png/webp/avif).`);
      if (file.type && file.type !== sniffed && !ALLOWED.has(file.type)) {
        throw new Error(`${file.name}: desteklenmeyen içerik türü.`);
      }

      // sharp doğrulaması + boyutlar (sahte uzantılı dosyaları eler)
      const meta = await sharp(buf).metadata();
      if (!meta.width || !meta.height) throw new Error(`${file.name}: görsel boyutları okunamadı.`);

      const checksum = createHash("sha256").update(buf).digest("hex");
      const dupRows = await db
        .select({ id: mediaAssets.id, publicUrl: mediaAssets.publicUrl })
        .from(mediaAssets)
        .where(and(eq(mediaAssets.checksumSha256, checksum), isNull(mediaAssets.deletedAt)))
        .limit(1);
      if (dupRows[0]) {
        results.push({ id: dupRows[0].id, publicUrl: dupRows[0].publicUrl, duplicate: true });
        continue;
      }

      const clean = sanitizeName(file.name);
      const ext = EXT_BY_MIME[sniffed]!;
      const stem = clean.replace(/\.[a-z0-9]+$/i, "");
      const storedFilename = `${stem}.${ext}`;
      const storageKey = `media/${randomUUID()}-${storedFilename}`;

      const uploaded = await storage.upload(storageKey, buf, sniffed).catch((e: unknown) => {
        throw new Error(storageErrorMessage(e));
      });
      const assetId = randomUUID();

      await db.insert(mediaAssets).values({
        id: assetId,
        storageProvider: storage.name,
        storageKey: uploaded.key,
        publicUrl: uploaded.publicUrl,
        originalFilename: file.name.slice(0, 200) || storedFilename,
        storedFilename,
        mimeType: sniffed,
        sizeBytes: buf.length,
        width: meta.width,
        height: meta.height,
        checksumSha256: checksum,
        uploadedBy: user.id,
      });

      results.push({ id: assetId, publicUrl: uploaded.publicUrl, duplicate: false });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Bilinmeyen yükleme hatası.");
    }
  }

  if (!results.length) {
    return Response.json({ ok: false, error: errors[0] ?? "Yükleme başarısız." }, { status: 400 });
  }
  return Response.json({ ok: true, results, errors: errors.length ? errors : undefined });
}
