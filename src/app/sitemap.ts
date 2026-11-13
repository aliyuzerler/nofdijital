import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { pages } from "@/server/db/schema";
import { getBaseUrl } from "@/lib/base-url";

/** Dinamik sitemap: statik rotalar + published sayfalar. Blog kaldırıldı (14.11.2026) → /basinda-biz. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/basinda-biz`, changeFrequency: "weekly", priority: 0.8 },
  ];

  try {
    const db = await getDb();
    const pageRows = await db
      .select({ slug: pages.slug, updatedAt: pages.updatedAt })
      .from(pages)
      .where(eq(pages.status, "published"));
    for (const pg of pageRows) {
      if (pg.slug === "home") continue;
      entries.push({ url: `${base}/${pg.slug}`, lastModified: pg.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
  } catch {
    // DB hazır değilse yalnız statik girdilerle döner.
  }

  return entries;
}
