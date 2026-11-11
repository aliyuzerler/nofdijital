import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { account as accountTable, user as userTable } from "@/server/db/schema";
import { getAuth } from "@/server/auth/cached";

/**
 * Admin guard katmanı. Her admin server sayfasının başında ve her server
 * action içinde çağrılmalıdır; client-side gizleme asla yetki değildir.
 */

export type AdminRole = "owner" | "editor";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export class AdminForbiddenError extends Error {
  constructor() {
    super("Bu işlem için yetkiniz yok.");
  }
}

/** Oturum açmış admin kullanıcısını döner; yoksa null. Render başına 1 kez çalışır. */
export const getSessionUser = cache(async (): Promise<AdminUser | null> => {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    const db = await getDb();
    const rows = await db
      .select({ role: userTable.role, isActive: userTable.isActive })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);
    const row = rows[0];
    if (!row || !row.isActive) return null;
    return { id: session.user.id, name: session.user.name, email: session.user.email, role: row.role };
  } catch (e) {
    console.error("[guards] oturum okunamadı:", e instanceof Error ? e.message : e);
    return null;
  }
});

/** Admin sayfası girişi: oturum yoksa /admin/login'e yönlendirir. */
export async function requireUser(): Promise<AdminUser> {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  return u;
}

/**
 * Kurulum kilidi: sistemde şifreli (credential) admin hesabı var mı?
 * Yoksa /admin/login ilk kurulum (owner oluşturma) modunda açılır; /api/admin/bootstrap
 * ile aynı kuralı paylaşır. Hata durumunda güvenli taraf seçilir: kurulum tamamlanmış sayılır.
 */
export const hasAnyCredentialAdmin = cache(async (): Promise<boolean> => {
  try {
    const db = await getDb();
    const rows = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(accountTable)
      .where(eq(accountTable.providerId, "credential"));
    return (rows[0]?.n ?? 0) > 0;
  } catch (e) {
    console.error("[guards] kurulum kilidi okunamadı:", e instanceof Error ? e.message : e);
    return true;
  }
});

/** Server action girişi: rol uymazsa AdminForbiddenError fırlatır. */
export async function requireRole(roles: AdminRole[]): Promise<AdminUser> {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  if (!roles.includes(u.role)) throw new AdminForbiddenError();
  return u;
}
