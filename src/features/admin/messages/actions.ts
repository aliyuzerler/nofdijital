"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { contactSubmissions, services } from "@/server/db/schema";
import { logAudit, ok, fail, runAction } from "@/features/admin/shared";

export interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  serviceName: string | null;
  message: string;
  status: "new" | "read" | "archived";
  userAgentSummary: string | null;
  createdAt: string;
}

export async function listMessages(): Promise<MessageRow[]> {
  try {
    await runAction(["owner", "editor"], async () => ok());
    const db = await getDb();
    const rows = await db
      .select({
        id: contactSubmissions.id,
        name: contactSubmissions.name,
        email: contactSubmissions.email,
        phone: contactSubmissions.phone,
        serviceName: services.title,
        message: contactSubmissions.message,
        status: contactSubmissions.status,
        userAgentSummary: contactSubmissions.userAgentSummary,
        createdAt: contactSubmissions.createdAt,
      })
      .from(contactSubmissions)
      .leftJoin(services, eq(contactSubmissions.serviceId, services.id))
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(200);
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  } catch {
    return [];
  }
}

const idSchema = z.object({ id: z.string().uuid() });

export async function markMessageRead(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = idSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: contactSubmissions.id }).from(contactSubmissions).where(eq(contactSubmissions.id, input.id)).limit(1);
    if (!rows[0]) return fail("Mesaj bulunamadı.");
    await db.update(contactSubmissions).set({ status: "read" }).where(eq(contactSubmissions.id, input.id));
    await logAudit({ actor: user, action: "message.read", entityType: "contact_submission", entityId: input.id });
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
    return ok();
  });
}

export async function markMessageArchived(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = idSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select({ id: contactSubmissions.id }).from(contactSubmissions).where(eq(contactSubmissions.id, input.id)).limit(1);
    if (!rows[0]) return fail("Mesaj bulunamadı.");
    await db.update(contactSubmissions).set({ status: "archived" }).where(eq(contactSubmissions.id, input.id));
    await logAudit({ actor: user, action: "message.archive", entityType: "contact_submission", entityId: input.id });
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
    return ok();
  });
}
