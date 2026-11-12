/**
 * Admin CMS entegrasyon E2E testi (taze boş DB — üretim simülasyonu).
 * Kapsam:
 *  1) Ana Sayfa sekmesi: boş kayıt uyarısı yok, 8 bölüm kartı otomatik oluşur
 *  2) Hizmetler: 7 hizmet otomatik görünür + ekle/düzenle/sil + POPUP DÜZENLEME ROUND-TRIP
 *  3) Portfolyo: 14 görsel otomatik görünür + ekle/çıkar/değiştir + duvar sayacı
 *  4) Medya: 15 varlık + küçük ve büyük (>4.5MB) dosya yükleme
 *  5) Site paritesi: hizmetler/duvar/sayaç admin'den besleniyor
 *  6) Menü: STATİK (header+footer Referanslarımız; admin Menü paneli kaldırıldı → 404)
 *  6b) Bölüm başlıkları: Süreç + Hakkımızda başlığı admin'den sitede yayınlanır
 *  6c) Vurgu tonlaması: TEK TON — tüm vurgular koyu temada açık mor (--pl),
 *      açık zemin/kartta ana mor (--p); hero 2. ve 3. satır, hakkımızda
 *      ifadesi dahil metin doğrulaması; accent başlıkta yoksa son kelime
 *      otomatik vurgulanır (fallback), admin'de "Vurgulu kelime" alanı
 *      7 başlıklı bölümde görünür
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

/* ---- POPUP GÖRÜNÜRLÜK (beyaz-üstüne-beyaz regresyon denetimi) ----
   Koyu temada nof.css body metin rengi beyaz; panel bg-background beyaz.
   Portal köklerinde koyu metin dayatılmazsa başlık/label/input görünmez olur. */
const prVis = await page.evaluate(() => {
  const dlg = document.querySelector('[data-slot="dialog-content"]');
  const colorOf = (el) => (el ? getComputedStyle(el).color : "");
  const ctx = document.createElement("canvas").getContext("2d");
  const isWhite = (c) => {
    if (!c) return false;
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return d[0] > 240 && d[1] > 240 && d[2] > 240;
  };
  const title = dlg?.querySelector('[data-slot="dialog-title"]');
  const label = dlg?.querySelector("label");
  const input = dlg?.querySelector("input");
  return {
    panelDark: !isWhite(colorOf(dlg)),
    titleVisible: title ? !isWhite(colorOf(title)) : false,
    labelVisible: label ? !isWhite(colorOf(label)) : false,
    inputVisible: input ? !isWhite(colorOf(input)) : false,
  };
});
check("süreç popup: panel metin rengi koyu", prVis.panelDark, JSON.stringify(prVis));
check("süreç popup: başlık/label/input görünür (beyaz üstüne beyaz yok)", prVis.titleVisible && prVis.labelVisible && prVis.inputVisible, JSON.stringify(prVis));
await page.screenshot({ path: SHOT + "/cms-process-dialog.png" });
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

/* ---- 4c) STATİK MENÜ + BÖLÜM BAŞLIKLARI (Sorun 2 ve 3) ---- */
// Admin menü paneli kaldırıldı: sidebar'da "Menü" yok, /admin/navigation 404.
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const sideBody = await page.textContent("body");
check("admin: Menü paneli kaldırıldı (sidebar'da yok)", !sideBody.includes("Site Menüsü"), "");
await page.goto(BASE + "/admin/navigation", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
const nav404 = await page.evaluate(() => /404|bulunamadı|could not be found/i.test(document.body.innerText));
check("admin: /admin/navigation 404 veriyor", nav404, page.url());

// Süreç başlığı round-trip: admin > Ana Sayfa > Süreç kartı → site #surec h2
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const procCard = page.locator('[data-slot="card"]', { hasText: "Süreç" }).first();
await procCard.getByLabel("Başlık").fill("Beş adımda, kesin sonuç E2E.");
await procCard.getByLabel("Vurgulu kelime").fill("kesin sonuç E2E.");
await procCard.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const surecH2 = await page.textContent("#surec h2");
check("site: Süreç başlığı admin'den yayınlanıyor", (surecH2 ?? "").includes("kesin sonuç E2E."), (surecH2 ?? "yok").trim());

// Vurgu fallback (kullanıcı onayı 12.11.2026): accent kelimesi başlıkta YOKSA
// son kelime otomatik vurgulanmalı — düz beyaz başlık imkânsız.
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const procCardFb = page.locator('[data-slot="card"]', { hasText: "Süreç" }).first();
await procCardFb.getByLabel("Vurgulu kelime").fill("başlıkta hiç geçmeyen kelime");
await procCardFb.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const surecFb = await page.evaluate(() => {
  const el = document.querySelector("#surec h2 span.acc-pl");
  return el ? { text: el.textContent, color: getComputedStyle(el).color } : null;
});
check(
  "site: Süreç vurgu fallback (accent yoksa son kelime mor)",
  Boolean(surecFb) && (surecFb?.text ?? "").trim() === "E2E" && surecFb?.color === "rgb(185, 160, 239)",
  JSON.stringify(surecFb),
);

await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const procCard2 = page.locator('[data-slot="card"]', { hasText: "Süreç" }).first();
await procCard2.getByLabel("Başlık").fill("Beş adımda, net bir yol.");
await procCard2.getByLabel("Vurgulu kelime").fill("net bir yol.");
await procCard2.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);

// Hakkımızda başlığı round-trip: admin > Ana Sayfa > Hakkımızda kartı → site #hakkimizda h2
const abCard = page.locator('[data-slot="card"]', { hasText: "Hakkımızda" }).first();
await abCard.getByLabel("Başlık").fill("Ajans ruhuyla, ölçülebilir sonuç E2E.");
await abCard.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const abH2 = await page.textContent("#hakkimizda h2");
check("site: Hakkımızda başlığı admin'den yayınlanıyor", (abH2 ?? "").includes("ölçülebilir sonuç E2E."), (abH2 ?? "yok").trim());
const abEm = await page.evaluate(() => {
  const el = document.querySelector("#hakkimizda h2 em");
  return el ? { text: el.textContent, color: getComputedStyle(el).color } : null;
});
check(
  "site: Hakkımızda vurgusu em mor (fallback son kelime)",
  Boolean(abEm) && (abEm?.text ?? "").includes("E2E") && abEm?.color === "rgb(185, 160, 239)",
  JSON.stringify(abEm),
);
await page.goto(BASE + "/admin/pages/home", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const abCard2 = page.locator('[data-slot="card"]', { hasText: "Hakkımızda" }).first();
await abCard2.getByLabel("Başlık").fill("Yaratıcılığı stratejiyle, stratejiyi ölçülebilir sonuçlarla birleştiriyoruz.");
await abCard2.getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(2500);

// Admin: "Vurgulu kelime" alanı artık tüm başlıklı bölümlerde görünüyor (hero hariç 7 kart)
const accentLabels = await page.locator('label:has-text("Vurgulu kelime")').count();
check("admin: Vurgulu kelime alanı 7 başlıklı bölümde", accentLabels === 7, `labels=${accentLabels}`);
const abAccentVal = await page
  .locator('[data-slot="card"]', { hasText: "Hakkımızda" })
  .first()
  .getByLabel("Vurgulu kelime")
  .inputValue();
check("admin: Hakkımızda vurgu alanı varsayılanla dolu", abAccentVal === "Yaratıcılığı stratejiyle,", abAccentVal);

// Statik menü: header VE footer'da Referanslarımız; kaydırma davranışı korunuyor
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

/* ---- 4c-2) VURGU TONLAMASI — koyu tema (11 vurgu, TEK TON) ---- */
const accDump = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).color : "yok";
  };
  return {
    hero2: pick("#top h1 .ln:nth-child(2) em"),
    hero3: pick("#top h1 .ln:nth-child(3) em"),
    hizmetler: pick("#hizmetler h2 span.acc-pl"),
    galeri: pick("#calismalar .wh1 h2 em.acc-pl"),
    istatistik: pick(".stb-title em"),
    referanslar: pick("#referanslar h2 em.acc-pl"),
    hakkimizda: pick("#hakkimizda h2 em"),
    surec: pick("#surec h2 span.acc-pl"),
    blog: pick("#blog-ozet h2 span.acc-pl"),
    iletisim: pick("#iletisim h2 span.acc-vivid"),
    partner: pick("#iletisim .ptn h3 em"),
  };
});
const accText = await page.evaluate(() => ({
  hero3: document.querySelector("#top h1 .ln:nth-child(3) em")?.textContent ?? "",
  about: document.querySelector("#hakkimizda h2 em")?.textContent ?? "",
}));
// TEK TON (kullanıcı talebi 13.11.2026): tüm vurgular aynı mor — koyu temada --pl,
// beyaz kart dahil açık zeminlerde --p. #9335ff / #58349d artık hiçbir yerde yok.
const MOR_ACIK = "rgb(185, 160, 239)";
const MOR_ANA = "rgb(130, 84, 216)";
check("vurgu: Hero satır2 'doğru' açık mor", accDump.hero2 === MOR_ACIK, accDump.hero2);
check("vurgu: Hero satır3 'stratejiyle başlar.' açık mor", accDump.hero3 === MOR_ACIK, accDump.hero3);
check("vurgu: Hero satır3 vurgu metni doğru", accText.hero3 === "stratejiyle başlar.", accText.hero3);
check("vurgu: Hizmetler 'tek çatı altında.' açık mor", accDump.hizmetler === MOR_ACIK, accDump.hizmetler);
check("vurgu: Galeri son kelime açık mor", accDump.galeri === MOR_ACIK, accDump.galeri);
check("vurgu: İstatistik açık mor (tek ton)", accDump.istatistik === MOR_ACIK, accDump.istatistik);
check("vurgu: Referanslar açık mor", accDump.referanslar === MOR_ACIK, accDump.referanslar);
check("vurgu: Hakkımızda açık mor", accDump.hakkimizda === MOR_ACIK, accDump.hakkimizda);
check("vurgu: Hakkımızda vurgu metni 'Yaratıcılığı stratejiyle,'", accText.about === "Yaratıcılığı stratejiyle,", accText.about);
check("vurgu: Süreç açık mor (tema duyarlı)", accDump.surec === MOR_ACIK, accDump.surec);
check("vurgu: Blog açık mor", accDump.blog === MOR_ACIK, accDump.blog);
check("vurgu: İletişim açık mor (tek ton)", accDump.iletisim === MOR_ACIK, accDump.iletisim);
check("vurgu: Partner kartı ana mor (beyaz zemin, tek ton)", accDump.partner === MOR_ANA, accDump.partner);

// Açık tema: tüm vurgular (beyaz kart dahil) ana mora döner (kontrast 4.6+)
await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
await page.waitForTimeout(400);
const accLight = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).color : "yok";
  };
  return {
    hizmetler: pick("#hizmetler h2 span.acc-pl"),
    surec: pick("#surec h2 span.acc-pl"),
    istatistik: pick(".stb-title em"),
    iletisim: pick("#iletisim h2 span.acc-vivid"),
  };
});
check("vurgu: açık temada Hizmetler ana mor", accLight.hizmetler === MOR_ANA, accLight.hizmetler);
check("vurgu: açık temada Süreç ana mor (soluk değil)", accLight.surec === MOR_ANA, accLight.surec);
check("vurgu: açık temada İstatistik ana mor", accLight.istatistik === MOR_ANA, accLight.istatistik);
check("vurgu: açık temada İletişim ana mor (tek ton)", accLight.iletisim === MOR_ANA, accLight.iletisim);
await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
await page.waitForTimeout(200);
const refLink = page.locator("header#hd nav.m a", { hasText: "Referanslarımız" });
check("header: Referanslarımız linki var (statik menü)", (await refLink.count()) === 1, "");
check("header: Referanslarımız href doğruden", (await refLink.getAttribute("href")) === "/#referanslar", "");
check("footer: Referanslarımız linki var", (await page.locator('footer a[href="/#referanslar"]').count()) === 1, "");
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
