/**
 * Uzak PostgreSQL (Neon vb.) üzerinde migration uygular.
 * Kullanım: DATABASE_URL="postgresql://..." bun scripts/db/migrate-remote.ts
 * Not: DDL için Neon'da "direct" (pooled olmayan, -pooler içermeyen) bağlantı önerilir.
 */
import "dotenv/config";
import { resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    'DATABASE_URL gerekli. Örn: DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" bun scripts/db/migrate-remote.ts',
  );
  process.exit(1);
}
if (url.includes("-pooler.")) {
  console.warn("UYARI: pooled (-pooler) bağlantı cümlesi algılandı; migration/DDL için direct bağlantı önerilir.");
}

const client = postgres(url, { prepare: false, max: 1 });
try {
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  console.log("Uzak migration tamam.");
} finally {
  await client.end();
}
