"use server";

import { revalidatePath } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { services } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

const ICON_KEYS = ["share", "search", "mega", "cam", "vid", "film", "chart"] as const;
const SPAN_CLASSES = ["c7", "c5", "c4", "c6"] as const;

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2, "Başlık gerekli.").max(120),
  description: z.string().trim().min(1, "Açıklama gerekli.").max(600),
  iconKey: z.enum(ICON_KEYS),
  spanClass: z.enum(SPAN_CLASSES),
  styleVariant: z.enum(["", "dk", "pu"]),
  position: z.coerce.number().int().min(0).max(99),
  isVisible: z.boolean(),
});

const createSchema = updateSchema.omit({ id: true }).extend({
  position: z.coerce.number().int().min(0).max(99).optional(),
  isVisible: z.boolean().optional(),
});

/** Başlıktan URL uyumlu slug üretir (Türkçe karakter dönüşümüyle). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ı", "i").replaceAll("İ", "i").replaceAll("ş", "s").replaceAll("Ş", "s")
    .replaceAll("ğ", "g").replaceAll("Ğ", "g").replaceAll("ü", "u").replaceAll("Ü", "u")
    .replaceAll("ö", "o").replaceAll("Ö", "o").replaceAll("ç", "c").replaceAll("Ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface ServiceRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  iconKey: string;
  spanClass: string;
  styleVariant: string;
  position: number;
  isVisible: boolean;
}

export async function listServicesAdmin(): Promise<ServiceRow[]> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const rows = await db.select().from(services).orderBy(asc(services.position));
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      iconKey: r.iconKey,
      spanClass: r.spanClass,
      styleVariant: r.styleVariant,
      position: r.position,
      isVisible: r.isVisible,
    }));
  } catch {
    return [];
  }
}

export async function createService(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = createSchema.parse(raw);
    const db = await getDb();

    // Benzersiz slug üret (aynı başlıktan ikinci hizmet eklenebilsin).
    const base = slugify(input.title) || "hizmet";
    let slug = base;
    for (let n = 2; n <= 60; n++) {
      const taken = await db.select({ id: services.id }).from(services).where(eq(services.slug, slug)).limit(1);
      if (!taken.length) break;
      slug = `${base}-${n}`;
    }

    let position = input.position;
    if (position === undefined) {
      const maxRow = await db.select({ p: services.position }).from(services).orderBy(desc(services.position)).limit(1);
      position = (maxRow[0]?.p ?? -1) + 1;
    }

    await db
      .insert(services)
      .values({
        title: input.title,
        slug,
        description: input.description,
        iconKey: input.iconKey,
        spanClass: input.spanClass,
        styleVariant: input.styleVariant,
        position,
        isVisible: input.isVisible ?? true,
      })
      .onConflictDoNothing();
    const row = (await db.select({ id: services.id }).from(services).where(eq(services.slug, slug)).limit(1))[0];
    if (!row) return fail("Hizmet oluşturulamadı.");

    await logAudit({ actor: user, action: "service.create", entityType: "service", entityId: row.id, metadata: { slug } });
    revalidatePath("/");
    return ok();
  });
}

export async function deleteService(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    const rows = await db.select({ slug: services.slug }).from(services).where(eq(services.id, input.id)).limit(1);
    if (!rows[0]) return fail("Hizmet bulunamadı.");
    await db.delete(services).where(eq(services.id, input.id));
    await logAudit({ actor: user, action: "service.delete", entityType: "service", entityId: input.id, metadata: { slug: rows[0].slug } });
    revalidatePath("/");
    return ok();
  });
}

export async function updateService(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = updateSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select({ slug: services.slug }).from(services).where(eq(services.id, input.id)).limit(1);
    if (!rows[0]) return fail("Hizmet bulunamadı.");
    await db
      .update(services)
      .set({
        title: input.title,
        description: input.description,
        iconKey: input.iconKey,
        spanClass: input.spanClass,
        styleVariant: input.styleVariant,
        position: input.position,
        isVisible: input.isVisible,
        updatedAt: new Date(),
      })
      .where(eq(services.id, input.id));
    await logAudit({ actor: user, action: "service.update", entityType: "service", entityId: input.id, metadata: { slug: rows[0].slug } });
    revalidatePath("/");
    return ok();
  });
}
