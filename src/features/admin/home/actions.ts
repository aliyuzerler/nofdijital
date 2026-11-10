"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { pageSections, pages } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

/**
 * Ana sayfa bölüm metinleri. bodyJson içindeki YALNIZCA bilinen string
 * alanlar güncellenir; images/scenes/values/panel/info gibi yapısal
 * diziler korunur (bunların yönetimi faz kapsamı dışı).
 */

const ctaSchema = z.object({ label: z.string().trim().max(120), href: z.string().trim().max(300) });

const saveSchema = z.object({
  sectionId: z.string().uuid(),
  eyebrow: z.string().trim().max(160),
  title: z.string().trim().max(300),
  isVisible: z.boolean(),
  lead: z.string().trim().max(600).optional(),
  chip: z.string().trim().max(120).optional(),
  accent: z.string().trim().max(120).optional(),
  ctaPrimary: ctaSchema.optional(),
  ctaSecondary: ctaSchema.optional(),
  cta: ctaSchema.optional(),
});

export interface HomeSectionRow {
  id: string;
  sectionKey: string;
  sectionType: string;
  eyebrow: string | null;
  title: string | null;
  isVisible: boolean;
  position: number;
  lead: string | null;
  chip: string | null;
  accent: string | null;
  ctaPrimary: { label: string; href: string } | null;
  ctaSecondary: { label: string; href: string } | null;
  cta: { label: string; href: string } | null;
}

function readCta(v: unknown): { label: string; href: string } | null {
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.label === "string" && typeof o.href === "string") return { label: o.label, href: o.href };
  }
  return null;
}

export async function getHomeSectionsAdmin(): Promise<{ pageId: string; pageSeo: { seoTitle: string | null; seoDescription: string | null }; sections: HomeSectionRow[] } | null> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const page = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
    if (!page) return null;
    const rows = await db.select().from(pageSections).where(eq(pageSections.pageId, page.id)).orderBy(asc(pageSections.position));
    const sections: HomeSectionRow[] = rows.map((r) => {
      const body = (r.bodyJson ?? {}) as Record<string, unknown>;
      return {
        id: r.id,
        sectionKey: r.sectionKey,
        sectionType: r.sectionType,
        eyebrow: r.eyebrow,
        title: r.title,
        isVisible: r.isVisible,
        position: r.position,
        lead: typeof body.lead === "string" ? body.lead : null,
        chip: typeof body.chip === "string" ? body.chip : null,
        accent: typeof body.accent === "string" ? body.accent : null,
        ctaPrimary: readCta(body.ctaPrimary),
        ctaSecondary: readCta(body.ctaSecondary),
        cta: readCta(body.cta),
      };
    });
    return { pageId: page.id, pageSeo: { seoTitle: page.seoTitle, seoDescription: page.seoDescription }, sections };
  } catch {
    return null;
  }
}

export async function saveHomeSection(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = saveSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select().from(pageSections).where(eq(pageSections.id, input.sectionId)).limit(1);
    const row = rows[0];
    if (!row) return fail("Bölüm bulunamadı.");

    const body: Record<string, unknown> = { ...((row.bodyJson ?? {}) as Record<string, unknown>) };

    for (const [key, value] of Object.entries(input)) {
      if (key === "lead" || key === "chip" || key === "accent") {
        if (value !== undefined) body[key] = value;
      } else if ((key === "ctaPrimary" || key === "ctaSecondary" || key === "cta") && value !== undefined) {
        body[key] = value;
      }
    }

    await db
      .update(pageSections)
      .set({
        eyebrow: input.eyebrow || null,
        title: input.title || null,
        isVisible: input.isVisible,
        bodyJson: body,
        updatedAt: new Date(),
      })
      .where(and(eq(pageSections.id, input.sectionId), eq(pageSections.pageId, row.pageId)));

    await logAudit({ actor: user, action: "section.update", entityType: "page_section", entityId: input.sectionId, metadata: { sectionKey: row.sectionKey } });
    revalidatePath("/");
    return ok();
  });
}
