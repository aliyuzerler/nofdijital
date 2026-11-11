import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/render/admin-login2.png" });

await page.fill("#email", "e2e-owner@nofdigital.local");
await page.fill("#password", "OwnerE2E123!");
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Giriş yap" }).click();
await page.waitForURL("**/admin", { timeout: 20000 });

await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// stats kartını görünür yapıp yakın çekim al
const statsCard = page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı (Sayaçlar)" });
await statsCard.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await statsCard.screenshot({ path: "/tmp/render/admin-stats-card.png" });

// dashboard (admin ana sayfası)
await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/render/admin-dashboard2.png" });

await browser.close();
console.log("OK");
