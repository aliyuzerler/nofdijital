/**
 * Remote DB'ye migration baseline'ı yazar.
 *
 * Durum: Neon tabloları `drizzle-kit push` ile oluşturulmuş (push migration
 * kaydı tutmaz). Drizzle migrate() kayıt bulamayınca 0000'den itibaren tüm
 * migration'ları uygulamaya çalışır ve "already exists" hatası verir.
 * Bu script 0000 ve 0001'i "uygulanmış" olarak kaydeder; sonraki migrate
 * çağrısı yalnızca 0002+ 'ı uygular.
 *
 * Kullanım: DATABASE_URL="postgresql://..." bun scripts/db/baseline-remote.ts
 */
import "dotenv/config";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL gerekli");
  process.exit(1);
}

const JOURNAL = JSON.parse(
  readFileSync(resolve(process.cwd(), "drizzle/meta/_journal.json"), "utf8"),
) as { entries: { tag: string; when: number }[] };

// Baseline'a yazılacak migration'lar (0000, 0001 — push ile zaten uygulanmış olanlar)
const BASELINE_TAGS = new Set(["0000_heavy_johnny_storm", "0001_left_silver_sable"]);

const client = postgres(url, { prepare: false, max: 1 });
try {
  await client`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )`;

  const existing = await client`SELECT created_at FROM drizzle.__drizzle_migrations`;
  const existingAt = new Set(existing.map((r) => String(r.created_at)));

  for (const entry of JOURNAL.entries) {
    if (!BASELINE_TAGS.has(entry.tag)) continue;
    if (existingAt.has(String(entry.when))) {
      console.log(`ZATEN KAYITLI: ${entry.tag}`);
      continue;
    }
    const sqlText = readFileSync(resolve(process.cwd(), `drizzle/${entry.tag}.sql`), "utf8");
    const hash = crypto.createHash("sha256").update(sqlText).digest("hex");
    await client`
      INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
      VALUES (${hash}, ${entry.when})`;
    console.log(`BASELINE YAZILDI: ${entry.tag} (created_at=${entry.when})`);
  }

  const rows = await client`
    SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at ASC`;
  console.log(`Toplam kayıt: ${rows.length}`);
} finally {
  await client.end();
}
