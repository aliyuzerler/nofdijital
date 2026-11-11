"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { mediaAssets, portfolioImages } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

export interface GalleryRow {
  id: string;
  publicUrl: string;
  caption: string | null;
  altText: string;
  position: number;
  isVisible: boolean;
  aspectRatio: string | null;
}

export async function listGalleryAdmin(): Promise<GalleryRow[]> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const rows = await db
      .select({
        id: portfolioImages.id,
        publicUrl: mediaAssets.publicUrl,
        caption: portfolioImages.caption,
        altText: portfolioImages.altText,
        position: portfolioImages.position,
        isVisible: portfolioImages.isVisible,
        aspectRatio: portfolioImages.aspectRatio,
      })
      .from(portfolioImages)
      .innerJoin(mediaAssets, eq(portfolioImages.mediaAssetId, mediaAssets.id))
      .orderBy(asc(portfolioImages.position));
    return rows;
  } catch {
    return [];
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().trim().max(200),
  altText: z.string().trim().min(1, "Alt text gerekli.").max(300),
  position: z.coerce.number().int().min(0).max(999),
  isVisible: z.boolean(),
});

export async function updateGalleryItem(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = updateSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: portfolioImages.id }).from(portfolioImages).where(eq(portfolioImages.id, input.id)).limit(1);
    if (!rows[0]) return fail("Görsel bulunamadı.");
    await db
      .update(portfolioImages)
      .set({ caption: input.caption || null, altText: input.altText, position: input.position, isVisible: input.isVisible, updatedAt: new Date() })
      .where(eq(portfolioImages.id, input.id));
    await logAudit({ actor: user, action: "gallery.update", entityType: "portfolio_image", entityId: input.id });
    revalidatePath("/");
    return ok();
  });
}

/* ---- Galeri yönetimi: ekle / çıkar / değiştir ---- */

/** Galeri seçici için medya kütüphanesi (galeride olmayanlar). */
export interface MediaOption {
  id: string;
  publicUrl: string;
  altText: string | null;
  originalFilename: string;
}

export async function listGalleryMediaOptions(): Promise<MediaOption[]> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const rows = await db
      .select({
        id: mediaAssets.id,
        publicUrl: mediaAssets.publicUrl,
        altText: mediaAssets.altText,
        originalFilename: mediaAssets.originalFilename,
      })
      .from(mediaAssets)
      .leftJoin(portfolioImages, eq(portfolioImages.mediaAssetId, mediaAssets.id))
      .where(and(isNull(mediaAssets.deletedAt), isNull(portfolioImages.id)))
      .orderBy(asc(mediaAssets.createdAt));
    return rows;
  } catch {
    return [];
  }
}

const addSchema = z.object({
  mediaId: z.string().uuid(),
  caption: z.string().trim().max(200).optional(),
  altText: z.string().trim().max(300).optional(),
});

/** Medya kütüphanesinden galeriye yeni görsel ekler (duvarın sonuna). */
export async function addGalleryItem(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = addSchema.parse(raw);
    const db = await getDb();
    const [media] = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, input.mediaId), isNull(mediaAssets.deletedAt)))
      .limit(1);
    if (!media) return fail("Medya bulunamadı.");

    const dup = await db.select({ id: portfolioImages.id }).from(portfolioImages).where(eq(portfolioImages.mediaAssetId, media.id)).limit(1);
    if (dup[0]) return fail("Bu görsel zaten galeride.");

    const all = await db.select({ p: portfolioImages.position }).from(portfolioImages);
    const maxPos = all.reduce((m, r) => Math.max(m, r.p), -1);

    const altText = input.altText?.trim() || media.altText || media.originalFilename;
    const aspect = media.width && media.height ? (media.width / media.height).toFixed(3) : null;
    await db.insert(portfolioImages).values({
      mediaAssetId: media.id,
      caption: input.caption?.trim() || null,
      altText: altText.slice(0, 300),
      position: maxPos + 1,
      aspectRatio: aspect,
    });
    const inserted = await db.select({ id: portfolioImages.id }).from(portfolioImages).where(eq(portfolioImages.mediaAssetId, media.id)).limit(1);
    if (!inserted[0]) return fail("Görsel eklenemedi.");

    await logAudit({ actor: user, action: "gallery.create", entityType: "portfolio_image", entityId: inserted[0].id, metadata: { mediaId: media.id } });
    revalidatePath("/");
    revalidatePath("/admin/portfolio");
    return ok();
  });
}

/** Galeriden çıkarır (medya kütüphanesindeki kayıt korunur). */
export async function removeGalleryItem(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: portfolioImages.id }).from(portfolioImages).where(eq(portfolioImages.id, input.id)).limit(1);
    if (!rows[0]) return fail("Görsel bulunamadı.");
    await db.delete(portfolioImages).where(eq(portfolioImages.id, input.id));
    await logAudit({ actor: user, action: "gallery.delete", entityType: "portfolio_image", entityId: input.id });
    revalidatePath("/");
    revalidatePath("/admin/portfolio");
    return ok();
  });
}

const replaceSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
});

/** Duvardaki bir slotun görselini medya kütüphanesinden başka bir dosyayla değiştirir. */
export async function replaceGalleryMedia(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = replaceSchema.parse(raw);
    const db = await getDb();
    const [media] = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, input.mediaId), isNull(mediaAssets.deletedAt)))
      .limit(1);
    if (!media) return fail("Medya bulunamadı.");

    const rows = await db.select({ id: portfolioImages.id }).from(portfolioImages).where(eq(portfolioImages.id, input.id)).limit(1);
    if (!rows[0]) return fail("Görsel bulunamadı.");

    const aspect = media.width && media.height ? (media.width / media.height).toFixed(3) : null;
    await db
      .update(portfolioImages)
      .set({ mediaAssetId: media.id, altText: media.altText || media.originalFilename, aspectRatio: aspect, updatedAt: new Date() })
      .where(eq(portfolioImages.id, input.id));
    await logAudit({ actor: user, action: "gallery.replace", entityType: "portfolio_image", entityId: input.id, metadata: { mediaId: media.id } });
    revalidatePath("/");
    revalidatePath("/admin/portfolio");
    return ok();
  });
}
