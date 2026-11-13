/**
 * BASINDA BİZ ADMIN UI E2E (14.11.2026): giriş → /admin/press → yeni haber
 * ekleme (medya seçici dahil) → görünürlük anahtarı → silme. Ayrıca panel
 * ana ekranındaki "Basın Haberleri" metriği + son haberler kartı kontrol edilir.
 *
 * Çalıştırma (önce build): bun run build
 *          sonra: bun scripts/verify-press-admin.mjs
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { resolve } from "node:path";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { pressItems } from "../src/server/db/schema";
import { chromium } from "playwright";

let pass = 0;
let failCount = 0;
function check(name, cond, extra = "") {
  const ok = Boolean(cond);
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${extra ? ` (${extra})` : ""}`);
  if (ok) pass++;
  else failCount++;
}

const dir = mkdtempSync(resolve(tmpdir(), "pressadm-"));
const SHOTS = resolve(".next/press-shots");
mkdirSync(SHOTS, { recursive: true });
const ENV = { ...process.env, DATABASE_DRIVER: "pglite", PGLITE_DATA_DIR: dir };
delete ENV.DATABASE_URL;
const PORT = 3120;
const BASE = `http://127.0.0.1:${PORT}`;

for (const script of ["scripts/db/migrate-local.ts", "scripts/db/seed.ts", "scripts/db/ensure-e2e-users.ts"]) {
  const r = spawnSync("bun", [script], { env: ENV, encoding: "utf8" });
  check(`kurulum: ${script}`, r.status === 0, (r.stderr ?? "").split("\n")[0]);
}

// Örnek mevcut haber
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
  await db.insert(pressItems).values({
    url: "https://webrazzi.com/2026/11/nof-digital-yeni-projeler",
    imageUrl: "/uploads/gallery/gallery-08.webp",
    description: "Webrazzi, NOF Digital'ın yeni reklam iş birliklerini yazdı; kampanya detayları orijinal kaynağında.",
    sourceName: "Webrazzi",
  });
});

const srv = spawn("node", [resolve(".next/standalone/server.js")], {
  env: {
    ...ENV,
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    // Standalone sunucu için auth değişkenleri (Vercel'de env olarak tanımlıdır)
    AUTH_SECRET: "e2e-verification-secret-0123456789abcdef",
    APP_URL: `http://127.0.0.1:${PORT}`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
srv.stdout.on("data", (d) => (log += d));
srv.stderr.on("data", (d) => (log += d));

async function killServer() {
  await new Promise((done) => {
    srv.kill("SIGTERM");
    const t = setTimeout(done, 5000);
    srv.on("exit", () => {
      clearTimeout(t);
      done();
    });
  });
}

try {
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) ready = true;
    } catch {
      /* hazır değil */
    }
    if (!ready) await new Promise((r) => setTimeout(r, 1000));
  }
  check("sunucu hazır", ready, log.includes("EADDRINUSE") ? "PORT ÇAKIŞMASI" : "");
  if (!ready) throw new Error("sunucu başlamadı");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  // 1) Giriş
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill("#alx-email", "e2e-owner@nofdigital.local");
  await page.fill("#alx-password", "OwnerE2E123!");
  await page.click('button:has-text("Giriş Yap")');
  await page.waitForURL("**/admin", { timeout: 20000 });
  check("login → /admin paneline yönlenir", page.url().includes("/admin"));

  // 2) Panel metrikleri
  await page.waitForLoadState("networkidle");
  const dash = await page.evaluate(() => document.body.textContent ?? "");
  check("panel: 'Basın Haberleri' metriği var", dash.includes("Basın Haberleri"));
  check("panel: 'Son basın haberleri' kartı var", dash.includes("Son basın haberleri"));
  check("panel: 'Toplam Yazı' (blog) metriği yok", !dash.includes("Toplam Yazı"));
  await page.screenshot({ path: resolve(SHOTS, "4-admin-panel.png") });

  // 3) /admin/press listesi
  await page.goto(`${BASE}/admin/press`, { waitUntil: "networkidle" });
  let tableText = await page.evaluate(() => document.body.textContent ?? "");
  check("admin/press: mevcut haber listede", tableText.includes("yeni reklam iş birliklerini"));
  check("admin/press: başlık 'Basında Biz'", tableText.includes("Basında Biz"));
  await page.locator("header").first().screenshot({ path: resolve(SHOTS, "5-admin-press-list.png") });

  // 4) Yeni haber ekle (medya seçiciyle)
  await page.click('button:has-text("Yeni Haber")');
  await page.waitForSelector('[role="dialog"]');
  await page.fill("#pr-url", "https://www.hurriyet.com.tr/ornek/nof-digital-haber");
  await page.click('button:has-text("Seç")');
  await page.waitForSelector('[role="dialog"] img', { timeout: 10000 });
  await page.locator('[role="dialog"] button:has(img)').first().click();
  const imgVal = await page.inputValue("#pr-img");
  check("medya seçici: görsel yolu dolduruldu", imgVal.startsWith("/uploads/"), imgVal);
  await page.fill("#pr-desc", "NOF Digital, örnek haberde ayın yaratıcı prodüksiyon ajansı olarak seçildi.");
  await page.fill("#pr-src", "Hürriyet");
  await page.locator('[role="dialog"] button:has-text("Kaydet")').click();
  await page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 15000 });
  await page.waitForLoadState("networkidle");
  tableText = await page.evaluate(() => document.body.textContent ?? "");
  check("ekleme: yeni haber listede", tableText.includes("ayın yaratıcı prodüksiyon ajansı"), "");
  check("ekleme: kaynak adı listede", tableText.includes("Hürriyet"));
  await page.screenshot({ path: resolve(SHOTS, "6-admin-press-added.png") });

  // 5) Görünürlük anahtarı → gizle, sitede kaybolmalı (kontroller sunucu üzerinden)
  const visibleSwitch = page.locator("tbody tr", { hasText: "Hürriyet" }).locator('button[role="switch"]');
  await visibleSwitch.click();
  await page.waitForTimeout(1200);
  const publicHtml = await (await fetch(`${BASE}/basinda-biz`)).text();
  check("gizle: site listesinden kayboldu", !publicHtml.includes("ayın yaratıcı prodüksiyon ajansı"), "");
  check("gizle: diğer haber görünmeye devam ediyor", publicHtml.includes("yeni reklam iş birliklerini"), "");

  // 6) Silme (alert dialog onayı) — doğrulama UI üzerinden (sunucu çalışırken
  // ayrı PGlite bağlantısı açmak WASM abort'una yol açar; DB kontrolü kapanışta)
  const delBtn = page.locator("tbody tr", { hasText: "Hürriyet" }).locator('button[aria-label="Haberi sil"]');
  await delBtn.click();
  await page.waitForSelector('[role="alertdialog"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await page.locator('[role="alertdialog"] button:has-text("Sil")').click();
  await page.waitForSelector('[role="alertdialog"]', { state: "detached", timeout: 15000 });
  await page.waitForTimeout(1500);
  const bodyText = await page.evaluate(() => document.body.textContent ?? "");
  check("silme: listeden kayboldu", !bodyText.includes("ayın yaratıcı prodüksiyon ajansı") && bodyText.includes("yeni reklam iş birliklerini"), "");

  await browser.close();
} catch (e) {
  check("akış hatasız tamamlandı", false, e instanceof Error ? e.message.slice(0, 220) : String(e));
} finally {
  await killServer();
  // Sunucu kapandı → artık güvenle DB sayımı yapılabilir
  let dbCount = -1;
  try {
    dbCount = await withDb(async (db) => (await db.select().from(pressItems)).length);
  } catch {
    /* kum havuzu zaten silinmiş olabilir */
  }
  check("DB: silme kalıcı (1 haber kaldı)", dbCount === 1, String(dbCount));
  rmSync(dir, { recursive: true, force: true });
  if (failCount && log) console.log(`\n--- SUNUCU LOGU (son 3000 karakter) ---\n${log.slice(-3000)}`);
  console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL | ekran görüntüleri: .next/press-shots/`);
  process.exit(failCount ? 1 : 0);
}
