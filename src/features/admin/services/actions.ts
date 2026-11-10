"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
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
