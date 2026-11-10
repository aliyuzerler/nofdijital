"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { navigationItems } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

const navSchema = z.object({
  label: z.string().trim().min(1, "Etiket gerekli.").max(60),
  href: z.string().trim().min(1, "Hedef gerekli.").max(200).regex(/^\/(?!\/)/, "Hedef / ile başlamalı."),
  position: z.coerce.number().int().min(0).max(99),
  target: z.enum(["_self", "_blank"]),
  isVisible: z.boolean(),
});

export interface NavRow {
  id: string;
  label: string;
  href: string;
  position: number;
  target: string;
  isVisible: boolean;
}

export async function listNavigationAdmin(): Promise<NavRow[]> {
  try {
    await runAction(["owner"], async () => ok());
    const db = await getDb();
    const rows = await db.select().from(navigationItems).orderBy(asc(navigationItems.position));
    return rows.map((r) => ({ id: r.id, label: r.label, href: r.href, position: r.position, target: r.target, isVisible: r.isVisible }));
  } catch {
    return [];
  }
}

export async function createNavItem(raw: unknown) {
  return runAction(["owner"], async (user) => {
    const input = navSchema.parse(raw);
    const db = await getDb();
    const id = randomUUID();
    await db.insert(navigationItems).values({ id, ...input });
    await logAudit({ actor: user, action: "nav.create", entityType: "navigation_item", entityId: id, metadata: { label: input.label } });
    revalidatePath("/");
    return ok();
  });
}

export async function updateNavItem(raw: unknown) {
  return runAction(["owner"], async (user) => {
    const input = navSchema.extend({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.id, input.id)).limit(1);
    if (!rows[0]) return fail("Menü öğesi bulunamadı.");
    await db
      .update(navigationItems)
      .set({ label: input.label, href: input.href, position: input.position, target: input.target, isVisible: input.isVisible, updatedAt: new Date() })
      .where(eq(navigationItems.id, input.id));
    await logAudit({ actor: user, action: "nav.update", entityType: "navigation_item", entityId: input.id });
    revalidatePath("/");
    return ok();
  });
}

export async function deleteNavItem(raw: unknown) {
  return runAction(["owner"], async (user) => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    await db.delete(navigationItems).where(eq(navigationItems.id, input.id));
    await logAudit({ actor: user, action: "nav.delete", entityType: "navigation_item", entityId: input.id });
    revalidatePath("/");
    return ok();
  });
}
