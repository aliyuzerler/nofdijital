"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { pages, siteSettings } from "@/server/db/schema";
import { getPublicSettings } from "@/server/services/settings";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

/**
 * Site ayarları (yalnız owner): genel iletişim/social bilgileri
 * site_settings.key="public" altında; SEO alanları pages tablosunda.
 */

const generalSchema = z.object({
  whatsappNumber: z.string().trim().max(24).regex(/^[0-9+]*$/, "Yalnızca rakam ve + kullanın."),
  phone: z.string().trim().max(24).regex(/^[0-9+()\s-]*$/, "Geçerli bir telefon girin."),
  email: z.string().trim().max(120).refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Geçerli bir e-posta girin."),
  address: z.string().trim().max(300),
  social: z.object({
    instagram: z.string().trim().max(200),
    linkedin: z.string().trim().max(200),
    youtube: z.string().trim().max(200),
  }),
  /** Site logosu; boşsa statik marka logosu (/assets/logo.png) kullanılır. */
  logoUrl: z.string().trim().max(500),
});

export type GeneralSettings = z.infer<typeof generalSchema>;

export async function getGeneralSettings(): Promise<GeneralSettings | null> {
  try {
    await runAction(["owner"], async () => ok());
    const s = await getPublicSettings();
    return {
      whatsappNumber: s.whatsappNumber,
      phone: s.phone,
      email: s.email,
      address: s.address,
      social: s.social,
      logoUrl: s.logoUrl,
    };
  } catch {
    return null;
  }
}

export async function saveGeneralSettings(raw: unknown) {
  return runAction(["owner"], async (user) => {
    const input = generalSchema.parse(raw);
    const db = await getDb();
    const valueJson = {
      whatsappNumber: input.whatsappNumber,
      phone: input.phone,
      email: input.email,
      address: input.address,
      social: input.social,
      logoUrl: input.logoUrl,
    };
    await db
      .insert(siteSettings)
      .values({ key: "public", valueJson, updatedBy: user.id })
      .onConflictDoUpdate({ target: siteSettings.key, set: { valueJson, updatedBy: user.id, updatedAt: new Date() } });
    await logAudit({ actor: user, action: "settings.update", entityType: "site_settings", entityId: "public" });
    revalidatePath("/");
    return ok();
  });
}

const seoSchema = z.object({
  pageId: z.string().uuid(),
  seoTitle: z.string().trim().max(200),
  seoDescription: z.string().trim().max(320),
  canonicalUrl: z.string().trim().max(500),
});

export interface PageSeoRow {
  id: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
}

export async function listPageSeo(): Promise<PageSeoRow[]> {
  try {
    await runAction(["owner"], async () => ok());
    const db = await getDb();
    const rows = await db
      .select({
        id: pages.id,
        slug: pages.slug,
        title: pages.title,
        seoTitle: pages.seoTitle,
        seoDescription: pages.seoDescription,
        canonicalUrl: pages.canonicalUrl,
      })
      .from(pages)
      .orderBy(pages.slug);
    return rows;
  } catch {
    return [];
  }
}

export async function savePageSeo(raw: unknown) {
  return runAction(["owner"], async (user) => {
    const input = seoSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.id, input.pageId)).limit(1);
    if (!rows[0]) return fail("Sayfa bulunamadı.");
    await db
      .update(pages)
      .set({
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        canonicalUrl: input.canonicalUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, input.pageId));
    await logAudit({ actor: user, action: "page.seo", entityType: "page", entityId: input.pageId, metadata: { slug: rows[0].slug } });
    revalidatePath("/");
    return ok();
  });
}
