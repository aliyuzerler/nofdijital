import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, extra = "") => {
  results.push(`${cond ? "PASS" : "FAIL"} | ${name}${extra ? " | " + extra : ""}`);
};

// ---------- 1) Login sayfası: input görünürlüğü (beyaz-beyaz sorunu) ----------
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// boş form görüntüsü
await page.screenshot({ path: "/tmp/render/v1-login.png" });

// email alanına tıkla + yaz → odaklanmış halde metin GÖRÜNÜR olmalı
const email = page.locator("#alx-email");
await email.click();
await page.waitForTimeout(200);
await email.type("admin@nofdigital.com", { delay: 25 });
const emailFocusStyles = await email.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { background: cs.backgroundColor, color: cs.color, caret: cs.caretColor };
});
ok(
  "email odakta koyu zemin (beyaza dönmüyor)",
  !emailFocusStyles.background.startsWith("rgb(255, 255, 255"),
  JSON.stringify(emailFocusStyles)
);
await page.screenshot({ path: "/tmp/render/v2-login-focus-email.png" });

// şifre alanı
const pass = page.locator("#alx-password");
await pass.click();
await pass.type("TestSifre123!", { delay: 15 });
const passFocusStyles = await pass.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { background: cs.backgroundColor, color: cs.color };
});
ok(
  "şifre odakta koyu zemin",
  !passFocusStyles.background.startsWith("rgb(255, 255, 255"),
  JSON.stringify(passFocusStyles)
);
await page.screenshot({ path: "/tmp/render/v3-login-focus-pass.png" });

// ---------- 2) Giriş akışı → dashboard ----------
const E2E_EMAIL = process.env.E2E_EMAIL ?? "local-admin@nofdigital.local";
const E2E_PASS = process.env.E2E_PASS ?? "LocalAdmin2026!";
await page.fill("#alx-email", E2E_EMAIL);
await page.fill("#alx-password", E2E_PASS);
await page.getByRole("button", { name: "Giriş Yap" }).click();
let loggedIn = false;
try {
  await page.waitForURL("**/admin", { timeout: 25000 });
  loggedIn = page.url().endsWith("/admin");
  ok("giriş → /admin yönlendirme", true);
} catch {
  const err = await page.locator('[role="alert"]').textContent().catch(() => "(alert yok)");
  ok("giriş → /admin yönlendirme", false, err + " @ " + page.url());
}
await page.waitForTimeout(1200);

if (loggedIn) {
  // sidebar'da Mesajlar OLMAMALI
  const sideText = await page.locator("aside").first().innerText().catch(() => "");
  ok("sidebar'da 'Mesajlar' yok", !sideText.includes("Mesajlar"));
  ok("sidebar'da Blog var", sideText.includes("Blog"));
  ok("sidebar'da Medya var", sideText.includes("Medya"));

  // dashboard gövdesi: 'Son mesajlar' OLMAMALI, 'Son yazılar' olmalı
  const mainText = await page.locator("main").innerText().catch(() => "");
  ok("dashboard'da 'Okunmamış Mesaj' yok", !mainText.includes("Okunmamış Mesaj"));
  ok("dashboard'da 'Son mesajlar' yok", !mainText.includes("Son mesajlar"));
  ok("dashboard'da 'Son yazılar' var", mainText.includes("Son yazılar"));
}
await page.screenshot({ path: "/tmp/render/v4-dashboard.png", fullPage: true });

// /admin/messages artık yok olmalı (404/redirect)
const msgResp = await page.request.get(BASE + "/admin/messages").catch(() => null);
ok("/admin/messages kaldırıldı", msgResp ? msgResp.status() === 404 : true, msgResp ? "status=" + msgResp.status() : "");
const contactResp = await page.request.post(BASE + "/api/contact", { data: { name: "x", email: "x@y.z", message: "x" } }).catch(() => null);
ok("/api/contact kaldırıldı", contactResp ? contactResp.status() === 404 : true, contactResp ? "status=" + contactResp.status() : "");
await page.close();

// ---------- 3) Hakkımızda: performans paneli kartı OLMAMALI ----------
const page3 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page3.goto(BASE + "/", { waitUntil: "networkidle" });
await page3.waitForTimeout(1000);
const about = page3.locator("#hakkimizda");
await about.scrollIntoViewIfNeeded();
await page3.waitForTimeout(600);
const aboutText = await about.innerText();
ok("hakkımızda'da 'Örnek performans paneli' yok", !aboutText.includes("Örnek performans paneli"));
const panCount = await page3.locator("#hakkimizda .pan").count();
ok("hakkımızda'da .pan elemanı yok", panCount === 0, "pan=" + panCount);
const imgs = await page3.locator("#hakkimizda .abv figure img").count();
ok("hakkımızda görselleri duruyor", imgs === 2, "img=" + imgs);
await about.screenshot({ path: "/tmp/render/v5-hakkimizda.png" });
await page3.close();

await browser.close();
console.log(results.join("\n"));
