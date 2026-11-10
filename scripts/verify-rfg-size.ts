import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/#referanslar", { waitUntil: "networkidle" });

const section = page.locator("#referanslar");
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);

// Bölümün ekran görüntüsü (animasyon donmuş haliyle)
await section.screenshot({ path: "/tmp/render/rfg-section.png" });

// Ölçümler
const metrics = await page.evaluate(() => {
  const chip = document.querySelector<HTMLElement>(".rfg-chip");
  const img = document.querySelector<HTMLImageElement>(".rfg-chip img");
  const chipR = chip!.getBoundingClientRect();
  const imgR = img!.getBoundingClientRect();
  const rows = document.querySelectorAll(".rfg-row");
  const t1 = rows[0]!.querySelector(".rfg-track") as HTMLElement;
  const t2 = rows[1]!.querySelector(".rfg-track") as HTMLElement;
  return {
    chip: `${Math.round(chipR.width)}x${Math.round(chipR.height)}`,
    img: `${Math.round(imgR.width)}x${Math.round(imgR.height)}`,
    imgNatural: `${img!.naturalWidth}x${img!.naturalHeight}`,
    dir1: getComputedStyle(t1).animationDirection,
    dir2: getComputedStyle(t2).animationDirection,
    dur: getComputedStyle(t1).animationDuration,
    rows: rows.length,
    imgs: document.querySelectorAll(".rfg-chip img").length,
  };
});
console.log("Desktop 1440px:", JSON.stringify(metrics, null, 2));

// Mobil görünüm
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://localhost:3000/#referanslar", { waitUntil: "networkidle" });
const mSection = mobile.locator("#referanslar");
await mSection.scrollIntoViewIfNeeded();
await mobile.waitForTimeout(1200);
await mSection.screenshot({ path: "/tmp/render/rfg-section-mobile.png" });
const mMetrics = await mobile.evaluate(() => {
  const chip = document.querySelector<HTMLElement>(".rfg-chip")!;
  const img = document.querySelector<HTMLImageElement>(".rfg-chip img")!;
  const c = chip.getBoundingClientRect();
  const i = img.getBoundingClientRect();
  return { chip: `${Math.round(c.width)}x${Math.round(c.height)}`, img: `${Math.round(i.width)}x${Math.round(i.height)}` };
});
console.log("Mobile 390px:", JSON.stringify(mMetrics));

await browser.close();
console.log("OK");
