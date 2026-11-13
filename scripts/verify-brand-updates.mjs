/**
 * Marka güncellemeleri E2E doğrulaması (14.11.2026 kullanıcı talebi):
 *  1) Favicon HER ZAMAN mor zeminli /assets/logo.png (admin şeffaf logosu favicon'u ezmez)
 *  2) Partnerlerimiz kartındaki logo mor zeminli /assets/logo.png
 *  3) Sekme başlığı eski DB seoTitle'ıyla bile "NOF DİGİTAL" ile başlar;
 *     self-heal DB'yi kalıcı olarak "NOF DİGİTAL — ..." yapar
 *  4) Header logosu büyütülmüş (60px) CSS ile render edilir
 *
 * Çalıştırma (önce build): bunx next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
 *          sonra: bun scripts/verify-brand-updates.mjs
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

const dir = mkdtempSync(resolve(tmpdir(), "brandupd-"));
const ENV = { ...process.env, DATABASE_DRIVER: "pglite", PGLITE_DATA_DIR: dir };
delete ENV.DATABASE_URL;
const PORT = 3118;

// 0) Taze kum havuzu DB: migrate + seed
for (const script of ["scripts/db/migrate-local.ts", "scripts/db/seed.ts"]) {
  const r = spawnSync("bun", [script], { env: ENV, encoding: "utf8" });
  check(`kurulum: ${script}`, r.status === 0, (r.stderr ?? "").split("\n")[0]);
}

// 1) Canlı DB'deki ESKİ durumu taklit et: seoTitle "NOF DİJİTAL" + şeffaf admin logosu
async function withDb(fn) {
  const pg = new PGlite(dir);
  const db = drizzle(pg);
  try {
    return await fn(db);
  } finally {
    await pg.close();
  }
}
await withDb(async (db) => {
  await db
    .update(pages)
    .set({ seoTitle: "NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama" })
    .where(eq(pages.slug, "home"));
  await db
    .update(pageSections)
    .set({ bodyJson: { accent: "yol" } })
    .where(eq(pageSections.sectionKey, "process"));
});
check("kurulum: eski seoTitle + eski 'yol' vurgusu yazıldı", true);

// 2) Sunucuyu başlat, ana sayfayı çek
const srv = spawn("node", [resolve(".next/standalone/server.js")], {
  env: { ...ENV, PORT: String(PORT), HOSTNAME: "127.0.0.1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
srv.stdout.on("data", (d) => (log += d));
srv.stderr.on("data", (d) => (log += d));

let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/`);
    if (res.ok) ready = true;
  } catch {
    /* hazır değil */
  }
  if (!ready) await new Promise((r) => setTimeout(r, 1000));
}
check("sunucu: hazır", ready, ready ? "" : log.slice(-300));

if (ready) {
  const html = await (await fetch(`http://127.0.0.1:${PORT}/`)).text();

  // 3) Sekme başlığı — eski DB değeriyle bile "NOF DİGİTAL" ile başlamalı
  const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? "";
  check("başlık: NOF DİGİTAL ile başlar", title.startsWith("NOF DİGİTAL"), title);
  check("başlık: eski 'NOF DİJİTAL' yazımı yok", !title.includes("DİJİTAL"), title);

  // 4) Favicon mor zeminli logo — admin şeffaf logosu (blob) ezmemeli
  const icon = (html.match(/<link[^>]*rel="icon"[^>]*href="([^"]*)"/) ?? html.match(/<link[^>]*href="([^"]*)"[^>]*rel="icon"/) ?? [])[1] ?? "";
  check("favicon: /assets/logo.png (mor zeminli)", icon.startsWith("/assets/logo.png"), icon);
  check("favicon: blob/şeffaf logo KULLANILMIYOR", !icon.includes("blob") && !icon.includes("uploads"), icon);

  // 5) Partnerlerimiz kartı mor zeminli logo
  const ptnTile = (html.match(/ptn-tile me[^>]*>\s*<img src="([^"]*)"/) ?? [])[1] ?? "";
  check("partner kartı: /assets/logo.png (mor zeminli)", ptnTile === "/assets/logo.png", ptnTile);

  // 6) Header logo büyütülmüş CSS
  check("header logosu: 60px CSS aktif", html.includes("height:60px"), "#hd .logo img");

  // 7) Vurgular hâlâ düzgün (regresyon)
  check("regresyon: Süreç vurgusu 'net bir yol.'", html.includes(">net bir yol.</span>"), "");

  await new Promise((done) => {
    srv.kill("SIGTERM");
    const t = setTimeout(done, 5000);
    srv.on("exit", () => {
      clearTimeout(t);
      done();
    });
  });

  // 8) Self-heal kalıcılığı: DB seoTitle + accent kalıcı düzelmiş olmalı
  const row = await withDb(async (db) => {
    const p = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
    const s = (await db.select().from(pageSections).where(eq(pageSections.sectionKey, "process")))[0];
    return { seoTitle: p?.seoTitle, accent: (s?.bodyJson ?? {}).accent };
  });
  check(
    "self-heal: DB seoTitle 'NOF DİGİTAL — ...' oldu",
    row.seoTitle === "NOF DİGİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
    row.seoTitle,
  );
  check("self-heal: DB accent 'net bir yol.' kaldı", row.accent === "net bir yol.", row.accent);
  check("self-heal: sunucu logu seoTitle düzeltmesini bildirdi", log.includes("[self-heal] seoTitle"), "");
} else {
  srv.kill("SIGTERM");
}

rmSync(dir, { recursive: true, force: true });
console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL`);
process.exit(failCount ? 1 : 0);
