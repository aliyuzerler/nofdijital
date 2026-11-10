import "server-only";
import { z } from "zod";
import { getDb } from "@/server/db";
import { auditLogs, contentRevisions } from "@/server/db/schema";
import { AdminForbiddenError, requireRole, type AdminUser, type AdminRole } from "@/server/auth/guards";

/**
 * Admin server action ortak yardımcıları: sonuç tipleri, hata sarmalama,
 * audit log ve içerik revizyonu snapshot.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export function ok(): ActionResult {
  return { ok: true };
}

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

/** Zod v4: ilk issue mesajını güvenli şekilde döner. */
export function firstZodMessage(e: z.ZodError): string {
  return e.issues[0]?.message ?? "Geçersiz veri.";
}

/** Action gövdesini guard + hata sarmalama ile çalıştırır; fn'nin dönüş tipini korur. */
export async function runAction<R extends { ok: boolean }>(
  roles: AdminRole[],
  fn: (user: AdminUser) => Promise<R>,
): Promise<R> {
  try {
    const user = await requireRole(roles);
    return await fn(user);
  } catch (e) {
    // redirect() çağrıları sarmalanmamalı — Next.js akışına bırak.
    const digest = e && typeof e === "object" && "digest" in e ? String((e as { digest: unknown }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw e;
    if (e instanceof AdminForbiddenError) return fail(e.message) as R;
    if (e instanceof z.ZodError) return fail(firstZodMessage(e)) as R;
    console.error("[admin-action] hata:", e instanceof Error ? e.message : e);
    return fail("İşlem başarısız oldu. Lütfen tekrar deneyin.") as R;
  }
}

export interface AuditInput {
  actor: AdminUser;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(auditLogs).values({
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadataJson: input.metadata ?? {},
    });
  } catch (e) {
    console.error("[audit] yazılamadı:", e instanceof Error ? e.message : e);
  }
}

export interface RevisionInput {
  entityType: string;
  entityId: string;
  snapshot: Record<string, unknown>;
  revisionNumber: number;
  createdBy: string;
}

export async function saveRevision(input: RevisionInput): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(contentRevisions).values({
      entityType: input.entityType,
      entityId: input.entityId,
      snapshotJson: input.snapshot,
      revisionNumber: input.revisionNumber,
      createdBy: input.createdBy,
    });
  } catch (e) {
    console.error("[revision] yazılamadı:", e instanceof Error ? e.message : e);
  }
}
