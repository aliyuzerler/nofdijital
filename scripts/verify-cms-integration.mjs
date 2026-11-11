/**
 * Admin CMS entegrasyon E2E testi (taze boş DB — üretim simülasyonu).
 * Kapsam:
 *  1) Ana Sayfa sekmesi: boş kayıt uyarısı yok, 8 bölüm kartı otomatik oluşur
 *  2) Hizmetler: 7 hizmet otomatik görünür + ekle/düzenle/sil
 *  3) Portfolyo: 14 görsel otomatik görünür + ekle/çıkar/değiştir + duvar sayacı
 *  4) Medya: 15 varlık + küçük ve büyük (>4.5MB) dosya yükleme
 *  5) Site paritesi: hizmetler/duvar/sayaç admin'den besleniyor
 * Çalıştırma: sunucu ayaktayken `bun scripts/verify-cms-integration.mjs`
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const SHOT = "/tmp/render";
import { mkdirSync } from "node:fs";
mkdirSync(SHOT, { recursive: true });

let pass = 0;
let failCount = 0;
function check(name, cond, extra = "") {
  const ok = Boolean(cond);
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${extra ? ` (${extra})` : ""}`);
  if (ok) pass++;
  else failCount++;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);

/* ---- login ---- */
await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await page.fill("#alx-email", "e2e-owner@nofdigital.local");
await page.fill("#alx-password", "OwnerE2E123!");
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Giriş Yap" }).click();
await page.waitForURL("**/admin", { timeout: 25000 });
check("login", true);

/* ---- 1) ANA SAYFA ---- */
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const body1 = await page.textContent("body");
check("anasayfa: 'kayıt bulunamadı' yok", !body1.includes("Ana sayfa kaydı bulunamadı"));
const cardCount = await page.locator('[data-slot="card"]').count();
check("anasayfa: 8 bölüm kartı", cardCount === 8, `count=${cardCount}`);
check("anasayfa: hero kartı var", body1.includes("Hero"));
check("anasayfa: stats kartı var", body1.includes("İstatistik Bandı"));
await page.screenshot({ path: SHOT + "/cms-home.png", fullPage: true });

/* ---- 2) HİZMETLER ---- */
await page.goto(BASE + "/admin/services", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
let svcRows = await page.locator("table tbody tr").count();
check("hizmetler: 7 hizmet otomatik", svcRows === 7, `rows=${svcRows}`);
const svcBody = await page.textContent("body");
check("hizmetler: site içeriği admin'de", svcBody.includes("Sosyal Medya Yönetimi") && svcBody.includes("Google Ads Reklam Yönetimi"));

// yeni hizmet ekle
await page.getByRole("button", { name: "Yeni Hizmet" }).click();
await page.waitForTimeout(400);
await page.fill("#svc-title", "Deneme Hizmeti");
await page.fill("#svc-desc", "E2E testi ile eklenen geçici hizmet kartı.");
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
svcRows = await page.locator("table tbody tr").count();
check("hizmetler: ekleme sonrası 8 satır", svcRows === 8, `rows=${svcRows}`);
const svcBody2 = await page.textContent("body");
check("hizmetler: yeni hizmet listede", svcBody2.includes("Deneme Hizmeti"));

// idempotentlik: reload sonrası hâlâ 8
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
svcRows = await page.locator("table tbody tr").count();
check("hizmetler: reload idempotent (8)", svcRows === 8, `rows=${svcRows}`);

// düzenle: başlığı değiştir
await page.getByRole("button", { name: "Deneme Hizmeti düzenle" }).click();
await page.waitForTimeout(400);
await page.fill("#svc-title", "Deneme Hizmeti 2");
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
const svcBody3 = await page.textContent("body");
check("hizmetler: düzenleme yansıdı", svcBody3.includes("Deneme Hizmeti 2"));

// sil
await page.getByRole("button", { name: "Deneme Hizmeti 2 sil" }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Sil", exact: true }).click();
await page.waitForTimeout(2500);
svcRows = await page.locator("table tbody tr").count();
check("hizmetler: silme sonrası 7 satır", svcRows === 7, `rows=${svcRows}`);
await page.screenshot({ path: SHOT + "/cms-services.png" });

/* ---- 3) PORTFOLYO ---- */
await page.goto(BASE + "/admin/portfolio", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
let galRows = await page.locator("table tbody tr").count();
check("portfolyo: 14 görsel otomatik", galRows === 14, `rows=${galRows}`);
const galBody = await page.textContent("body");
check("portfolyo: duvar tam bandı", galBody.includes("Duvar tam: 14"));
check("portfolyo: captions admin'de", galBody.includes("Aksiyon · Spor"));

// ekle: medya seçici (logo tek seçenek)
await page.getByRole("button", { name: "Galeriye Görsel Ekle" }).click();
await page.waitForTimeout(500);
const pickerOptions = await page.locator('[aria-pressed]').count();
check("portfolyo: seçicide 1 medya (logo)", pickerOptions === 1, `options=${pickerOptions}`);
await page.locator('[aria-pressed]').first().click();
await page.fill("#picker-alt", "NOF logosu galeri testi");
await page.getByRole("button", { name: "Ekle", exact: true }).click();
await page.waitForTimeout(2500);
galRows = await page.locator("table tbody tr").count();
check("portfolyo: ekleme sonrası 15 satır", galRows === 15, `rows=${galRows}`);
const galBody2 = await page.textContent("body");
check("portfolyo: duvar uyarısı görünüyor (15≠14)", galBody2.includes("tam olarak 14 görünür görselle çizilir"));

// çıkar (eklenen logo satırını sil — en son pozisyon)
await page.getByRole("button", { name: "Galeriden çıkar" }).last().click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Çıkar", exact: true }).click();
await page.waitForTimeout(2500);
galRows = await page.locator("table tbody tr").count();
check("portfolyo: çıkarma sonrası 14 satır", galRows === 14, `rows=${galRows}`);

// değiştir: ilk slotu logo ile değiştir, sonra geri al
const firstSrcBefore = await page.locator("table tbody tr").first().locator("img").getAttribute("src");
await page.getByRole("button", { name: "Görseli değiştir" }).first().click();
await page.waitForTimeout(500);
await page.locator('[aria-pressed]').first().click();
await page.getByRole("button", { name: "Değiştir", exact: true }).click();
await page.waitForTimeout(2500);
const firstSrcAfter = await page.locator("table tbody tr").first().locator("img").getAttribute("src");
check("portfolyo: slot görseli değişti", firstSrcBefore !== firstSrcAfter && firstSrcAfter.includes("logo"), `${firstSrcAfter}`);
// geri al: artık gallery-01 seçicide olmalı
await page.getByRole("button", { name: "Görseli değiştir" }).first().click();
await page.waitForTimeout(500);
await page.locator('[aria-pressed]').first().click();
await page.getByRole("button", { name: "Değiştir", exact: true }).click();
await page.waitForTimeout(2500);
const firstSrcRestored = await page.locator("table tbody tr").first().locator("img").getAttribute("src");
check("portfolyo: slot geri alındı", firstSrcRestored.includes("gallery-01"), `${firstSrcRestored}`);
await page.screenshot({ path: SHOT + "/cms-portfolio.png" });

/* ---- 4) MEDYA ---- */
await page.goto(BASE + "/admin/media", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const gridCards = await page.locator(".grid img").count();
check("medya: 15 varlık otomatik (14 galeri + logo)", gridCards === 15, `cards=${gridCards}`);

// küçük dosya yükle
await page.setInputFiles('input[type="file"]', "/tmp/upload-small.png");
await page.waitForTimeout(3000);
let medBody = await page.textContent("body");
check("medya: küçük dosya yüklendi", medBody.includes("upload-small"));
await page.screenshot({ path: SHOT + "/cms-media-small.png" });

// büyük dosya yükle (~6-15MB; istemcide küçültülmeli)
await page.setInputFiles('input[type="file"]', "/tmp/upload-big.png");
await page.waitForTimeout(6000);
medBody = await page.textContent("body");
const hasBig = medBody.includes("upload-big");
check("medya: büyük dosya yüklendi (otomatik küçültme)", hasBig);
await page.screenshot({ path: SHOT + "/cms-media-big.png" });

/* ---- 5) SİTE PARİTESİ ---- */
// admin'den stats değerini değiştir → sitede görün
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const statsCard = page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı" });
await statsCard.scrollIntoViewIfNeeded();
await page.getByLabel("1. sayaç değeri").fill("40");
await statsCard.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const siteBody = await page.textContent("body");
check("site: hizmetler admin'den", siteBody.includes("Sosyal Medya Yönetimi"));
const phCount = await page.locator("#gt .ph").count();
check("site: duvar 21 figür (3 sahne × 7)", phCount === 21, `ph=${phCount}`);
const firstPhSrc = await page.locator("#gt .ph img").first().getAttribute("src");
check("site: duvar DB görsellerinden", (firstPhSrc ?? "").includes("/uploads/gallery/"), firstPhSrc ?? "yok");
await page.locator("section.stb").scrollIntoViewIfNeeded();
await page.waitForTimeout(2600);
const stbVal = (await page.locator(".stb-num").allTextContents())[0];
check("site: stats admin'den güncellendi (40)", String(stbVal).trim() === "40", `val=${stbVal}`);
await page.screenshot({ path: SHOT + "/cms-site.png", fullPage: true });

// geri al
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.getByLabel("1. sayaç değeri").fill("25");
await page.locator('[data-slot="card"]').filter({ hasText: "İstatistik Bandı" }).getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2000);

await browser.close();
console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL`);
process.exit(failCount ? 1 : 0);
