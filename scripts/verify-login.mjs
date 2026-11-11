import { chromium } from "playwright";

const MODE = process.env.LMODE ?? "login"; // login | bootstrap
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

if (MODE === "login") {
  // --- 1) LOGIN modu (local DB'de şifreli hesap var) ---
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/render/login-new.png" });
  console.log("L1) login modu screenshot alındı");

  // giriş hâlâ çalışıyor mu?
  await page.fill("#alx-email", "e2e-owner@nofdigital.local");
  await page.fill("#alx-password", "OwnerE2E123!");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  try {
    await page.waitForURL("**/admin", { timeout: 20000 });
    console.log("L2) giriş başarılı →", page.url());
  } catch {
    const err = await page.locator('[role="alert"]').textContent().catch(() => "");
    console.log("L2) GİRİŞ BAŞARISIZ:", err);
  }
  await page.close();
  await browser.close();
  console.log("OK");
} else {
  // --- 2) BOOTSTRAP modu (temiz DB — şifreli hesap yok) ---
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page2.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
  await page2.waitForTimeout(900);
  await page2.screenshot({ path: "/tmp/render/login-bootstrap.png" });
  const hasName = await page2.locator("#alx-name").count();
  console.log("B1) bootstrap modu (İsim alanı var):", hasName === 1 ? "EVET ✓" : "HAYIR ✗");

  // kurulum akışı: hesap oluştur → otomatik giriş → dashboard
  await page2.fill("#alx-name", "Ali Yüzerler");
  await page2.fill("#alx-email", "ali@nofdigital.com");
  await page2.fill("#alx-password", "NofDijital2026!");
  await page2.waitForTimeout(400);
  await page2.getByRole("button", { name: "Hesabı Oluştur ve Giriş Yap" }).click();
  try {
    await page2.waitForURL("**/admin", { timeout: 25000 });
    console.log("B2) bootstrap + otomatik giriş başarılı →", page2.url());
    await page2.waitForTimeout(1200);
    await page2.screenshot({ path: "/tmp/render/bootstrap-dashboard.png" });
  } catch {
    const err = await page2.locator('[role="alert"]').textContent().catch(() => "");
    const url = page2.url();
    console.log("B2) bootstrap akışı sorunlu:", err || url);
  }
  await browser.close();
  console.log("OK");
}
