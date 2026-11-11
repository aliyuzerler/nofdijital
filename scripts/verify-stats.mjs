import { chromium } from "playwright";

/**
 * Güvenli istatistik bandı + admin editör E2E doğrulaması:
 *  A) Site: stats bandı SSR final değerleri + sıralı count-up animasyonu
 *  B) Site: hero/footer piksel karşılaştırması (başka yer bozulmadı mı?)
 *  C) Admin: login CSS'i sağlam mı → stats editörü uçtan uca (değer değiştir → kaydet → site yansır → geri al)
 */

const BASE = "http://localhost:3000";
const OUT = "/tmp/render";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});

/* ---------- A) SITE: stats bandı ---------- */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const stbCount = await page.locator("section.stb").count();
console.log("A1) .stb bölümü var mı:", stbCount === 1 ? "EVET" : "HAYIR (" + stbCount + ")");

await page.locator("section.stb").scrollIntoViewIfNeeded();
await page.waitForTimeout(350); // animasyon başlangıcını yakala
const early = await page.locator(".stb-num").allTextContents();
console.log("A2) animasyon başında değerler:", JSON.stringify(early));

await page.waitForTimeout(2500); // animasyon bitimi
const final = await page.locator(".stb-num").allTextContents();
const finals = await page.locator(".stb-plus").allTextContents();
console.log("A3) animasyon sonunda değerler:", JSON.stringify(final), "sonekler:", JSON.stringify(finals));

const labels = await page.locator(".stb-lbl").allTextContents();
console.log("A4) etiketler:", JSON.stringify(labels));

const title = (await page.locator(".stb-title").textContent())?.trim();
console.log("A5) başlık:", title);

await page.screenshot({ path: OUT + "/stb-dark.png" });
console.log("A6) screenshot: stb-dark.png");

/* ---------- B) SITE: hero + footer piksel karşılaştırması ---------- */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1800);
await page.screenshot({ path: OUT + "/after-top.png" });

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1800);
await page.screenshot({ path: OUT + "/after-footer.png" });
console.log("B) hero/footer screenshot alındı (piksel karşılaştırması ayrı scriptte)");

/* ---------- C) ADMIN: login + stats editörü uçtan uca ---------- */
await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "/admin-login.png" });
console.log("C1) login sayfası screenshot alındı");

await page.fill("#email", "e2e-owner@nofdigital.local");
await page.fill("#password", "OwnerE2E123!");
await page.waitForTimeout(800); // hydration tamamlansın
await page.getByRole("button", { name: "Giriş yap" }).click();
try {
  await page.waitForURL("**/admin", { timeout: 20000 });
} catch {
  // bir kez daha dene (ilk tık hydration yarışını kaçırmış olabilir)
  const err = await page.locator('[role="alert"]').textContent().catch(() => "");
  console.log("C2-retry) login hatası metni:", err || "yok");
  await page.fill("#email", "e2e-owner@nofdigital.local");
  await page.fill("#password", "OwnerE2E123!");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await page.waitForURL("**/admin", { timeout: 20000 });
}
await page.waitForTimeout(1200);
console.log("C2) login başarılı →", page.url());
await page.screenshot({ path: OUT + "/admin-dashboard.png" });

await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + "/admin-home-sections.png", fullPage: true });
console.log("C3) /admin/pages/home açıldı");

const statsCard = page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı (Sayaçlar)" });
const cardCount = await statsCard.count();
console.log("C4) stats kartı:", cardCount === 1 ? "EVET" : "HAYIR (" + cardCount + ")");

const beforeVal = await page.getByLabel("1. sayaç değeri").inputValue();
console.log("C5) 1. sayaç mevcut değer:", beforeVal);

// 25 → 32 değiştir, kaydet
await page.getByLabel("1. sayaç değeri").fill("32");
await statsCard.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500); // toast + router.refresh
const afterVal = await page.getByLabel("1. sayaç değeri").inputValue();
console.log("C6) kaydet sonrası admin değeri:", afterVal, afterVal === "32" ? "✓" : "✗");
await page.screenshot({ path: OUT + "/admin-stats-saved.png" });

// sitede yansıdı mı?
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.locator("section.stb").scrollIntoViewIfNeeded();
await page.waitForTimeout(2600);
const siteVal = (await page.locator(".stb-num").allTextContents())[0];
console.log("C7) sitede 1. sayaç:", siteVal, siteVal === "32" ? "✓ (DB'den geliyor)" : "✗");

// geri al: 32 → 25
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByLabel("1. sayaç değeri").fill("25");
const statsCard2 = page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı (Sayaçlar)" });
await statsCard2.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
const restored = await page.getByLabel("1. sayaç değeri").inputValue();
console.log("C8) geri alma:", restored === "25" ? "✓ 25" : "✗ " + restored);

// diğer admin sayfaları hızlı sağlık kontrolü
for (const p of ["/admin", "/admin/services", "/admin/blog", "/admin/media", "/admin/settings/general"]) {
  const resp = await page.goto(BASE + p, { waitUntil: "networkidle" }).then((r) => r.status()).catch(() => -1);
  console.log("C9)", p, "→ HTTP", resp);
}

/* ---------- ek: açık temada stats bandı ---------- */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.documentElement.setAttribute("data-theme", "light");
  try { localStorage.setItem("nof-theme", "light"); } catch {}
});
await page.locator("section.stb").scrollIntoViewIfNeeded();
await page.waitForTimeout(2600);
await page.screenshot({ path: OUT + "/stb-light.png" });
console.log("A7) açık tema screenshot: stb-light.png");

await browser.close();
console.log("\n--- JS hataları ---");
console.log(errors.length ? errors.join("\n") : "YOK ✓");
