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
    for (const r of rows) {
      out[r.sectionKey] = { key: r.sectionKey, type: r.sectionType, eyebrow: r.eyebrow, title: r.title, body: (r.bodyJson ?? {}) as Record<string, unknown> };
    }
    if (!out.hero) throw new Error("no hero");
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
