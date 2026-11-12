/**
 * Runtime SELF-HEAL E2E doğrulaması (src/server/services/repositories.ts → healStaleAccents).
 *
 * Senaryo (kullanıcı talebi 13.11.2026): canlı DB'de accent "yol"/"stratejiyle"
 * gibi ESKİ kısa değerler kayıtlı → site ilk kez istendiğinde bunlar onaylı
 * ifadelere çevrilir ve İLK RENDER'DA bile doğru vurgu gösterilir; admin'in
 * sonradan girdiği ÖZEL değerler ASLA ezilmez.
 *
 * Çalıştırma (önce build): bunx next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
 *          sonra: bun scripts/verify-self-heal.mjs
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { resolve } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { pages, pageSections } from "../src/server/db/schema";

let pass = 0;
let failCount = 0;
function check(name, cond, extra = "") {
  const ok = Boolean(cond);
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${extra ? ` (${extra})` : ""}`);
  if (ok) pass++;
  else failCount++;
}

const dir = mkdtempSync(resolve(tmpdir(), "selfheal-"));
const ENV = { ...process.env, DATABASE_DRIVER: "pglite", PGLITE_DATA_DIR: dir };
delete ENV.DATABASE_URL; // .env'deki file: URL'si postgres modunu tetiklemesin
const PORT = 3117;

function startServer() {
  const srv = spawn("node", [resolve(".next/standalone/server.js")], {
    env: { ...ENV, PORT: String(PORT), HOSTNAME: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  srv.stdout.on("data", (d) => (log += d));
  srv.stderr.on("data", (d) => (log += d));
  return srv;
}

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`);
      if (res.ok) return true;
    } catch {
      /* sunucu henüz hazır değil */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function stopServer(srv) {
  return new Promise((done) => {
    srv.kill("SIGTERM");
    const t = setTimeout(done, 5000);
    srv.on("exit", () => {
      clearTimeout(t);
      done();
    });
  });
}

async function withDb(fn) {
  const pg = new PGlite(dir);
  const db = drizzle(pg);
  try {
    return await fn(db);
  } finally {
    await pg.close(); // sunucunun kilit alabilmesi için mutlaka kapat
  }
}

async function readAccents() {
  return withDb(async (db) => {
    const rows = await db.select().from(pageSections);
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

// 0) Taze kum havuzu DB: migrate + seed
for (const script of ["scripts/db/migrate-local.ts", "scripts/db/seed.ts"]) {
  const r = spawnSync("bun", [script], { env: ENV, encoding: "utf8" });
  check(`kurulum: ${script}`, r.status === 0, (r.stderr ?? "").split("\n")[0]);
}

// 1) Canlı DB'deki eski durumu taklit et
await writeAccent("process", "yol");
await writeAccent("about", "stratejiyle");

// 2) Sunucu #1: İLK istekte hem render hem DB düzeltilmeli
const srv1 = startServer();
const ready1 = await waitReady();
check("sunucu #1: hazır", ready1, ready1 ? "" : "60 sn içinde yanıt yok");
if (ready1) {
  const html = await (await fetch(`http://127.0.0.1:${PORT}/`)).text();
  check(
    "render #1: Süreç başlığında 'net bir yol.' vurgulu (acc-pl span)",
    html.includes(">net bir yol.</span>"),
    "İLK istekte bile düzeltilmiş değer",
  );
  check(
    "render #1: Hakkımızda'da 'Yaratıcılığı stratejiyle,' vurgulu (em)",
    html.includes(">Yaratıcılığı stratejiyle,</em>"),
    "",
  );
  const solo = (html.match(/>([^<>]*yol[^<>]*)<\/span>/g) ?? []).join(" | ");
  check("render #1: yalnızca 'yol' KELİMESİ vurgulanmıyor", !/>yol\.?<\/span>/.test(html), solo.slice(0, 120));
}
await stopServer(srv1);

// 3) DB kalıcı düzeltme doğrulaması (sunucu kapandı, dosya kilidi serbest)
const acc1 = await readAccents();
check("self-heal: DB process 'yol' → 'net bir yol.'", acc1.process === "net bir yol.", acc1.process);
check("self-heal: DB about 'stratejiyle' → 'Yaratıcılığı stratejiyle,'", acc1.about === "Yaratıcılığı stratejiyle,", acc1.about);

// 4) Admin'in ÖZEL değeri runtime'da da ezilmez
await writeAccent("process", "özel vurgu E2E");
const srv2 = startServer();
const ready2 = await waitReady();
check("sunucu #2: hazır", ready2, "");
if (ready2) {
  await (await fetch(`http://127.0.0.1:${PORT}/`)).text();
}
await stopServer(srv2);
const acc2 = await readAccents();
check("self-heal: özel değer korunur ('özel vurgu E2E')", acc2.process === "özel vurgu E2E", acc2.process);

rmSync(dir, { recursive: true, force: true });
console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL`);
process.exit(failCount ? 1 : 0);
