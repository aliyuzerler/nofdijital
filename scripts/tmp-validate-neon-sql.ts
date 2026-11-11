/**
 * Geçici doğrulama: neon-veritabani-kurulum.sql + admin insert SQL'inin
 * temiz bir Postgres'te sorunsuz çalıştığını test eder (PGlite).
 * Kullanım: bun scripts/tmp-validate-neon-sql.ts  → sonra silinebilir.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dir = "/tmp/pgtest-neon";
rmSync(dir, { recursive: true, force: true });

const pg = new PGlite(dir);
const kurulum = readFileSync(resolve("download/neon-veritabani-kurulum.sql"), "utf8");
const stmts = kurulum
  .replace(/^--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log("kurulum komut sayısı:", stmts.length);
for (const s of stmts) await pg.query(s);

// Admin insert (neondb'de çalıştırılacak SQL'in birebir aynısı)
const HASH =
  "2ac0b2814eec244704b8f7ff1d9d3a4f:af73dfe293954ba304c9603de1b619008f59c61cbc82b990b353a6044a5c6e7146543f0fae7ffe8e299629254c34f3b36f8259cea6a896d734d698cb7db5dcec";
await pg.query(`delete from "account" where user_id in (select id from "user" where email = 'admin@nofdigital.com')`);
await pg.query(`delete from "user" where email = 'admin@nofdigital.com'`);
await pg.query(
  `insert into "user" (id, name, email, email_verified, role, is_active, created_at, updated_at)
   values ('kurulum-admin-0001', 'NOF Admin', 'admin@nofdigital.com', true, 'owner'::user_role, true, now(), now())`,
);
await pg.query(
  `insert into "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
   values ('kurulum-admin-acc-0001', 'kurulum-admin-0001', 'kurulum-admin-0001', 'credential', $1, now(), now())`,
  [HASH],
);

// Doğrula: guards.ts hasAnyCredentialAdmin ile aynı sorgu
const cred = await pg.query<{ n: number }>(`select count(*)::int as n from "account" where provider_id = 'credential'`);
const usr = await pg.query<{ email: string; role: string }>(`select email, role::text from "user"`);
console.log("credential hesap sayısı:", cred.rows[0]?.n, "(>0 ise giriş ekranı 'login' moduna döner = site bu DB'yi okuyor demektir)");
console.log("kullanıcılar:", usr.rows);
await pg.close();
console.log("DOĞRULAMA TAMAM ✓");
