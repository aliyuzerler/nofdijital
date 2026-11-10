/**
 * Faz 3 — Idempotent seed: kaynak HTML içeriğini ilişkisel modele aktarır.
 * Kural (docs/03): tekrarlı çalıştırmada duplicate üretmemeli.
 * - 7 hizmet, 5 süreç adımı, 6 kategori, 7 örnek blog yazısı, 14 galeri görseli + logo.
 * - Blog gövdeleri şablon içeriktir → SEED_PUBLISH_POSTS=1 (parite testi) değilse draft.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { drizzle as drizzlePgJs } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import {
  siteSettings,
  navigationItems,
  mediaAssets,
  pages,
  pageSections,
  services,
  processSteps,
  blogCategories,
  blogPosts,
  portfolioImages,
  user,
} from "../../src/server/db/schema";
import { SERVICES, PROCESS, CATEGORIES, POSTS, POST_BODY_HTML, GALLERY } from "../../src/content/reference-data";

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

const PUBLISH = process.env.SEED_PUBLISH_POSTS === "1";

/* ---- yardımcılar ---- */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("ı", "i").replaceAll("İ", "i").replaceAll("ş", "s").replaceAll("Ş", "s")
    .replaceAll("ğ", "g").replaceAll("Ğ", "g").replaceAll("ü", "u").replaceAll("Ü", "u")
    .replaceAll("ö", "o").replaceAll("Ö", "o").replaceAll("ç", "c").replaceAll("Ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function parseTrDate(s: string): Date {
  // "12 Kasım 2026"
  const [d, m, y] = s.trim().split(/\s+/);
  const mi = TR_MONTHS.indexOf(m);
  return new Date(Date.UTC(+y!, mi, +d!, 9, 0, 0)); // Europe/Istanbul ~09:00 → UTC
}

/** Şablon HTML → Tiptap-benzeri allowlist JSON (Faz 4 editörü aynı şemayı kullanır). */
type TNode =
  | { type: string; attrs?: Record<string, unknown>; content?: TNode[]; text?: string; marks?: Array<{ type: string; attrs?: Record<string, unknown> }> }
  | { type: string; text: string };

function t(text: string, bold = false): TNode {
  return bold
    ? { type: "text", text, marks: [{ type: "bold" }] }
    : { type: "text", text };
}
function p(...content: TNode[]): TNode {
  return { type: "paragraph", content };
}
function h(level: 2 | 3, text: string): TNode {
  return { type: "heading", attrs: { level }, content: [t(text)] };
}
function blockquote(text: string): TNode {
  return { type: "blockquote", content: [p(t(text))] };
}
function list(ordered: boolean, items: string[]): TNode {
  return { type: ordered ? "orderedList" : "bulletList", content: items.map((i) => ({ type: "listItem", content: [p(t(i))] })) };
}
function note(text: string): TNode {
  return { type: "note", content: [t(text)] };
}

/** Kaynak POST_BODY_HTML'in birebir Tiptap karşılığı. */
function templateBody(lead: string): { type: string; content: TNode[] } {
  return {
    type: "doc",
    content: [
      p(t(`${lead} Bu yazıda konuyu pratik bir çerçevede ele alıyoruz.`)),
      h(2, "Neden önemli?"),
      p(t("Dijital kanallarda her karar; hedef kitle, format ve zamanlama ile birlikte düşünüldüğünde anlam kazanır. Planlı ilerleyen markalar, hem üretimde hem raporlamada daha tutarlı sonuçlara ulaşır.")),
      blockquote("Önce neyi başarmak istediğinizi netleştirin; araçlar ve formatlar ondan sonra gelir."),
      h(2, "Uygulama adımları"),
      list(true, ["Hedefi ve ölçüm yöntemini tanımlayın.", "Kitleyi ve kanalı netleştirin.", "Küçük bir pilot ile başlayın.", "Sonuçları düzenli olarak değerlendirin."]),
      h(3, "Sık yapılan hatalar"),
      p(t("Çok fazla şeyi aynı anda değiştirmek, sonuçların nedenini anlamayı zorlaştırır. Tek seferde tek değişken test etmek daha sağlıklı bir yaklaşımdır.")),
      h(3, "Küçük bir kontrol listesi"),
      list(false, ["Hedef net mi?", "Kreatif ve mesaj kanala uygun mu?", "Ölçüm kurulumu hazır mı?"]),
      h(2, "Sonuç"),
      p(t("Güçlü sonuçlar çoğu zaman karmaşık yöntemlerden değil, tutarlı uygulamadan gelir. Ekibimizle bu süreci birlikte planlamak isterseniz iletişime geçebilirsiniz.")),
      note("Bu yazı tasarım prototipi için hazırlanmış örnek içeriktir."),
    ],
  };
}

async function main() {
  console.log("Seed başlıyor… (SEED_PUBLISH_POSTS=" + PUBLISH + ")");

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

  /* 4) Blog kategorileri */
  for (let i = 0; i < CATEGORIES.length; i++) {
    await db
      .insert(blogCategories)
      .values({ name: CATEGORIES[i]!, slug: slugify(CATEGORIES[i]!), position: i })
      .onConflictDoNothing();
  }
  const catRows = await db.select().from(blogCategories);
  const catByName = new Map(catRows.map((c) => [c.name, c]));

  /* 5) Blog yazıları (idempotent; güncelleme yok — ilk hali korunur) */
  for (const p of POSTS) {
    const cat = catByName.get(p.category);
    const cover = mediaByCaption.get(GALLERY.captions[p.cover] ?? "");
    const pub = parseTrDate(p.date);
    await db
      .insert(blogPosts)
      .values({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        bodyJson: templateBody(p.excerpt),
        categoryId: cat?.id ?? null,
        coverMediaId: cover?.id ?? null,
        authorId: ownerId,
        status: PUBLISH ? "published" : "draft",
        publishedAt: PUBLISH ? pub : null,
        readingMinutes: parseInt(p.reading, 10) || 5,
      })
      .onConflictDoNothing();
  }

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
          seoTitle: "NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
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
        panel: { small: "Örnek performans paneli", bars: ["30%", "48%", "40%", "68%", "58%", "84%", "100%"] },
      },
    },
    { key: "process", type: "process", eyebrow: "Çalışma Sürecimiz", title: "Beş adımda, net bir yol.", body: { accent: "net bir yol." } },
    { key: "blog-preview", type: "blog-preview", eyebrow: "Blog", title: "Son yazılar", body: { cta: { label: "Tüm Yazılar", href: "/blog" }, count: 4 } },
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

  /* 8) Navigasyon */
  const NAV = [
    { label: "Ana Sayfa", href: "/" },
    { label: "Hizmetler", href: "/#hizmetler" },
    { label: "Çalışmalarımız", href: "/#calismalar" },
    { label: "Hakkımızda", href: "/#hakkimizda" },
    { label: "Blog", href: "/blog" },
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
    (select count(*) from blog_categories) cats,
    (select count(*) from blog_posts) posts,
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
