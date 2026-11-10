import "server-only";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePgJs } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

/**
 * DB sürücü adapter'ı (ADR 0001-2):
 * - pglite  : sandbox/geliştirme — dosya tabanlı gerçek PostgreSQL (db/pgdata)
 * - postgres: Neon / herhangi bir PostgreSQL sunucusu (DATABASE_URL)
 * İkisi de standart Drizzle PostgreSQL API'si sunar; uygulama kodu sürücüyü bilmez.
 */
export type Database = PgliteDatabase<typeof schema> | ReturnType<typeof drizzlePgJs<typeof schema>>;

const globalForDb = globalThis as unknown as {
  nofDb: Database | undefined;
  nofPglite: PGlite | undefined;
};

async function createDb(): Promise<Database> {
  const driver = process.env.DATABASE_DRIVER ?? "pglite";
  if (driver === "postgres") {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL gerekli (DATABASE_DRIVER=postgres)");
    const client = postgres(url, { prepare: false });
    return drizzlePgJs(client, { schema });
  }
  // pglite
  const { isAbsolute, resolve } = await import("node:path");
  const rawDir = process.env.PGLITE_DATA_DIR ?? "db/pgdata";
  // Next standalone sunucusu process.chdir() ile .next/standalone içine geçer;
  // göreli veri dizini proje köküne göre çözümlenmelidir (Faz 7 build doğrulaması).
  const cwd = process.cwd();
  const appRoot = cwd.replace(/[\\/]\.next[\\/]standalone$/, "");
  const dataDir = isAbsolute(rawDir) ? rawDir : resolve(appRoot, rawDir);
  const pg = globalForDb.nofPglite ?? new PGlite(dataDir);
  globalForDb.nofPglite = pg;
  return drizzle(pg, { schema });
}

export async function getDb(): Promise<Database> {
  if (!globalForDb.nofDb) {
    globalForDb.nofDb = await createDb();
  }
  return globalForDb.nofDb;
}

export { schema };
