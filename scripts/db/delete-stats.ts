/** Test yardımcı: stats bölümünü siler (eski deploy DB'sini simüle eder).
 *  PGlite tek-yazıcı kısıtı: sunucu KAPALIYKEN çalıştır. */
import { PGlite } from "@electric-sql/pglite";
import { resolve } from "node:path";

const dataDir = resolve(process.env.PGLITE_DATA_DIR ?? "db/pgdata");
const pg = new PGlite(dataDir);
const res = await pg.query(`delete from page_sections where section_key = 'stats' returning section_key`);
console.log("silinen satır:", res.rows.length);
await pg.close();
