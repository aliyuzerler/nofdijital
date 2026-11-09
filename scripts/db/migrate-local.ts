import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { resolve } from "node:path";

/** PGlite üzerinde migration uygular (sandbox/local). */
const dataDir = resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? "db/pgdata");
const pg = new PGlite(dataDir);
const db = drizzle(pg);
await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
await pg.close();
console.log("PGlite migration tamam:", dataDir);
