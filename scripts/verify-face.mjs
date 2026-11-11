import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Koyu tema — bant
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.locator("section.stb").scrollIntoViewIfNeeded();
await page.waitForTimeout(2600);
await page.screenshot({ path: "/tmp/render/stb-dark2.png" });

// Açık tema — bant
await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/render/stb-light2.png" });

// Mobil görünüm (390px)
await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/render/stb-mobile.png", fullPage: false });

await browser.close();
console.log("OK: stb-dark2, stb-light2, stb-mobile");
