import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { account, user } from "@/server/db/schema";
import { getAuth } from "@/server/auth/cached";

/**
 * İlk kurulum (bootstrap): yalnızca "şifreli admin" hiç yokken çalışır.
 * - Seed, şifresiz bir placeholder owner (owner@nofdigital.local) oluşturabilir;
 *   bu sayılır mı? Hayır — kural: credential (şifre) hesabı yoksa kurulum açık.
 * - Rate limit: IP başına 3 istek/saat (in-memory).
 * - Parola better-auth signUpEmail ile hash'lenir; rol drizzle ile owner yapılır.
 */

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Geçerli bir e-posta girin.")),
  password: z.string().min(10, "Şifre en az 10 karakter olmalı.").max(128),
  name: z.string().trim().min(1, "İsim gerekli.").max(80),
});

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const globalForRate = globalThis as unknown as { nofBootstrapHits: Map<string, number[]> | undefined };
const hits = (globalForRate.nofBootstrapHits ??= new Map<string, number[]>());

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0]!.trim() : null) ?? "local";
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (rateLimited(ip)) {
      return json({ ok: false, error: "Çok fazla deneme. Bir saat sonra tekrar deneyin." }, 429);
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json({ ok: false, error: "Geçersiz istek gövdesi." }, 400);
    }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, 400);
    }
    const { email, password, name } = parsed.data;

    const db = await getDb();

    // Kurulum kilidi: şifreli (credential) hesap varsa kurulum tamamlanmış demektir.
    const credRows = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(account)
      .where(eq(account.providerId, "credential"));
    if ((credRows[0]?.n ?? 0) > 0) {
      return json({ ok: false, error: "Kurulum daha önce tamamlanmış." }, 409);
    }

    // Seed placeholder'ı (şifresiz, aynı e-posta) varsa temizle — authorId FK set null olur.
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
    if (existing[0]) {
      await db.delete(user).where(eq(user.id, existing[0].id));
    }

    const auth = await getAuth();
    const res = await auth.api.signUpEmail({ body: { email, password, name } });
    const createdId = res?.user?.id;
    if (!createdId) {
      return json({ ok: false, error: "Kullanıcı oluşturulamadı." }, 500);
    }

    await db.update(user).set({ role: "owner", emailVerified: true }).where(eq(user.id, createdId));

    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("USER_ALREADY_EXISTS")) {
      return json({ ok: false, error: "Bu e-posta zaten kayıtlı." }, 409);
    }
    console.error("[bootstrap] hata:", e instanceof Error ? e.message : e);
    return json({ ok: false, error: "Kurulum tamamlanamadı." }, 500);
  }
}
