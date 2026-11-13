/**
 * Faz 3 — Idempotent seed: kaynak HTML içeriğini ilişkisel modele aktarır.
 * Kural (docs/03): tekrarlı çalıştırmada duplicate üretmemeli.
 * - 7 hizmet, 5 süreç adımı, 14 galeri görseli + logo, basın haberi örnekleri yok
 *   (Basında Biz tamamen admin girdisidir — 14.11.2026'da blog kaldırıldı).
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { drizzle as drizzlePgJs } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import {
  siteSettings,
  navigationItems,
  mediaAssets,
  pages,
  pageSections,
  services,
  processSteps,
  portfolioImages,
  user,
} from "../../src/server/db/schema";
import { SERVICES, PROCESS, GALLERY } from "../../src/content/reference-data";

/**
 * DB sürücüsü: DATABASE_DRIVER=postgres (+DATABASE_URL) ile Neon/Postgres'e, aksi halde lokal PGlite'a bağlanır.
 * İki sürücünün drizzle sorgu arayüzü aynıdır; postgres-js db, pglite tipine cast edilir (script içi pragmatizm).
 */
let db: ReturnType<typeof drizzle>;
let closeDb: () => Promise<void>;
const driver = process.env.DATABASE_DRIVER ?? "pglite";
if (driver === "postgres") {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL gerekli (DATABASE_DRIVER=postgres).");
    process.exit(1);
  }
  const client = postgres(url, { prepare: false, max: 1 });
  db = drizzlePgJs(client, {}) as unknown as ReturnType<typeof drizzle>;
  closeDb = () => client.end();
  console.log("postgres modu (DATABASE_URL), max=1, prepare=false");
} else {
  const dataDir = resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? "db/pgdata");
  const pg = new PGlite(dataDir);
  db = drizzle(pg, {});
  closeDb = () => pg.close();
}

/* ---- yardımcılar ---- */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("ı", "i").replaceAll("İ", "i").replaceAll("ş", "s").replaceAll("Ş", "s")
    .replaceAll("ğ", "g").replaceAll("Ğ", "g").replaceAll("ü", "u").replaceAll("Ü", "u")
    .replaceAll("ö", "o").replaceAll("Ö", "o").replaceAll("ç", "c").replaceAll("Ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function main() {
  console.log("Seed başlıyor…");

  /* 0) Owner bootstrap kullanıcısı (şifresiz placeholder — gerçek şifre bootstrap scriptiyle) */
  const ownerId = "nof-owner-seed";
  await db
    .insert(user)
    .values({ id: ownerId, name: "NOF Owner", email: "owner@nofdigital.local", role: "owner", emailVerified: true })
    .onConflictDoNothing();

  /* 1) Medya: 14 galeri + logo → LocalStorageProvider dosyaları + kayıtlar */
  let mediaCount = 0;
  for (let i = 0; i < 14; i++) {
    const idx = String(i + 1).padStart(2, "0");
    const src = resolve(process.cwd(), `public/assets/gallery/gallery-${idx}.webp`);
    const buf = await readFile(src);
    const key = `gallery/gallery-${idx}.webp`;
    const dest = resolve(process.cwd(), "public/uploads", key);
    await (await import("node:fs/promises")).mkdir(resolve(dest, ".."), { recursive: true });
    await (await import("node:fs/promises")).writeFile(dest, buf);
    const meta = await sharp(buf).metadata();
    const checksum = createHash("sha256").update(buf).digest("hex");
    await db
      .insert(mediaAssets)
      .values({
        storageProvider: "local",
        storageKey: key,
        publicUrl: `/uploads/${key}`,
        originalFilename: `gallery-${idx}.webp`,
        storedFilename: `gallery-${idx}.webp`,
        mimeType: "image/webp",
        sizeBytes: buf.byteLength,
        width: meta.width ?? null,
        height: meta.height ?? null,
        altText: GALLERY.captions[i]!,
        caption: GALLERY.captions[i]!,
        checksumSha256: checksum,
      })
      .onConflictDoNothing();
    mediaCount++;
  }
  // logo
  {
    const buf = await readFile(resolve(process.cwd(), "public/assets/logo.png"));
    const key = "brand/logo.png";
    const dest = resolve(process.cwd(), "public/uploads", key);
    await (await import("node:fs/promises")).mkdir(resolve(dest, ".."), { recursive: true });
    await (await import("node:fs/promises")).writeFile(dest, buf);
    await db
      .insert(mediaAssets)
      .values({
        storageProvider: "local",
        storageKey: key,
        publicUrl: `/uploads/${key}`,
        originalFilename: "logo.png",
        storedFilename: "logo.png",
        mimeType: "image/png",
        sizeBytes: buf.byteLength,
        altText: "NOF DİJİTAL logosu",
        checksumSha256: createHash("sha256").update(buf).digest("hex"),
      })
      .onConflictDoNothing();
  }
  const mediaRows = await db.select().from(mediaAssets);
  const mediaByCaption = new Map(mediaRows.map((m) => [m.caption ?? m.altText ?? "", m]));

  /* 2) Hizmetler */
  for (let i = 0; i < SERVICES.length; i++) {
    const s = SERVICES[i]!;
    await db
      .insert(services)
      .values({
        title: s.title,
        slug: slugify(s.title),
        description: s.description,
        iconKey: s.icon,
        styleVariant: s.variant,
        spanClass: s.span,
        position: i,
      })
      .onConflictDoNothing();
  }

  /* 3) Süreç adımları */
  for (let i = 0; i < PROCESS.length; i++) {
    const st = PROCESS[i]!;
    await db
      .insert(processSteps)
      .values({ title: st.title, description: st.description, position: i })
      .onConflictDoNothing();
  }

  /* 4) Blog kaldırıldı (14.11.2026) — kategori/yazı seed'leri ve blog tabloları
         migration 0002/0003 ile düşürüldü; yerine admin'den yönetilen
         press_items (Basında Biz) geldi. Seed basın haberi EKLEMEZ:
         gerçek haberler tamamen admin girdisidir. */
  void ownerId;

  /* 6) Galeri: portfolio_images (genel galeri — project_id null) */
  let pos = 0;
  for (let i = 0; i < 14; i++) {
    const m = mediaByCaption.get(GALLERY.captions[i] ?? "");
    if (!m) continue;
    const exists = await db.select().from(portfolioImages).where(eq(portfolioImages.mediaAssetId, m.id)).limit(1);
    if (exists.length) continue;
    await db.insert(portfolioImages).values({
      mediaAssetId: m.id,
      caption: GALLERY.captions[i]!,
      altText: GALLERY.captions[i]!,
      position: pos++,
      aspectRatio: String(GALLERY.ar[i]),
    });
  }

  /* 7) Home page + sections */
  let home = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
  if (!home) {
    home = (
      await db
        .insert(pages)
        .values({
          slug: "home",
          title: "Ana Sayfa",
          status: "published",
          seoTitle: "NOF DİGİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
          seoDescription: "Sosyal medya yönetimi, Google & Meta Ads, fotoğraf, video ve prodüksiyon hizmetleri.",
          publishedAt: new Date(),
        })
        .returning()
    )[0]!;
  }
  const sections: Array<{ key: string; type: string; eyebrow?: string; title?: string; body: Record<string, unknown> }> = [
    {
      key: "hero",
      type: "hero",
      eyebrow: "Yaratıcı prodüksiyon × Performans pazarlama",
      title: "Dijitalde fark yaratmak, doğru stratejiyle başlar.",
      body: {
        lead: "Markanız için yaratıcı içerikler, profesyonel prodüksiyon ve ölçülebilir reklam stratejileri geliştiriyoruz.",
        ctaPrimary: { label: "Hizmetlerimizi Keşfedin", href: "/#hizmetler" },
        ctaSecondary: { label: "Bizimle İletişime Geçin", href: "/#iletisim" },
        chip: "Foto · Video · Reklam",
        images: [
          { mediaKey: "gallery/gallery-08.webp", alt: "Stüdyo portre çekimi", cls: "f1" },
          { mediaKey: "gallery/gallery-03.webp", alt: "Maç anı fotoğrafı", cls: "f2" },
          { mediaKey: "gallery/gallery-14.webp", alt: "Takım fotoğrafı", cls: "f3" },
        ],
      },
    },
    { key: "services", type: "services", eyebrow: "Hizmetlerimiz", title: "Fikirden ölçüme, tek çatı altında.", body: {} },
    {
      key: "gallery",
      type: "gallery",
      eyebrow: "Çalışmalarımız",
      title: "Stüdyo duvarı",
      body: { scenes: GALLERY.scenes },
    },
    {
      // İstatistik bandı (Referansların üstü) — admin panelinden yönetilir:
      // başlık/lead/accent + statsItems [{ value, suffix, label }] (sayaçlar).
      key: "stats",
      type: "stats",
      title: "Biz olmadan sizi fark edemezler!",
      body: {
        lead: "Fark edilmek, fark yaratmak ile başlar. Markanızı öne çıkaran yaratıcı çözümlerle sizinle birlikteyiz.",
        accent: "fark edemezler!",
        statsItems: [
          { value: 25, suffix: "", label: "Farklı Sektör" },
          { value: 85, suffix: "+", label: "İş Birliği Yaptığımız Markalar" },
          { value: 2325, suffix: "", label: "Bitmiş Proje" },
        ],
      },
    },
    {
      key: "about",
      type: "about",
      eyebrow: "Hakkımızda",
      title: "Yaratıcılığı stratejiyle, stratejiyi ölçülebilir sonuçlarla birleştiriyoruz.",
      body: {
        lead: "NOF DİJİTAL; çekim setinde de reklam panelinde de aynı titizlikle çalışır. Fikri sahada üretir, yayında test eder, verilerle iyileştirir.",
        accent: "Yaratıcılığı stratejiyle,",
        values: [
          { b: "Yaratıcılık", s: "Markanın hikâyesini görsel ve harekete dönüştüren özgün prodüksiyon." },
          { b: "Strateji", s: "Hedef kitleye ve kanala göre kurgulanan içerik ve reklam planı." },
          { b: "Ölçüm", s: "Her kampanyada net metrikler, düzenli raporlama ve optimizasyon." },
        ],
        images: [
          { mediaKey: "gallery/gallery-14.webp", alt: "Takım çekimi", cls: "a1" },
          { mediaKey: "gallery/gallery-13.webp", alt: "Takım bütünlüğü", cls: "a2" },
        ],
        panel: { small: "Örnek performans paneli", bars: ["30%", "48%", "40%", "68%", "58%", "84%", "100%"] },
      },
    },
    { key: "process", type: "process", eyebrow: "Çalışma Sürecimiz", title: "Beş adımda, net bir yol.", body: { accent: "net bir yol." } },
    { key: "press-preview", type: "press-preview", eyebrow: "Basında Biz", title: "Bizi yazanlar, kaynağından okuyun.", body: { cta: { label: "Tümünü Gör", href: "/basinda-biz" }, count: 4 } },
    {
      key: "contact",
      type: "contact",
      eyebrow: "İletişim",
      title: "Markanız için yeni bir başlangıca hazır mısınız?",
      body: {
        lead: "Hedeflerinizi anlatın; size uygun içerik, prodüksiyon ve reklam planını birlikte şekillendirelim.",
        info: [
          { icon: "ph", text: "Telefon numarası — buraya eklenecek" },
          { icon: "wa", text: "WhatsApp hattı — buraya eklenecek" },
          { icon: "mail", text: "E-posta adresi — buraya eklenecek" },
        ],
      },
    },
  ];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]!;
    await db
      .insert(pageSections)
      .values({
        pageId: home.id,
        sectionKey: s.key,
        sectionType: s.type,
        eyebrow: s.eyebrow,
        title: s.title,
        bodyJson: s.body,
        position: i,
      })
      .onConflictDoNothing();
  }
  // Pozisyon normalizasyonu: sonradan eklenen bölüm (ör. stats) mevcut DB'ye
  // eklendiğinde kanonik sıraya otursun (idempotent — duplicate üretmez).
  for (let i = 0; i < sections.length; i++) {
    await db
      .update(pageSections)
      .set({ position: i })
      .where(and(eq(pageSections.pageId, home.id), eq(pageSections.sectionKey, sections[i]!.key)));
  }

  /* 8) Navigasyon */
  const NAV = [
    { label: "Ana Sayfa", href: "/" },
    { label: "Hizmetler", href: "/#hizmetler" },
    { label: "Çalışmalarımız", href: "/#calismalar" },
    { label: "Hakkımızda", href: "/#hakkimizda" },
    // Blog kaldırıldı → yerine Basında Biz (14.11.2026)
    { label: "Basında Biz", href: "/basinda-biz" },
    { label: "İletişim", href: "/#iletisim" },
  ];
  for (let i = 0; i < NAV.length; i++) {
    await db
      .insert(navigationItems)
      .values({ label: NAV[i]!.label, href: NAV[i]!.href, position: i })
      .onConflictDoNothing();
  }

  /* 9) Site ayarları (public) — gerçek işletme verisi uydurulmaz; boş kalır */
  await db
    .insert(siteSettings)
    .values({
      key: "public",
      valueJson: { whatsappNumber: "", phone: "", email: "", address: "", social: { instagram: "", linkedin: "", youtube: "" } },
    })
    .onConflictDoNothing();

  /* Özet */
  // pglite execute → { rows }, postgres-js execute → satır dizisi; ikisini de normalize et
  const res = await db.execute(sql`select
    (select count(*) from services) services,
    (select count(*) from process_steps) steps,
    (select count(*) from press_items) press,
    (select count(*) from media_assets) media,
    (select count(*) from portfolio_images) gallery,
    (select count(*) from page_sections) sections`);
  const summary = (Array.isArray(res) ? res : res.rows) as Record<string, unknown>[];
  console.log("Seed tamam:", summary[0]);
  await closeDb();
}

main().catch((e) => {
  console.error("Seed HATASI:", e);
  process.exit(1);
});
