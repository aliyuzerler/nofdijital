"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { pageSections, pages } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

/**
 * Ana sayfa bölüm metinleri. bodyJson içindeki YALNIZCA bilinen string
 * alanlar + istatistik kalemleri (statsItems) güncellenir; images/scenes/
 * values/panel/info gibi diğer yapısal diziler korunur.
 */

const ctaSchema = z.object({ label: z.string().trim().max(120), href: z.string().trim().max(300) });

const statsItemSchema = z.object({
  value: z.number().int().min(0).max(999_999_999),
  suffix: z.string().trim().max(8).optional(),
  label: z.string().trim().min(1, "İstatistik etiketi boş olamaz.").max(120),
});

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
  statsItems: z.array(statsItemSchema).min(1, "En az bir istatistik kalemi gerekli.").max(6, "En fazla 6 istatistik kalemi eklenebilir.").optional(),
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
  /** İstatistik bölümüne ait sayaçlar; başka bölümlerde null. */
  statsItems: Array<{ value: number; suffix: string; label: string }> | null;
}

function readCta(v: unknown): { label: string; href: string } | null {
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.label === "string" && typeof o.href === "string") return { label: o.label, href: o.href };
  }
  return null;
}

function readStatsItems(v: unknown): Array<{ value: number; suffix: string; label: string }> | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  const items: Array<{ value: number; suffix: string; label: string }> = [];
  for (const it of v) {
    if (typeof it !== "object" || it === null) continue;
    const o = it as Record<string, unknown>;
    const raw = typeof o.value === "number" ? o.value : Number.parseInt(String(o.value ?? ""), 10);
    if (!Number.isFinite(raw) || raw < 0) continue;
    const label = typeof o.label === "string" ? o.label : "";
    if (!label.trim()) continue;
    items.push({ value: Math.round(raw), suffix: typeof o.suffix === "string" ? o.suffix.slice(0, 8) : "", label: label.slice(0, 120) });
  }
  return items.length ? items : null;
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
        statsItems: readStatsItems(body.statsItems),
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
      } else if (key === "statsItems" && value !== undefined) {
        // Sayaçlar: [{ value, suffix, label }] — suffix yoksa boş string'e normalize et.
        body[key] = (value as Array<{ value: number; suffix?: string; label: string }>).map((it) => ({
          value: it.value,
          suffix: it.suffix ?? "",
          label: it.label,
        }));
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

/**
 * İstatistik bölümü DB'de yoksa kanonik varsayılanlarla oluşturur (idempotent).
 * Amaç: seed'i yeniden çalıştırmadan, yalnızca admin panelini açan kullanıcının
 * editörü görebilmesi (deploy sonrası mevcut DB'lerde stats satırı olmayabilir).
 * Yeni satır en sona eklenir; seed çalışırsa pozisyonlar kanonik sıraya normalize edilir.
 */
export async function ensureStatsSection(): Promise<void> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const page = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
    if (!page) return;
    const existing = await db
      .select({ id: pageSections.id })
      .from(pageSections)
      .where(and(eq(pageSections.pageId, page.id), eq(pageSections.sectionKey, "stats")))
      .limit(1);
    if (existing.length) return;

    const maxRow = await db
      .select({ p: sql<number>`coalesce(max(${pageSections.position}), -1)` })
      .from(pageSections)
      .where(eq(pageSections.pageId, page.id));
    const position = Number(maxRow[0]?.p ?? -1) + 1;

    await db
      .insert(pageSections)
      .values({
        pageId: page.id,
        sectionKey: "stats",
        sectionType: "stats",
        eyebrow: null,
        title: "Biz olmadan sizi fark edemezler!",
        bodyJson: {
          lead: "Fark edilmek, fark yaratmak ile başlar. Markanızı öne çıkaran yaratıcı çözümlerle sizinle birlikteyiz.",
          accent: "fark edemezler!",
          statsItems: [
            { value: 25, suffix: "", label: "Farklı Sektör" },
            { value: 85, suffix: "+", label: "İş Birliği Yaptığımız Markalar" },
            { value: 2325, suffix: "", label: "Bitmiş Proje" },
          ],
        },
        position,
      })
      .onConflictDoNothing();
  } catch (e) {
    // Sessiz geç: admin sayfası yine de açılır; site varsayılan içerikle bandı basar.
    console.error("[ensureStatsSection]", e instanceof Error ? e.message : e);
  }
}
