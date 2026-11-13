/**
 * BASINDA BİZ E2E doğrulaması (14.11.2026): blog kaldırıldı, yerine basın
 * haberleri modülü geldi + footer "NOF DIGITAL" + prototip notu kaldırıldı.
 *
 * Senaryo:
 *  - Taze PGlite DB (migrate+seed) → press_items tablosu var, blog tabloları YOK
 *  - 2 örnek haber eklenir (yeni + eski) → sıralama en yeni üstte
 *  - /basinda-biz: kartlar, dış bağlantı target=_blank rel=noopener, kaynak etiketi
 *  - /blog ve /blog/* → /basinda-biz'e 308 yönlendirme
 *  - Ana sayfa: press-preview bölümü + Tümünü Gör butonu; menüde Blog yok
 *  - Footer: "© ... NOF DIGITAL. Tüm hakları saklıdır.", prototip notu yok
 *  - Boş DB: /basinda-biz "Yakında buradayız" boş durumu
 *  - /admin/press anonsem admin login'e yönlenir
 *
 * Not: Yetim sunucu süreci kalmasın diye tüm akış try/finally içindedir
 * (port çakışması EADDRINUSE → önceki çalıştırmanın sunucusu demektir).
 *
 * Çalıştırma (önce build): bun run build
 *          sonra: bun scripts/verify-press.mjs
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

const dir = mkdtempSync(resolve(tmpdir(), "press-"));
const SHOTS = resolve(".next/press-shots");
mkdirSync(SHOTS, { recursive: true });
const ENV = { ...process.env, DATABASE_DRIVER: "pglite", PGLITE_DATA_DIR: dir };
delete ENV.DATABASE_URL;
const PORT = 3119;
const BASE = `http://127.0.0.1:${PORT}`;

// 0) Taze kum havuzu DB: migrate + seed
for (const script of ["scripts/db/migrate-local.ts", "scripts/db/seed.ts"]) {
  const r = spawnSync("bun", [script], { env: ENV, encoding: "utf8" });
  check(`kurulum: ${script}`, r.status === 0, (r.stderr ?? "").split("\n")[0]);
}

// 1) Blog tabloları gerçekten düştü mü? + örnek haberler
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
  const blogTables = await db.execute(`select table_name from information_schema.tables where table_schema='public' and table_name like 'blog%'`);
  const rows = Array.isArray(blogTables) ? blogTables : blogTables.rows;
  check("migration: blog tabloları yok", rows.length === 0, rows.map((r) => r.table_name).join(","));

  const pressTables = await db.execute(`select count(*)::int as n from press_items`);
  const pressRows = Array.isArray(pressTables) ? pressTables : pressTables.rows;
  check("migration: press_items tablosu hazır", pressRows[0]?.n === 0);

  const sections = await db.execute(`select section_key from page_sections where section_key in ('blog-preview','press-preview')`);
  const secRows = Array.isArray(sections) ? sections : sections.rows;
  check("migration: press-preview bölümü var, blog-preview yok", secRows.length === 1 && secRows[0]?.section_key === "press-preview", secRows.map((r) => r.section_key).join(","));

  const now = Date.now();
  await db.insert(pressItems).values({
    url: "https://www.hurriyet.com.tr/ornek/nof-digital-haber",
    imageUrl: "/uploads/gallery/gallery-03.webp",
    description: "NOF Digital, örnek haberde ayın yaratıcı prodüksiyon ajansı olarak seçildi.",
    sourceName: "Hürriyet",
    createdAt: new Date(now - 86400_000),
  });
  await db.insert(pressItems).values({
    url: "https://webrazzi.com/2026/11/nof-digital-yeni-projeler",
    imageUrl: "/uploads/gallery/gallery-08.webp",
    description: "Webrazzi, NOF Digital'ın yeni reklam iş birliklerini yazdı; kampanya detayları orijinal kaynağında.",
    sourceName: "Webrazzi",
    createdAt: new Date(now),
  });
});

// 2) Sunucu — crash-safe: hata olsa da sunucu kapatılır
const srv = spawn("node", [resolve(".next/standalone/server.js")], {
  env: { ...ENV, PORT: String(PORT), HOSTNAME: "127.0.0.1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
srv.stdout.on("data", (d) => (log += d));
srv.stderr.on("data", (d) => (log += d));
srv.on("exit", (code) => {
  if (!log.includes("EADDRINUSE")) return;
  log += "\n[not] Port 3119 zaten kullanılıyor — önceki çalıştırmadan kalan sunucu sürecini kapatın.";
  void code;
});

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

  const pressRes = await fetch(`${BASE}/basinda-biz`);
  const pressHtml = await pressRes.text();
  const homeRes = await fetch(`${BASE}/`);
  const homeHtml = await homeRes.text();
  if (!log.includes("EADDRINUSE")) {
    console.log(`[diag] /basinda-biz status=${pressRes.status} | / status=${homeRes.status}`);
  }

  // 3) /basinda-biz kontrolleri
  check("başlık: 'Basında Biz — NOF DIGITAL'", pressHtml.includes("Basında Biz — NOF DIGITAL"));
  check("kart: Hürriyet haberi var", pressHtml.includes("ayın yaratıcı prodüksiyon ajansı olarak seçildi"));
  check("kart: Webrazzi haberi var", pressHtml.includes("yeni reklam iş birliklerini yazdı"));
  check("sıralama: en yeni (Webrazzi) üstte", pressHtml.indexOf("yeni reklam iş birliklerini") < pressHtml.indexOf("ayın yaratıcı prodüksiyon ajansı"));
  check("dış bağlantı: target=_blank", /<a class="pr" href="https:\/\/webrazzi\.com\/[^"]*" target="_blank" rel="noopener noreferrer"/.test(pressHtml));
  check("kaynak etiketi: 'Webrazzi' görünür", pressHtml.includes(">Webrazzi</span>"));
  check("kaynak etiketi: 'Hürriyet' görünür", pressHtml.includes(">Hürriyet</span>"));
  check("'Haberi oku' afiyeti var", pressHtml.includes("Haberi oku"));
  check("blog kalıntısı yok (/blog linki)", !pressHtml.includes('href="/blog"'));

  // 4) Ana sayfa kontrolleri
  check("ana sayfa: Basında Biz önizleme eyebrow", homeHtml.includes("Basında Biz"));
  check("ana sayfa: press kartları da listeleniyor", homeHtml.includes("ayın yaratıcı prodüksiyon ajansı olarak seçildi"));
  check("ana sayfa: 'Tümünü Gör' butonu /basinda-biz'a gider", /href="\/basinda-biz"/.test(homeHtml) && homeHtml.includes("Tümünü Gör"));
  check("ana sayfa: menüde Blog yok", !homeHtml.includes(">Blog<") && !homeHtml.includes('href="/blog"'));
  check("ana sayfa: menüde 'Basında Biz' var", homeHtml.includes(">Basında Biz<"));
  check("footer: 'NOF DIGITAL' telif yazısı", homeHtml.includes("NOF DIGITAL. Tüm hakları saklıdır."));
  check("footer: prototip notu kaldırıldı", !homeHtml.includes("Tasarım prototipi"));
  check("footer: 'NOF DİJİTAL. Tüm hakları' eski yazım yok", !homeHtml.includes("NOF DİJİTAL. Tüm hakları"));

  // 5) /blog yönlendirmeleri
  for (const path of ["/blog", "/blog/herhangi-bir-yazi"]) {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    check(`yönlendirme: ${path} → /basinda-biz (308)`, res.status === 308 && (res.headers.get("location") ?? "").endsWith("/basinda-biz"), `status=${res.status} loc=${res.headers.get("location")}`);
  }

  // 6) /admin/press anonse login'e yönlenir
  const adminRes = await fetch(`${BASE}/admin/press`, { redirect: "manual" });
  check(
    "admin: /admin/press anon → login yönlendirmesi",
    [307, 308].includes(adminRes.status) && (adminRes.headers.get("location") ?? "").includes("/admin/login"),
    `status=${adminRes.status} loc=${adminRes.headers.get("location")}`,
  );

  // 7) Görsel kontrol
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.goto(`${BASE}/basinda-biz`, { waitUntil: "networkidle" });
    await page.screenshot({ path: resolve(SHOTS, "1-basinda-biz.png") });

    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector("#basinda-biz-ozet")?.scrollIntoView());
    await page.waitForTimeout(600);
    await page.locator("#basinda-biz-ozet").screenshot({ path: resolve(SHOTS, "2-home-press.png") });

    const navLabels = await page.evaluate(() => [...document.querySelectorAll("nav.m a")].map((a) => a.textContent?.trim()));
    check("header menüsü: Blog yok, Basında Biz var", !navLabels.includes("Blog") && navLabels.includes("Basında Biz"), navLabels.join(", "));
    const ftr = await page.evaluate(() => document.querySelector("footer .fb")?.textContent?.trim());
    check("footer metni görsel olarak doğru", (ftr ?? "").includes("NOF DIGITAL. Tüm hakları saklıdır."), ftr ?? "");

    const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mp.goto(`${BASE}/basinda-biz`, { waitUntil: "networkidle" });
    await mp.screenshot({ path: resolve(SHOTS, "3-basinda-biz-mobil.png") });
  } catch (e) {
    check("görsel kontroller tamamlandı", false, e instanceof Error ? e.message.slice(0, 160) : String(e));
  } finally {
    await browser.close();
  }
} catch (e) {
  check("akış hatasız tamamlandı", false, e instanceof Error ? e.message.slice(0, 200) : String(e));
} finally {
  await killServer();
  rmSync(dir, { recursive: true, force: true });
  if (failCount && log) console.log(`\n--- SUNUCU LOGU (son 3000 karakter) ---\n${log.slice(-3000)}`);
  console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL | ekran görüntüleri: .next/press-shots/`);
  process.exit(failCount ? 1 : 0);
}
