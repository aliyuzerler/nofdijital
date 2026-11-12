/**
 * fix-stale-accents.ts E2E doğrulaması (taze PGlite kum havuzu DB üzerinde).
 *
 * Senaryo (kullanıcı talebi 13.11.2026): canlı DB'de accent "yol"/"stratejiyle"
 * gibi ESKİ kısa değerler kayıtlı → script bunları onaylı ifadelere çevirir;
 * admin'in sonradan girdiği ÖZEL değerler ise ASLA ezilmez; tekrar koşum
 * değişiklik üretmez (idempotent).
 *
 * Çalıştırma: bun scripts/verify-accent-migration.mjs
 * (Sunucu GEREKMEZ — yalnız DB katmanı; sunucu tarafı render zaten
 *  verify-cms-integration.mjs ile 77 kontrolde kapsanıyor.)
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq, inArray } from "drizzle-orm";
import { resolve } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pages, pageSections } from "../src/server/db/schema";

let pass = 0;
let failCount = 0;
function check(name, cond, extra = "") {
  const ok = Boolean(cond);
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${extra ? ` (${extra})` : ""}`);
  if (ok) pass++;
  else failCount++;
}

const dir = mkdtempSync(resolve(tmpdir(), "accfix-"));
const ENV = { ...process.env, DATABASE_DRIVER: "pglite", PGLITE_DATA_DIR: dir, ACCENT_FIX_FORCE: "1" };
delete ENV.DATABASE_URL; // .env'deki file: URL'si postgres modunu tetiklemesin

function runFix() {
  const r = spawnSync("bun", ["scripts/db/fix-stale-accents.ts"], { env: ENV, encoding: "utf8" });
  check("script: exit 0 (build asla düşmez)", r.status === 0, `status=${r.status}`);
  return r.stdout + (r.stderr ?? "");
}

async function withDb(fn) {
  const pg = new PGlite(dir);
  const db = drizzle(pg);
  try {
    return await fn(db);
  } finally {
    await pg.close(); // subprocess'ların kilit alabilmesi için mutlaka kapat
  }
}

async function readAccents() {
  return withDb(async (db) => {
    const home = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
    const rows = await db
      .select()
      .from(pageSections)
      .where(inArray(pageSections.sectionKey, ["about", "process"]));
    return Object.fromEntries(rows.map((r) => [r.sectionKey, (r.bodyJson ?? {}).accent]));
  });
}

async function writeAccent(key, value) {
  await withDb(async (db) => {
    const rows = await db.select().from(pageSections).where(eq(pageSections.sectionKey, key));
    for (const r of rows) {
      const body = { ...(r.bodyJson ?? {}) };
      if (value === undefined) delete body.accent;
      else body.accent = value;
      await db.update(pageSections).set({ bodyJson: body }).where(eq(pageSections.id, r.id));
    }
  });
}

// 0) Taze DB: migrate + seed (subprocess'ler kendi açar/kapatır)
for (const [script, args] of [
  ["scripts/db/migrate-local.ts", []],
  ["scripts/db/seed.ts", []],
]) {
  const r = spawnSync("bun", [script, ...args], { env: { ...ENV, ACCENT_FIX_FORCE: "" }, encoding: "utf8" });
  check(`kurulum: ${script}`, r.status === 0, (r.stderr ?? "").split("\n")[0]);
}

// 1) ESKİ değerler (canlı DB'deki durum): "yol" ve "stratejiyle"
await writeAccent("process", "yol");
await writeAccent("about", "stratejiyle");
const out1 = runFix();
check("script: stale 'yol' düzeltildi", out1.includes("process"), "log=process satırı");
const acc1 = await readAccents();
check("migration: Süreç accent 'yol' → 'net bir yol.'", acc1.process === "net bir yol.", acc1.process);
check("migration: Hakkımızda accent 'stratejiyle' → 'Yaratıcılığı stratejiyle,'", acc1.about === "Yaratıcılığı stratejiyle,", acc1.about);

// 2) Admin'in ÖZEL değeri ezilmez
await writeAccent("process", "özel vurgu E2E");
runFix();
const acc2 = await readAccents();
check("migration: özel değer korunur ('özel vurgu E2E')", acc2.process === "özel vurgu E2E", acc2.process);

// 3) Boş accent doldurulur
await writeAccent("about", "");
runFix();
const acc3 = await readAccents();
check("migration: boş Hakkımızda accent'i doldurulur", acc3.about === "Yaratıcılığı stratejiyle,", acc3.about);

// 4) Idempotent: doğru değer tekrar değişmez
const out4 = runFix();
const acc4 = await readAccents();
check("migration: idempotent (2. koşum değişiklik yok)", acc4.about === "Yaratıcılığı stratejiyle," && acc4.process === "özel vurgu E2E", JSON.stringify(acc4));
check("script: 2. koşum 'korundu' logluyor", out4.includes("korundu"), "");

rmSync(dir, { recursive: true, force: true });
console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL`);
process.exit(failCount ? 1 : 0);
