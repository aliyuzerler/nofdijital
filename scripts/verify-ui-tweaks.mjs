/**
 * Görsel doğrulama (14.11.2026 kullanıcı talepleri):
 *  1) LinkedIn + YouTube butonları kaldırıldı → iletişim + footer'da yalnızca Instagram
 *  2) Şeffaf zeminli logolar büyütüldü → header 74px (kaydırınca 52px), footer 82px
 *  3) Partnerlerimiz mor logosu → oval köşeler + diğer partner kartları gibi yuvarlak zemin
 *
 * Çalıştırma (önce build): bun run build
 *          sonra: bun scripts/verify-ui-tweaks.mjs
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { resolve } from "node:path";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

let pass = 0;
let failCount = 0;
function check(name, cond, extra = "") {
  const ok = Boolean(cond);
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${extra ? ` (${extra})` : ""}`);
  if (ok) pass++;
  else failCount++;
}

const dir = mkdtempSync(resolve(tmpdir(), "uitweaks-"));
const SHOTS = resolve(".next/ui-shots");
mkdirSync(SHOTS, { recursive: true });
const ENV = { ...process.env, DATABASE_DRIVER: "pglite", PGLITE_DATA_DIR: dir };
delete ENV.DATABASE_URL;
const PORT = 3118;
const BASE = `http://127.0.0.1:${PORT}`;

// 0) Taze kum havuzu DB: migrate + seed
for (const script of ["scripts/db/migrate-local.ts", "scripts/db/seed.ts"]) {
  const r = spawnSync("bun", [script], { env: ENV, encoding: "utf8" });
  check(`kurulum: ${script}`, r.status === 0, (r.stderr ?? "").split("\n")[0]);
}

// 1) Sunucu
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
    const res = await fetch(`${BASE}/`);
    if (res.ok) ready = true;
  } catch {
    /* hazır değil */
  }
  if (!ready) await new Promise((r) => setTimeout(r, 1000));
}
check("sunucu hazır", ready);
if (!ready) {
  console.log(log.slice(-1500));
  process.exit(1);
}

const html = await (await fetch(`${BASE}/`)).text();

// 2) HTML kontrolleri
check("iletişim: LinkedIn butonu yok", !html.includes('aria-label="LinkedIn"'));
check("iletişim: YouTube butonu yok", !html.includes('aria-label="YouTube"'));
check("iletişim: Instagram butonu duruyor", html.includes('aria-label="Instagram"'));
check("partner kartı: 'me' tile artık şeffaf eziyor değil (inline style yok)", !html.includes('ptn-tile me" style'));
check("partner kartı: mor zeminli logo yolu /assets/logo.png", html.includes('src="/assets/logo.png" alt="NOF Digital"'));

// 3) Görsel kontroller
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  // 3a) Header logo boyutu (yüklenen şeffaf logo /uploads/brand/logo.png)
  const hdr = await page.evaluate(() => {
    const img = document.querySelector("#hd .logo img");
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { h: Math.round(r.height), src: img.getAttribute("src") };
  });
  check("header logosu 74px civarı", hdr && Math.abs(hdr.h - 74) <= 2, `h=${hdr?.h} src=${hdr?.src}`);
  await page.screenshot({ path: resolve(SHOTS, "1-header-top.png") });

  // 3b) Kaydırınca küçülen logo
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(700);
  const hdrSc = await page.evaluate(() => {
    const img = document.querySelector("#hd .logo img");
    const r = img?.getBoundingClientRect();
    return r ? Math.round(r.height) : null;
  });
  check("kaydırınca logo 52px civarı", hdrSc !== null && Math.abs(hdrSc - 52) <= 2, `h=${hdrSc}`);

  // 3c) İletişim bölümü: sosyal butonlar + Partnerlerimiz kartları
  await page.evaluate(() => document.querySelector("#iletisim")?.scrollIntoView());
  await page.waitForTimeout(700);
  const ptn = await page.evaluate(() => {
    const me = document.querySelector(".ptn-tile.me");
    const others = [...document.querySelectorAll(".ptn-tile:not(.me)")];
    const img = me?.querySelector("img");
    const radius = me ? getComputedStyle(me).borderRadius : null;
    const bg = me ? getComputedStyle(me).backgroundColor : null;
    const imgRadius = img ? getComputedStyle(img).borderRadius : null;
    const so = [...document.querySelectorAll("#iletisim .so a")].map((a) => a.getAttribute("aria-label"));
    return { radius, bg, imgRadius, so, others: others.length };
  });
  check("partner kartı zemini yuvarlak (16px)", ptn.radius === "16px", `radius=${ptn.radius}`);
  check("partner kartı zemini renkli chip (#f5f4f9)", ptn.bg === "rgb(245, 244, 249)", `bg=${ptn.bg}`);
  check("mor logo köşeleri oval (12px)", ptn.imgRadius === "12px", `imgRadius=${ptn.imgRadius}`);
  check("iletişim sosyal: yalnızca Instagram", ptn.so.join(",") === "Instagram", ptn.so.join(","));
  await page.locator("#iletisim").screenshot({ path: resolve(SHOTS, "2-iletisim-partnerler.png") });

  // 3d) Footer: logo boyutu + sosyal butonlar
  const ftr = await page.evaluate(() => {
    const img = document.querySelector("footer .lg img");
    const r = img?.getBoundingClientRect();
    const so = [...document.querySelectorAll("footer .so a")].map((a) => a.getAttribute("aria-label"));
    return { h: r ? Math.round(r.height) : null, so };
  });
  check("footer logosu 82px civarı", ftr.h !== null && Math.abs(ftr.h - 82) <= 2, `h=${ftr.h}`);
  check("footer sosyal: yalnızca Instagram", ftr.so.join(",") === "Instagram", ftr.so.join(","));
  await page.locator("footer").screenshot({ path: resolve(SHOTS, "3-footer.png") });

  // 3e) Mobil header (390px)
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const mh = await mp.evaluate(() => {
    const img = document.querySelector("#hd .logo img");
    const r = img?.getBoundingClientRect();
    return r ? { h: Math.round(r.height), w: Math.round(r.width) } : null;
  });
  check("mobil header logosu 56px civarı", mh && Math.abs(mh.h - 56) <= 2, `h=${mh?.h} w=${mh?.w}`);
  await mp.screenshot({ path: resolve(SHOTS, "4-mobil-header.png") });
} finally {
  await browser.close();
}

// 4) Sunucuyu kapat + kum havuzunu sil
await new Promise((done) => {
  srv.kill("SIGTERM");
  const t = setTimeout(done, 5000);
  srv.on("exit", () => {
    clearTimeout(t);
    done();
  });
});
rmSync(dir, { recursive: true, force: true });
console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL | ekran görüntüleri: .next/ui-shots/`);
process.exit(failCount ? 1 : 0);
