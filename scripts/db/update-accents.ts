import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePgJs } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import { pageSections, pages } from "../../src/server/db/schema";

/**
 * Ana sayfa bölüm vurgularını (bodyJson.accent) kullanıcının onayladığı
 * ifadelere sabitler (13.11.2026 talebi):
 *   - about   → "Yaratıcılığı stratejiyle,"
 *   - process → "net bir yol."
 * Diğer bodyJson alanlarına DOKUNMAZ (read-modify-write). Idempotent.
 *
 * Kullanım:
 *   bun scripts/db/update-accents.ts                                   (yerel PGlite: db/pgdata)
 *   DATABASE_DRIVER=postgres DATABASE_URL=... bun scripts/db/update-accents.ts   (Neon)
 */

const ACCENTS: Record<string, string> = {
  about: "Yaratıcılığı stratejiyle,",
  process: "net bir yol.",
};

const driver = process.env.DATABASE_DRIVER ?? "pglite";

type Db = ReturnType<typeof drizzlePglite> | ReturnType<typeof drizzlePgJs>;
let db: Db;
let close: () => Promise<void>;

if (driver === "postgres") {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL gerekli (DATABASE_DRIVER=postgres)");
  const client = postgres(url, { prepare: false });
  db = drizzlePgJs(client);
  close = async () => client.end();
  console.log("Postgres (Neon) modu");
} else {
  const { resolve } = await import("node:path");
  const dataDir = resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? "db/pgdata");
  const pg = new PGlite(dataDir);
  db = drizzlePglite(pg);
  close = async () => pg.close();
  console.log("PGlite modu:", dataDir);
}

const home = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
if (!home) throw new Error("'home' sayfası bulunamadı — önce seed çalıştırın");

const rows = await db
  .select()
  .from(pageSections)
  .where(inArray(pageSections.sectionKey, Object.keys(ACCENTS)));

for (const r of rows) {
  const want = ACCENTS[r.sectionKey];
  if (!want) continue;
  const body = (r.bodyJson ?? {}) as Record<string, unknown>;
  if (body.accent === want) {
    console.log(`✓ ${r.sectionKey}: accent zaten "${want}"`);
    continue;
  }
  await db
    .update(pageSections)
    .set({ bodyJson: { ...body, accent: want } })
    .where(eq(pageSections.id, r.id));
  console.log(`✎ ${r.sectionKey}: accent "${String(body.accent ?? "(yok)")}" → "${want}"`);
}

if (rows.length < Object.keys(ACCENTS).length) {
  const found = new Set(rows.map((r) => r.sectionKey));
  for (const k of Object.keys(ACCENTS)) {
    if (!found.has(k)) console.log(`! ${k}: bölüm satırı yok (seed'de oluşur, varsayılan devrede)`);
  }
}

await close();
console.log("Bitti.");
