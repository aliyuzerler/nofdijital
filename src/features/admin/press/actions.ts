"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { pressItems } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

/**
 * Basında Biz yönetimi (14.11.2026): NOF Digital hakkında çıkan basın
 * haberleri admin tarafından yönetilir. Her kayıt: haber kaynağı URL'si +
 * kart görseli + kısa açıklama + kaynak adı (isteğe bağlı). Blog'un yerini
 * aldı; kayıt silme HARD delete'tür ve denetim kaydına yazılır.
 */

const urlSchema = z
  .string()
  .trim()
  .min(4, "Haber URL'si gerekli.")
  .max(1000)
  .url("Geçerli bir URL girin (https://…).")
  .refine((v) => /^https?:\/\//i.test(v), "URL http(s) ile başlamalı.");

const imageSchema = z
  .string()
  .trim()
  .min(3, "Haber görseli gerekli.")
  .max(1000)
  .refine((v) => v.startsWith("/") || /^https?:\/\//i.test(v), "Görsel yolu / ile başlamalı veya http(s) URL olmalı.");

const updateSchema = z.object({
  id: z.string().uuid(),
  url: urlSchema,
  imageUrl: imageSchema,
  description: z.string().trim().min(3, "Açıklama en az 3 karakter olmalı.").max(600, "Açıklama en fazla 600 karakter."),
  sourceName: z.string().trim().max(80).nullish(),
  isVisible: z.boolean(),
});

const createSchema = updateSchema.omit({ id: true }).extend({
  isVisible: z.boolean().optional(),
});

export interface PressRow {
  id: string;
  url: string;
  imageUrl: string;
  description: string;
  sourceName: string | null;
  isVisible: boolean;
  createdAt: string;
}

export async function listPressAdmin(): Promise<PressRow[]> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const rows = await db.select().from(pressItems).orderBy(desc(pressItems.createdAt));
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      imageUrl: r.imageUrl,
      description: r.description,
      sourceName: r.sourceName,
      isVisible: r.isVisible,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createPressItem(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = createSchema.parse(raw);
    const db = await getDb();
    const id = randomUUID();
    await db
      .insert(pressItems)
      .values({
        id,
        url: input.url,
        imageUrl: input.imageUrl,
        description: input.description,
        sourceName: input.sourceName?.trim() ? input.sourceName.trim() : null,
        isVisible: input.isVisible ?? true,
      });
    await logAudit({ actor: user, action: "press.create", entityType: "press_item", entityId: id, metadata: { url: input.url } });
    revalidatePath("/");
    revalidatePath("/basinda-biz");
    return ok();
  });
}

export async function updatePressItem(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = updateSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: pressItems.id }).from(pressItems).where(eq(pressItems.id, input.id)).limit(1);
    if (!rows[0]) return fail("Haber bulunamadı.");
    await db
      .update(pressItems)
      .set({
        url: input.url,
        imageUrl: input.imageUrl,
        description: input.description,
        sourceName: input.sourceName?.trim() ? input.sourceName.trim() : null,
        isVisible: input.isVisible,
        updatedAt: new Date(),
      })
      .where(eq(pressItems.id, input.id));
    await logAudit({ actor: user, action: "press.update", entityType: "press_item", entityId: input.id, metadata: { url: input.url } });
    revalidatePath("/");
    revalidatePath("/basinda-biz");
    return ok();
  });
}

/** Liste sayfası hızlı anahtarı: göster/gizle. */
export async function setPressItemVisibility(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = z.object({ id: z.string().uuid(), isVisible: z.boolean() }).parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: pressItems.id }).from(pressItems).where(eq(pressItems.id, input.id)).limit(1);
    if (!rows[0]) return fail("Haber bulunamadı.");
    await db
      .update(pressItems)
      .set({ isVisible: input.isVisible, updatedAt: new Date() })
      .where(eq(pressItems.id, input.id));
    await logAudit({
      actor: user,
      action: "press.visibility",
      entityType: "press_item",
      entityId: input.id,
      metadata: { isVisible: input.isVisible },
    });
    revalidatePath("/");
    revalidatePath("/basinda-biz");
    return ok();
  });
}

export async function deletePressItem(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: pressItems.id, url: pressItems.url }).from(pressItems).where(eq(pressItems.id, input.id)).limit(1);
    if (!rows[0]) return fail("Haber bulunamadı.");
    await db.delete(pressItems).where(eq(pressItems.id, input.id));
    await logAudit({ actor: user, action: "press.delete", entityType: "press_item", entityId: input.id, metadata: { url: rows[0].url } });
    revalidatePath("/");
    revalidatePath("/basinda-biz");
    return ok();
  });
}
