import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  mediaAssets,
  navigationItems,
  pageSections,
  pages,
  portfolioImages,
  processSteps,
  services,
  siteSettings,
} from "@/server/db/schema";
import { GALLERY, PROCESS, SERVICES } from "@/content/reference-data";

/**
 * Admin ↔ site içerik hizalama (idempotent bootstrap seed).
 *
 * Üretim DB'si (Neon) migrate edilmiş ama seed edilmemiş olduğunda admin
 * listeleri boş görünürken site referans (fixture) içerikle yayında kalır.
 * Bu modül, sitede yayında olan içeriği boş tablolara birebir yazar; böylece
 * admin paneli sitedeki gerçek içerik gösterir ve düzenlemeler kalıcı olur.
 *
 * Kurallar:
 * - Idempotent: her blok yalnızca kendi tablosu boşsa yazar (onConflictDoNothing).
 * - Medya: repo'daki statik /uploads/gallery/*.webp dosyalarını işaret eder
 *   (Vercel'de statik servis edilir; storage sağlayıcısından bağımsız çalışır).
 * - Blog kaldırıldı (14.11.2026); press_items kayıtları seed EDİLMEZ
 *   (basın haberleri tamamen admin girdisidir).
 * - Hata halinde sessiz geçilir; admin sayfası yine de açılır (ensureStatsSection
 *   deseniyle aynı davranış).
 */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("ı", "i").replaceAll("İ", "i").replaceAll("ş", "s").replaceAll("Ş", "s")
    .replaceAll("ğ", "g").replaceAll("Ğ", "g").replaceAll("ü", "u").replaceAll("Ü", "u")
    .replaceAll("ö", "o").replaceAll("Ö", "o").replaceAll("ç", "c").replaceAll("Ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Repo'daki statik galeri dosyasının boyutlarını okur (olamazsa null). */
async function readImageMeta(relKey: string): Promise<{ width: number | null; height: number | null; sizeBytes: number }> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const buf = await readFile(resolve(process.cwd(), "public", relKey));
    let width: number | null = null;
    let height: number | null = null;
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(buf).metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
    } catch {
      /* sharp yoksa boyutsuz kaydet */
    }
    return { width, height, sizeBytes: buf.byteLength };
  } catch {
    return { width: null, height: null, sizeBytes: 0 };
  }
}

async function seedMedia(): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: mediaAssets.id }).from(mediaAssets).limit(1);
  if (existing.length) return;

  for (let i = 0; i < 14; i++) {
    const idx = String(i + 1).padStart(2, "0");
    const key = `gallery/gallery-${idx}.webp`;
    const meta = await readImageMeta(`uploads/${key}`);
    await db
      .insert(mediaAssets)
      .values({
        storageProvider: "local",
        storageKey: key,
        publicUrl: `/uploads/${key}`,
        originalFilename: `gallery-${idx}.webp`,
        storedFilename: `gallery-${idx}.webp`,
        mimeType: "image/webp",
        sizeBytes: meta.sizeBytes,
        width: meta.width,
        height: meta.height,
        altText: GALLERY.captions[i],
        caption: GALLERY.captions[i],
      })
      .onConflictDoNothing();
  }
  // Logo
  const logoMeta = await readImageMeta("uploads/brand/logo.png");
  await db
    .insert(mediaAssets)
    .values({
      storageProvider: "local",
      storageKey: "brand/logo.png",
      publicUrl: "/uploads/brand/logo.png",
      originalFilename: "logo.png",
      storedFilename: "logo.png",
      mimeType: "image/png",
      sizeBytes: logoMeta.sizeBytes,
      width: logoMeta.width,
      height: logoMeta.height,
      altText: "NOF DİJİTAL logosu",
    })
    .onConflictDoNothing();
}

async function seedServices(): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: services.id }).from(services).limit(1);
  if (existing.length) return;
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
}

async function seedProcessSteps(): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: processSteps.id }).from(processSteps).limit(1);
  if (existing.length) return;
  for (let i = 0; i < PROCESS.length; i++) {
    const st = PROCESS[i]!;
    await db
      .insert(processSteps)
      .values({ title: st.title, description: st.description, position: i })
      .onConflictDoNothing();
  }
}

async function seedCategories(): Promise<void> {
  // Blog kategorileri 14.11.2026'da blog ile birlikte kaldırıldı — no-op.
}

async function seedHomePage(): Promise<void> {
  const db = await getDb();
  let home = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
  if (!home) {
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
      .onConflictDoNothing();
    home = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
  }
  if (!home) return;

  const existingSections = await db
    .select({ id: pageSections.id })
    .from(pageSections)
    .where(eq(pageSections.pageId, home.id))
    .limit(1);
  if (existingSections.length) return;

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
        values: [
          { b: "Yaratıcılık", s: "Markanın hikâyesini görsel ve harekete dönüştüren özgün prodüksiyon." },
          { b: "Strateji", s: "Hedef kitleye ve kanala göre kurgulanan içerik ve reklam planı." },
          { b: "Ölçüm", s: "Her kampanyada net metrikler, düzenli raporlama ve optimizasyon." },
        ],
        images: [
          { mediaKey: "gallery/gallery-14.webp", alt: "Takım çekimi", cls: "a1" },
          { mediaKey: "gallery/gallery-13.webp", alt: "Takım bütünlüğü", cls: "a2" },
        ],
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
}

async function seedGallery(): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: portfolioImages.id }).from(portfolioImages).limit(1);
  if (existing.length) return;
  const media = await db
    .select({ id: mediaAssets.id, storageKey: mediaAssets.storageKey })
    .from(mediaAssets);
  const byKey = new Map(media.map((m) => [m.storageKey, m.id]));
  for (let i = 0; i < 14; i++) {
    const idx = String(i + 1).padStart(2, "0");
    const mediaId = byKey.get(`gallery/gallery-${idx}.webp`);
    if (!mediaId) continue;
    await db.insert(portfolioImages).values({
      mediaAssetId: mediaId,
      caption: GALLERY.captions[i],
      altText: GALLERY.captions[i],
      position: i,
      aspectRatio: String(GALLERY.ar[i]),
    });
  }
}

async function seedNavigation(): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: navigationItems.id }).from(navigationItems).limit(1);
  if (existing.length) return;
  // Referanslarımız dahil (header/footer varsayılan menüsüyle aynı liste).
  const NAV = [
    { label: "Ana Sayfa", href: "/" },
    { label: "Hizmetler", href: "/#hizmetler" },
    { label: "Çalışmalarımız", href: "/#calismalar" },
    { label: "Referanslarımız", href: "/#referanslar" },
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
}

async function seedSettings(): Promise<void> {
  const db = await getDb();
  await db
    .insert(siteSettings)
    .values({
      key: "public",
      valueJson: { whatsappNumber: "", phone: "", email: "", address: "", social: { instagram: "", linkedin: "", youtube: "" } },
    })
    .onConflictDoNothing();
}

/**
 * Boş tabloları sitedeki referans içerikle doldurur. Admin sayfaları
 * (Ana Sayfa / Hizmetler / Portfolyo / Medya) açılışında çağrılır.
 * Hızlı guard: hizmetler VE ana sayfa kaydı zaten varsa tek select ile çıkar.
 */
export async function ensureSiteContentSeeded(): Promise<void> {
  try {
    const db = await getDb();
    const [svc, home] = await Promise.all([
      db.select({ id: services.id }).from(services).limit(1),
      db.select({ id: pages.id }).from(pages).where(eq(pages.slug, "home")).limit(1),
    ]);
    if (svc.length && home.length) return;

    await seedMedia();
    await seedServices();
    await seedProcessSteps();
    await seedCategories();
    await seedHomePage();
    await seedGallery();
    await seedNavigation();
    await seedSettings();
  } catch (e) {
    console.error("[bootstrap-seed]", e instanceof Error ? e.message : e);
  }
}
