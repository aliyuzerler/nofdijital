/**
 * Admin CMS entegrasyon E2E testi (taze boş DB — üretim simülasyonu).
 * Kapsam:
 *  1) Ana Sayfa sekmesi: boş kayıt uyarısı yok, 8 bölüm kartı otomatik oluşur
 *  2) Hizmetler: 7 hizmet otomatik görünür + ekle/düzenle/sil + POPUP DÜZENLEME ROUND-TRIP
 *  3) Portfolyo: 14 görsel otomatik görünür + ekle/çıkar/değiştir + duvar sayacı
 *  4) Medya: 15 varlık + küçük ve büyük (>4.5MB) dosya yükleme
 *  5) Site paritesi: hizmetler/duvar/sayaç admin'den besleniyor
 *  6) Menü: açılır listeden "/#referanslar" öğesi + header yönlendirme/kaydırma testleri
 *  7) Logo: Genel Ayarlar'dan logo yükle → Kaydet → sitede aktif; varsayılana dön
 *  8) Süreç: popup düzenleme round-trip
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

/* Yakalanmayan JS hataları (popup diyaloğu boş/broken render taraması) */
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e?.message ?? e)));

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

// --- POPUP DÜZENLEME ROUND-TRIP (Sorun 3: "düzenler görüntülenmiyor") ---
// Mevcut hizmetin diyaloğu mevcut değerlerle AÇILMALI; kaydedilen düzenleme
// yeniden açıldığında GÖRÜNMELİ; siteye de yansımalı (force-dynamic).
const SVC_TITLE_ORIG = "Reklam Performans Analizi";
const SVC_TITLE_NEW = "Performans Analizi E2E";
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: `${SVC_TITLE_ORIG} düzenle` }).click();
await page.waitForTimeout(500);
const svcDlgVal1 = await page.inputValue("#svc-title");
check("hizmetler popup: mevcut değer görüntüleniyor", svcDlgVal1 === SVC_TITLE_ORIG, `val=${svcDlgVal1}`);
await page.fill("#svc-title", SVC_TITLE_NEW);
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.getByRole("button", { name: `${SVC_TITLE_NEW} düzenle` }).click();
await page.waitForTimeout(500);
const svcDlgVal2 = await page.inputValue("#svc-title");
check("hizmetler popup: kaydedilen düzenleme tekrar görüntüleniyor", svcDlgVal2 === SVC_TITLE_NEW, `val=${svcDlgVal2}`);
await page.getByRole("button", { name: "Vazgeç" }).click();
await page.waitForTimeout(400);
// siteye yansıma (ana sayfa force-dynamic)
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const svcSiteBody = await page.textContent("body");
check("site: hizmet düzenlemesi anında yayında", svcSiteBody.includes(SVC_TITLE_NEW), "");
// geri al
await page.goto(BASE + "/admin/services", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: `${SVC_TITLE_NEW} düzenle` }).click();
await page.waitForTimeout(500);
await page.fill("#svc-title", SVC_TITLE_ORIG);
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
const svcBody4 = await page.textContent("body");
check("hizmetler popup: geri alındı", svcBody4.includes(SVC_TITLE_ORIG), "");

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

/* ---- 4b) SÜREÇ POPUP ROUND-TRIP ---- */
await page.goto(BASE + "/admin/process", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const PR_TITLE_ORIG = "Analiz";
const PR_TITLE_NEW = "Analiz E2E";
await page.getByRole("button", { name: `${PR_TITLE_ORIG} düzenle` }).click();
await page.waitForTimeout(500);
const prDlgVal1 = await page.inputValue("#p-title");
check("süreç popup: mevcut değer görüntüleniyor", prDlgVal1 === PR_TITLE_ORIG, `val=${prDlgVal1}`);
await page.fill("#p-title", PR_TITLE_NEW);
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.getByRole("button", { name: `${PR_TITLE_NEW} düzenle` }).click();
await page.waitForTimeout(500);
const prDlgVal2 = await page.inputValue("#p-title");
check("süreç popup: kaydedilen düzenleme görüntüleniyor", prDlgVal2 === PR_TITLE_NEW, `val=${prDlgVal2}`);
await page.getByRole("button", { name: "Vazgeç" }).click();
await page.waitForTimeout(400);
await page.goto(BASE + "/admin/process", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.getByRole("button", { name: `${PR_TITLE_NEW} düzenle` }).click();
await page.waitForTimeout(500);
await page.fill("#p-title", PR_TITLE_ORIG);
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: SHOT + "/cms-process.png" });

/* ---- 4c) MENÜ: açılır hedef + yönlendirme testleri (Sorun 1 ve 2) ---- */
await page.goto(BASE + "/admin/navigation", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
// Bootstrap 7 varsayılan öğe açar (Referanslarımız dahil); serbest hedef yerine
// açılır listeden seçim çalışmalı: yeni öğeyi "/#referanslar" ile ekle.
await page.getByRole("button", { name: "Yeni öğe" }).click();
await page.waitForTimeout(400);
await page.fill("#n-label", "Referanslarımız E2E");
await page.selectOption("#n-href", "/#referanslar");
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
const navRows = await page.locator("table tbody tr").count();
check("menü: seed 7 + 1 yeni öğe", navRows === 8, `rows=${navRows}`);
const navBody = await page.textContent("body");
check("menü: hedef /#referanslar kaydedildi", navBody.includes("/#referanslar"), "");

// header bağlantıları ve kaydırma davranışı (DB menüsü aktif)
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const refLink = page.locator("header#hd nav.m a", { hasText: "Referanslarımız E2E" });
check("header: yeni Referanslarımız linki var", (await refLink.count()) === 1, "");
check("header: Referanslarımız href doğruden", (await refLink.getAttribute("href")) === "/#referanslar", "");
// sayfa sonuna in → Referanslarımız'a tıkla → bölüm başına kaymalı
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await page.waitForTimeout(600);
await refLink.click();
await page.waitForTimeout(1800);
const refTop = await page.evaluate(() => {
  const el = document.getElementById("referanslar");
  return el ? Math.abs(window.scrollY - (el.getBoundingClientRect().top + window.scrollY - 60)) : -1;
});
check("header: Referanslarımız bölümüne kaydırıyor", refTop >= 0 && refTop < 120, `delta=${refTop}`);
// Ana Sayfa butonu (seed) → site en başına kaymalı
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await page.waitForTimeout(600);
await page.locator("header#hd nav.m a", { hasText: "Ana Sayfa" }).first().click();
await page.waitForTimeout(1800);
const homeY = await page.evaluate(() => window.scrollY);
check("header: Ana Sayfa butonu en başa kaydırıyor", homeY < 10, `scrollY=${homeY}`);
// logo tıklaması → site en başına kaymalı
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await page.waitForTimeout(600);
await page.locator("header#hd a.logo").click();
await page.waitForTimeout(1800);
const logoY = await page.evaluate(() => window.scrollY);
check("header: logo tıklaması en başa kaydırıyor", logoY < 10, `scrollY=${logoY}`);
// blog sayfasından Ana Sayfa → yönlendirme + en başta
await page.goto(BASE + "/blog", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.locator("header#hd nav.m a", { hasText: "Ana Sayfa" }).first().click();
await page.waitForURL(BASE + "/", { timeout: 15000 });
await page.waitForTimeout(1200);
const backY = await page.evaluate(() => window.scrollY);
check("header: blogdan Ana Sayfa'ya yönlendirme", page.url() === BASE + "/" && backY < 10, `url=${page.url()} y=${backY}`);
await page.screenshot({ path: SHOT + "/cms-nav.png" });
// temizlik: test öğesini sil; diğer öğeler kalır
await page.goto(BASE + "/admin/navigation", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "Referanslarımız E2E sil" }).click();
await page.waitForTimeout(2000);

/* ---- 4d) LOGO: Genel Ayarlar'dan yükle → kaydet → sitede aktif (Sorun 4) ---- */
await page.goto(BASE + "/admin/settings/general", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const setBody = await page.textContent("body");
check("ayarlar: Site Logosu kartı var", setBody.includes("Site Logosu"), "");
check("ayarlar: varsayılan logo önizleme", await page.locator('img[alt="Site logosu"]').getAttribute("src") === "/assets/logo.png", "");
await page.setInputFiles('input[type="file"]', "/tmp/upload-logo.png");
await page.waitForTimeout(3500);
const logoPrev1 = await page.locator('img[alt="Site logosu"]').getAttribute("src");
check("ayarlar: yükleme sonrası önizleme değişti", (logoPrev1 ?? "").startsWith("/uploads/media/"), logoPrev1 ?? "yok");
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const logoPrev2 = await page.locator('img[alt="Site logosu"]').getAttribute("src");
check("ayarlar: logo kaydedildi (reload sonrası kalıcı)", logoPrev2 === logoPrev1, `${logoPrev2}`);
// sitede aktif mi?
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const hdrLogoSrc = await page.locator("header#hd a.logo img").getAttribute("src");
check("site: header logosu admin'den geldi", hdrLogoSrc === logoPrev1, hdrLogoSrc ?? "yok");
const ftrLogoSrc = await page.locator("footer a.lg img").getAttribute("src");
check("site: footer logosu admin'den geldi", ftrLogoSrc === logoPrev1, ftrLogoSrc ?? "yok");
await page.screenshot({ path: SHOT + "/cms-logo.png" });
// varsayılana dön
await page.goto(BASE + "/admin/settings/general", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "Varsayılana dön" }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const hdrLogoDefault = await page.locator("header#hd a.logo img").getAttribute("src");
check("site: logo varsayılana döndü", hdrLogoDefault === "/assets/logo.png", hdrLogoDefault ?? "yok");

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

/* ---- konsol JS hatası yok ---- */
check("konsol: yakalanmayan JS hatası yok", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(`\nSONUÇ: ${pass} PASS, ${failCount} FAIL`);
process.exit(failCount ? 1 : 0);
