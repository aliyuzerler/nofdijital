import "server-only";
import { cache } from "react";
import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import {
  blogCategories,
  blogPosts,
  pageSections,
  pages,
  portfolioImages,
  mediaAssets,
  processSteps,
  services,
  navigationItems,
  user,
} from "@/server/db/schema";
import { POSTS, PROCESS, SERVICES, GALLERY, type PostItem } from "@/content/reference-data";

/**
 * Public repository katmanı (Faz 3): yalnızca published + yayın zamanı gelmiş içerik.
 * DB hazır değilse görsel parite korunarak fixture fallback kullanılır (R9 riski).
 */

export interface ServiceView {
  icon: string;
  title: string;
  description: string;
  span: string;
  variant: string;
}

export interface GalleryItemView {
  src: string;
  caption: string;
  ar: number;
}

export interface SectionView {
  key: string;
  type: string;
  eyebrow: string | null;
  title: string | null;
  body: Record<string, unknown>;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[repo] DB fallback:", e instanceof Error ? e.message : e);
    return fallback;
  }
}

export async function getServices(): Promise<ServiceView[]> {
  return safe(async () => {
    const db = await getDb();
    const rows = await db.select().from(services).where(eq(services.isVisible, true)).orderBy(services.position);
    if (!rows.length) throw new Error("empty");
    return rows.map((r) => ({
      icon: r.iconKey,
      title: r.title,
      description: r.description,
      span: r.spanClass,
      variant: r.styleVariant,
    }));
  }, SERVICES.map((s) => ({ icon: s.icon, title: s.title, description: s.description, span: s.span, variant: s.variant })));
}

export async function getProcessSteps(): Promise<Array<{ title: string; description: string }>> {
  return safe(async () => {
    const db = await getDb();
    const rows = await db.select().from(processSteps).where(eq(processSteps.isVisible, true)).orderBy(processSteps.position);
    if (!rows.length) throw new Error("empty");
    return rows.map((r) => ({ title: r.title, description: r.description }));
  }, PROCESS.map((p) => ({ ...p })));
}

export const getGalleryItems = cache(async (): Promise<GalleryItemView[]> => {
  return safe(async () => {
    const db = await getDb();
    const rows = await db
      .select({
        url: mediaAssets.publicUrl,
        caption: portfolioImages.caption,
        alt: portfolioImages.altText,
        ar: portfolioImages.aspectRatio,
      })
      .from(portfolioImages)
      .innerJoin(mediaAssets, eq(portfolioImages.mediaAssetId, mediaAssets.id))
      .where(and(eq(portfolioImages.isVisible, true), isNull(mediaAssets.deletedAt)))
      .orderBy(portfolioImages.position);
    if (rows.length < 14) throw new Error("incomplete");
    return rows.map((r, i) => ({
      src: r.url,
      caption: r.caption ?? r.alt ?? GALLERY.captions[i] ?? "",
      ar: parseFloat(r.ar ?? "0.667"),
    }));
  }, GALLERY.files.map((f, i) => ({ src: f, caption: GALLERY.captions[i]!, ar: GALLERY.ar[i]! })));
});

export interface BlogListItem {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  cover: string;
  reading: string;
  publishedAt: Date | null;
  robotsIndex: boolean;
}

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export function formatTrDate(d: Date | null): string {
  if (!d) return "";
  const ist = new Date(d.getTime() + 3 * 3600_000); // Europe/Istanbul gösterimi (UTC saklanır)
  return `${ist.getUTCDate()} ${TR_MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
}

function fixturePosts(): BlogListItem[] {
  return POSTS.map((p) => ({
    slug: p.slug,
    category: p.category,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    cover: GALLERY.files[p.cover] ?? GALLERY.files[0]!,
    reading: p.reading,
    publishedAt: null,
    robotsIndex: true,
  }));
}

export async function getPublishedPosts(limit?: number): Promise<BlogListItem[]> {
  return safe(async () => {
    const db = await getDb();
    const rows = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        publishedAt: blogPosts.publishedAt,
        readingMinutes: blogPosts.readingMinutes,
        robotsIndex: blogPosts.robotsIndex,
        category: blogCategories.name,
        coverUrl: mediaAssets.publicUrl,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(mediaAssets, eq(blogPosts.coverMediaId, mediaAssets.id))
      .where(
        and(
          eq(blogPosts.status, "published"),
          or(isNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, sql`now()`)),
          isNull(blogPosts.deletedAt),
        ),
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit ?? 100);
    if (!rows.length) throw new Error("empty");
    return rows.map((r) => ({
      slug: r.slug,
      category: r.category ?? "",
      title: r.title,
      excerpt: r.excerpt,
      date: formatTrDate(r.publishedAt),
      cover: r.coverUrl ?? GALLERY.files[0]!,
      reading: `${r.readingMinutes} dk`,
      publishedAt: r.publishedAt,
      robotsIndex: r.robotsIndex,
    }));
  }, fixturePosts());
}

/** Arşiv bileşeninin beklediği kayıt biçimi (cover = public URL). */
export function toPostItems(items: BlogListItem[]): Array<Omit<PostItem, "cover"> & { cover: string }> {
  return items.map((i) => ({
    slug: i.slug,
    category: i.category,
    title: i.title,
    excerpt: i.excerpt,
    date: i.date,
    cover: i.cover,
    reading: i.reading,
  }));
}

export interface PostDetail {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  reading: string;
  cover: string;
  alt: string;
  bodyJson: unknown;
  /** SEO / metadata alanları (Faz 6) */
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  publishedAt: Date | null;
  authorName: string | null;
  ogImageUrl: string | null;
}

const ogMedia = alias(mediaAssets, "og_media");

export async function getPublishedPost(slug: string): Promise<PostDetail | null> {
  return safe(async () => {
    const db = await getDb();
    const rows = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        publishedAt: blogPosts.publishedAt,
        readingMinutes: blogPosts.readingMinutes,
        bodyJson: blogPosts.bodyJson,
        seoTitle: blogPosts.seoTitle,
        seoDescription: blogPosts.seoDescription,
        canonicalUrl: blogPosts.canonicalUrl,
        robotsIndex: blogPosts.robotsIndex,
        robotsFollow: blogPosts.robotsFollow,
        category: blogCategories.name,
        authorName: user.name,
        coverUrl: mediaAssets.publicUrl,
        coverAlt: mediaAssets.altText,
        ogUrl: ogMedia.publicUrl,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(mediaAssets, eq(blogPosts.coverMediaId, mediaAssets.id))
      .leftJoin(ogMedia, eq(blogPosts.ogImageId, ogMedia.id))
      .leftJoin(user, eq(blogPosts.authorId, user.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published"), isNull(blogPosts.deletedAt)))
      .limit(1);
    if (!rows.length) return null;
    const r = rows[0]!;
    return {
      slug: r.slug,
      title: r.title,
      category: r.category ?? "",
      excerpt: r.excerpt,
      date: formatTrDate(r.publishedAt),
      reading: `${r.readingMinutes} dk`,
      cover: r.coverUrl ?? GALLERY.files[0]!,
      alt: r.coverAlt ?? r.title,
      bodyJson: r.bodyJson,
      seoTitle: r.seoTitle,
      seoDescription: r.seoDescription,
      canonicalUrl: r.canonicalUrl,
      robotsIndex: r.robotsIndex,
      robotsFollow: r.robotsFollow,
      publishedAt: r.publishedAt,
      authorName: r.authorName ?? null,
      ogImageUrl: r.ogUrl ?? null,
    };
  }, null);
}

/**
 * SELF-HEAL (13.11.2026): prod DB'sinde eski kayıttan kalmış bilinen vurgu
 * değerleri, build ortamından bağımsız olarak site ilk kez istendiğinde
 * düzeltilir (build-time fix-stale-accents script'ine ek güvenlik ağı).
 * Yalnızca BİLİNEN eski değerler regex ile eşleşirse yazılır — admin'in
 * sonradan girdiği diğer değerler ASLA ezilmez. Tüm hatalar sessizce yutulur;
 * render asla etkilenmez. Kalıcı DB düzeltmesinden sonra askiya alınır.
 */
const STALE_ACCENTS: Record<string, { re: RegExp; want: string }> = {
  process: { re: /^\s*yol\s*\.?\s*$/i, want: "net bir yol." },
  about: { re: /^\s*stratejiyle\s*,?\s*$/i, want: "Yaratıcılığı stratejiyle," },
};
const globalForHeal = globalThis as unknown as {
  nofAccentHealed: boolean | undefined;
  nofAccentHealFails: number | undefined;
};

async function healStaleAccents(
  rows: Array<{ id: string; sectionKey: string; bodyJson: unknown }>,
  apply: (key: string, accent: string) => void,
): Promise<void> {
  if (globalForHeal.nofAccentHealed || (globalForHeal.nofAccentHealFails ?? 0) >= 3) return;
  try {
    const db = await getDb();
    for (const r of rows) {
      const rule = STALE_ACCENTS[r.sectionKey];
      if (!rule) continue;
      const body = (r.bodyJson ?? {}) as Record<string, unknown>;
      const cur = typeof body.accent === "string" ? body.accent.trim() : "";
      if (!rule.re.test(cur)) continue;
      await db
        .update(pageSections)
        .set({ bodyJson: { ...body, accent: rule.want } })
        .where(eq(pageSections.id, r.id));
      apply(r.sectionKey, rule.want);
      console.log(`[self-heal] accent ${r.sectionKey}: "${cur}" → "${rule.want}"`);
    }
    globalForHeal.nofAccentHealed = true;
  } catch (e) {
    globalForHeal.nofAccentHealFails = (globalForHeal.nofAccentHealFails ?? 0) + 1;
    console.warn("[self-heal] accent düzeltmesi atlandı:", e instanceof Error ? e.message : e);
  }
}

/**
 * SELF-HEAL (14.11.2026): ana sayfa seoTitle'ındaki eski "NOF DİJİTAL" öneki,
 * marka yazımıyla ("NOF DİGİTAL" — logodaki yazım) kalıcı olarak hizalanır.
 * Yalnızca bilinen önekle başlayan değerler değiştirilir; admin'in sonradan
 * girdiği özel başlık ASLA ezilmez. Görüntüleme tarafı layout.tsx normTitle
 * ile zaten garanti altında; bu düzeltme admin panelinin de tutarlı olması için.
 */
const STALE_SEO_TITLE = /^NOF\s*D[İI]J[İI]TAL/i;
const globalForSeoHeal = globalThis as unknown as {
  nofSeoTitleHealed: boolean | undefined;
  nofSeoTitleFails: number | undefined;
};

async function healStaleSeoTitle(page: { id: string; seoTitle: string | null }): Promise<void> {
  if (globalForSeoHeal.nofSeoTitleHealed || (globalForSeoHeal.nofSeoTitleFails ?? 0) >= 3) return;
  const cur = (page.seoTitle ?? "").trim();
  try {
    if (!STALE_SEO_TITLE.test(cur)) {
      globalForSeoHeal.nofSeoTitleHealed = true;
      return;
    }
    const db = await getDb();
    const want = cur.replace(STALE_SEO_TITLE, "NOF DİGİTAL");
    await db.update(pages).set({ seoTitle: want }).where(eq(pages.id, page.id));
    globalForSeoHeal.nofSeoTitleHealed = true;
    console.log(`[self-heal] seoTitle: "${cur}" → "${want}"`);
  } catch (e) {
    globalForSeoHeal.nofSeoTitleFails = (globalForSeoHeal.nofSeoTitleFails ?? 0) + 1;
    console.warn("[self-heal] seoTitle düzeltmesi atlandı:", e instanceof Error ? e.message : e);
  }
}

export async function getHomeSections(): Promise<Record<string, SectionView>> {
  return safe(async () => {
    const db = await getDb();
    const page = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
    if (!page) throw new Error("no page");
    const rows = await db
      .select()
      .from(pageSections)
      .where(and(eq(pageSections.pageId, page.id), eq(pageSections.isVisible, true)))
      .orderBy(pageSections.position);
    const out: Record<string, SectionView> = {};
    const bodies = new Map<string, Record<string, unknown>>();
    for (const r of rows) {
      const body = (r.bodyJson ?? {}) as Record<string, unknown>;
      bodies.set(r.sectionKey, body);
      out[r.sectionKey] = { key: r.sectionKey, type: r.sectionType, eyebrow: r.eyebrow, title: r.title, body };
    }
    if (!out.hero) throw new Error("no hero");
    // Eski vurgu değerlerini düzelt ve BAKİYE yansıt (ilk render'da bile doğru).
    await healStaleAccents(
      rows.map((r) => ({ id: r.id, sectionKey: r.sectionKey, bodyJson: r.bodyJson })),
      (key, accent) => {
        const body = bodies.get(key);
        if (body) body.accent = accent;
      },
    );
    // Eski "NOF DİJİTAL" seo başlığını marka yazımıyla ("NOF DİGİTAL") kalıcı hizala.
    await healStaleSeoTitle(page);
    return out;
  }, {});
}

export async function getNavigation(): Promise<Array<{ label: string; href: string }>> {
  return safe(async () => {
    const db = await getDb();
    const rows = await db.select().from(navigationItems).where(eq(navigationItems.isVisible, true)).orderBy(navigationItems.position);
    if (!rows.length) throw new Error("empty");
    return rows.map((r) => ({ label: r.label, href: r.href }));
  }, []);
}

/**
 * İstatistik bandı bölümü (stats). getHomeSections()'tan bağımsız okunur, çünkü
 * oradaki sorgu yalnızca isVisible=true satırları döndürür; admin "Görünür"
 * anahtarını kapattığında bölümü gizleyebilmek için satırın varlığını + görünürlük
 * bayrağını ayrı bilmemiz gerekir.
 * - null  : satır yok / DB yok → sayfa varsayılan içerikle bandı gösterir
 * - var   : visible bayrağı sayfada karara işlenir
 */
export interface StatsSectionView extends SectionView {
  visible: boolean;
}

export async function getStatsSection(): Promise<StatsSectionView | null> {
  return safe(async () => {
    const db = await getDb();
    const page = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
    if (!page) return null;
    const rows = await db
      .select()
      .from(pageSections)
      .where(and(eq(pageSections.pageId, page.id), eq(pageSections.sectionKey, "stats")))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
      key: r.sectionKey,
      type: r.sectionType,
      eyebrow: r.eyebrow,
      title: r.title,
      body: (r.bodyJson ?? {}) as Record<string, unknown>,
      visible: r.isVisible,
    };
  }, null);
}
