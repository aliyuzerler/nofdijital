import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// 1) Hero (chip kaldırıldı mı?)
await page.screenshot({ path: "/tmp/render/v-hero.png" });
const chipCount = await page.locator(".hero .chip").count();
console.log("hero chip count:", chipCount);

// 2) Header nav
const navTexts = await page.locator("nav.m a").allTextContents();
console.log("nav:", navTexts.join(" | "));

// 3) İletişim + partnerler
await page.locator("#iletisim").scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await page.locator("#iletisim").screenshot({ path: "/tmp/render/v-contact.png" });
const formCount = await page.locator("form.ctf").count();
const tiles = await page.locator(".ptn-tile img").count();
console.log("form count:", formCount, "| partner tiles:", tiles);
// tile görselleri yüklendi mi?
const imgStates = await page.evaluate(() =>
  [...document.querySelectorAll(".ptn-tile img")].map((i) => ({
    src: (i as HTMLImageElement).src.split("/").slice(-2).join("/"),
    ok: (i as HTMLImageElement).naturalWidth > 0,
    w: Math.round((i as HTMLElement).getBoundingClientRect().width),
    h: Math.round((i as HTMLElement).getBoundingClientRect().height),
  })),
);
console.log(JSON.stringify(imgStates, null, 1));

// 4) Logo yakınlaştırılmış görünüm (header)
await page.locator("#hd .logo").screenshot({ path: "/tmp/render/v-logo-header.png" });

// 5) 1100px genişlikte nav sıkışma kontrolü
const mid = await browser.newPage({ viewport: { width: 1100, height: 800 } });
await mid.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await mid.waitForTimeout(800);
const overflow = await mid.evaluate(() => {
  const nav = document.querySelector("nav.m");
  const hd = document.querySelector("#hd .wrap");
  return {
    navW: nav ? Math.round(nav.getBoundingClientRect().width) : -1,
    overflows: hd ? hd.scrollWidth > hd.clientWidth : false,
  };
});
console.log("1100px nav:", JSON.stringify(overflow));
await mid.screenshot({ path: "/tmp/render/v-header-1100.png", clip: { x: 0, y: 0, width: 1100, height: 90 } });

// 6) Mobil iletişim bölümü
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await mob.locator("#iletisim").scrollIntoViewIfNeeded();
await mob.waitForTimeout(1000);
await mob.locator("#iletisim").screenshot({ path: "/tmp/render/v-contact-mobile.png" });

await browser.close();
console.log("OK");
