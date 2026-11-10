"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
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
