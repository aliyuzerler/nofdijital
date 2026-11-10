"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { processSteps } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

const stepSchema = z.object({
  title: z.string().trim().min(2, "Başlık gerekli.").max(120),
  description: z.string().trim().min(1, "Açıklama gerekli.").max(600),
  position: z.coerce.number().int().min(0).max(99),
  isVisible: z.boolean(),
});

export interface ProcessRow {
  id: string;
  title: string;
  description: string;
  position: number;
  isVisible: boolean;
}

export async function listProcessAdmin(): Promise<ProcessRow[]> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const rows = await db.select().from(processSteps).orderBy(asc(processSteps.position));
    return rows.map((r) => ({ id: r.id, title: r.title, description: r.description, position: r.position, isVisible: r.isVisible }));
  } catch {
    return [];
  }
}

export async function createProcessStep(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = stepSchema.parse(raw);
    const db = await getDb();
    const exists = await db.select({ id: processSteps.id }).from(processSteps).where(eq(processSteps.title, input.title)).limit(1);
    if (exists[0]) return fail("Bu başlıkta bir adım zaten var.");
    const id = randomUUID();
    await db.insert(processSteps).values({ id, ...input });
    await logAudit({ actor: user, action: "process.create", entityType: "process_step", entityId: id });
    revalidatePath("/");
    return ok();
  });
}

export async function updateProcessStep(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = stepSchema.extend({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: processSteps.id }).from(processSteps).where(eq(processSteps.id, input.id)).limit(1);
    if (!rows[0]) return fail("Adım bulunamadı.");
    const clash = await db.select({ id: processSteps.id }).from(processSteps).where(eq(processSteps.title, input.title)).limit(1);
    if (clash[0] && clash[0].id !== input.id) return fail("Bu başlıkta başka bir adım var.");
    await db
      .update(processSteps)
      .set({ title: input.title, description: input.description, position: input.position, isVisible: input.isVisible, updatedAt: new Date() })
      .where(eq(processSteps.id, input.id));
    await logAudit({ actor: user, action: "process.update", entityType: "process_step", entityId: input.id });
    revalidatePath("/");
    return ok();
  });
}

export async function deleteProcessStep(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    await db.delete(processSteps).where(eq(processSteps.id, input.id));
    await logAudit({ actor: user, action: "process.delete", entityType: "process_step", entityId: input.id });
    revalidatePath("/");
    return ok();
  });
}
