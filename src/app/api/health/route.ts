import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      db: process.env.DATABASE_DRIVER ?? "pglite",
      storage: process.env.STORAGE_PROVIDER ?? "local",
      latencyMs: Date.now() - started,
    });
  } catch (e) {
    // Hata detayı (SQL/stack) istemciye sızmaz (docs/05).
    console.error("[health] db check failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
