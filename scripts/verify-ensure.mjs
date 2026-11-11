import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// DB'de stats satırı yok → admin sayfası otomatik oluşturmalı
await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await page.fill("#email", "e2e-owner@nofdigital.local");
await page.fill("#password", "OwnerE2E123!");
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Giriş yap" }).click();
await page.waitForURL("**/admin", { timeout: 20000 });

await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const statsCard = page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı (Sayaçlar)" });
console.log("D1) stats kartı otomatik oluşturuldu:", (await statsCard.count()) === 1 ? "EVET ✓" : "HAYIR ✗");
const v1 = await page.getByLabel("1. sayaç değeri").inputValue();
console.log("D2) varsayılan değer:", v1, v1 === "25" ? "✓" : "✗");

// bir kez daha aç (idempotentlik: ikinci satır oluşmamalı)
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const cardCount = await page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı" }).count();
console.log("D3) idempotent (tek kart):", cardCount === 1 ? "EVET ✓" : `HAYIR ✗ (${cardCount})`);

// editörden değiştir + sitede doğrula
await page.getByLabel("1. sayaç değeri").fill("40");
await statsCard.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.locator("section.stb").scrollIntoViewIfNeeded();
await page.waitForTimeout(2600);
const siteVal = (await page.locator(".stb-num").allTextContents())[0];
console.log("D4) sitede güncel değer:", siteVal, siteVal === "40" ? "✓" : "✗");

// geri al
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByLabel("1. sayaç değeri").fill("25");
await page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı" }).getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
console.log("D5) 25'e geri alındı ✓");

await browser.close();
