"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { mediaAssets, pages, portfolioImages } from "@/server/db/schema";
import { getStorage } from "@/server/storage";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

export interface MediaRow {
  id: string;
  publicUrl: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  createdAt: string;
}

function toRow(r: typeof mediaAssets.$inferSelect): MediaRow {
  return {
    id: r.id,
    publicUrl: r.publicUrl,
    originalFilename: r.originalFilename,
    storedFilename: r.storedFilename,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    width: r.width,
    height: r.height,
    altText: r.altText,
    title: r.title,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Editör/media sayfası için liste (silinmemiş, aramalı). */
export async function listMedia(query?: string): Promise<MediaRow[]> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const q = query?.trim();
    const rows = await db
      .select()
      .from(mediaAssets)
      .where(
        q
          ? and(
              isNull(mediaAssets.deletedAt),
              or(ilike(mediaAssets.originalFilename, `%${q}%`), ilike(mediaAssets.altText, `%${q}%`), ilike(mediaAssets.title, `%${q}%`)),
            )
          : isNull(mediaAssets.deletedAt),
      )
      .orderBy(desc(mediaAssets.createdAt))
      .limit(200);
    return rows.map(toRow);
  } catch {
    return [];
  }
}

const updateMetaSchema = z.object({
  id: z.string().uuid(),
  altText: z.string().trim().max(300),
  title: z.string().trim().max(200),
});

export async function updateMediaMeta(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = updateMetaSchema.parse(raw);
    const db = await getDb();
    const rows = await db
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, input.id), isNull(mediaAssets.deletedAt)))
      .limit(1);
    if (!rows[0]) return fail("Medya bulunamadı.");
    await db
      .update(mediaAssets)
      .set({ altText: input.altText || null, title: input.title || null })
      .where(eq(mediaAssets.id, input.id));
    await logAudit({ actor: user, action: "media.update", entityType: "media_asset", entityId: input.id });
    revalidatePath("/admin/media");
    return ok();
  });
}

export async function deleteMedia(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();

    const rows = await db.select().from(mediaAssets).where(and(eq(mediaAssets.id, input.id), isNull(mediaAssets.deletedAt))).limit(1);
    const asset = rows[0];
    if (!asset) return fail("Medya bulunamadı.");

    // Kullanımda mı? (MVP kontrol: sayfa OG / portfolyo — blog 14.11.2026'da kaldırıldı)
    const [pageOg] = await db.select({ id: pages.id }).from(pages).where(eq(pages.ogImageId, input.id)).limit(1);
    if (pageOg) return fail("Bu görsel bir sayfanın OG görseli olarak kullanılıyor.");
    const [gal] = await db.select({ id: portfolioImages.id }).from(portfolioImages).where(eq(portfolioImages.mediaAssetId, input.id)).limit(1);
    if (gal) return fail("Bu görsel portfolyo galerisinde kullanılıyor.");

    await db.update(mediaAssets).set({ deletedAt: new Date() }).where(eq(mediaAssets.id, input.id));
    await getStorage().delete(asset.storageKey);
    await logAudit({ actor: user, action: "media.delete", entityType: "media_asset", entityId: input.id, metadata: { storageKey: asset.storageKey } });
    revalidatePath("/admin/media");
    return ok();
  });
}
