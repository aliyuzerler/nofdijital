import { expect, test } from "@playwright/test";
import { E2E_OWNER, OWNER_STATE } from "./helpers";

/**
 * Blog CRUD uçtan uca akışı (kabul raporu Faz 4-6 E2E'sinin Playwright otomasyonu):
 * create → draft 404 → publish 200+listed → delete 404. Audit kayıtları /admin/audit-log'da.
 * Sonuna kadar temiz bırakır: yazı sildikten sonra test biter.
 *
 * NOT: Kaydet/Yayınla düğmeleri sayfanın sağ üst köşesindedir; sonner bildirimleri
 * (top-right) tam oraya düşer ve tıklamayı keser. Bu yüzden yayınlama/silme işlemleri
 * blog tablosunun SATIR MENÜSÜNDEN yapılır; öncesinde varsa bildirim kapatılır.
 */

const STAMP = Date.now();
const TITLE = `E2E Smoke Yazı ${STAMP}`;
const SLUG = `e2e-smoke-${STAMP}`;
const EXCERPT = "Playwright otomasyon koşumunda oluşturulan geçici smoke yazısı.";

test.use({ storageState: OWNER_STATE });

/** varsa sonner bildirimini tıklayıp kapatır (dismissible=true) */
async function dismissToast(page: import("@playwright/test").Page) {
  const toast = page.locator("[data-sonner-toast]");
  try {
    await toast.first().click({ timeout: 3_000 });
    await toast.first().waitFor({ state: "hidden", timeout: 5_000 });
  } catch {
    // bildirim yoksa sorun değil
  }
}

test("blog CRUD: draft→publish→listed→delete", async ({ page }) => {
  // Oturum auth.setup.ts'te açıldı (storageState) — panel doğrudan açılır
  await page.goto("/admin/blog");
  await expect(page.getByRole("link", { name: "Yeni Yazı" })).toBeVisible();

  // 1) Yeni yazı oluştur (draft) — kaydet düğmesine tıklanana dek toast oluşmaz
  await page.goto("/admin/blog/new");
  await page.locator("#title").fill(TITLE);
  await page.locator("#slug").fill(SLUG);
  await page.locator("#excerpt").fill(EXCERPT);
  const body = page.locator('[aria-label="Yazı gövdesi"]');
  await body.click();
  await page.keyboard.type("E2E smoke gövde metni. Bu içerik test sonunda silinir.");
  await page.getByRole("button", { name: "Taslak olarak kaydet" }).click();

  // Düzenleme sayfasına yönlendirilir
  await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f-]+$/, { timeout: 20_000 });
  await expect(page.locator("text=Durum: Taslak")).toBeVisible();

  // 2) Draft public'te 404
  const draftRes = await page.request.get(`/blog/${SLUG}`);
  expect(draftRes.status()).toBe(404);

  // 3) Yayınlama — tablo satır menüsünden (toast alanından uzak)
  await page.goto("/admin/blog");
  await dismissToast(page);
  await page.getByLabel(`${TITLE} için işlemler`).click();
  await page.getByRole("menuitem", { name: "Yayınla" }).click();
  await dismissToast(page);

  // 4) Public 200 + başlık görünür
  const pubRes = await page.request.get(`/blog/${SLUG}`);
  expect(pubRes.status()).toBe(200);
  const pubHtml = await pubRes.text();
  expect(pubHtml).toContain(TITLE);

  await page.goto("/blog");
  // En yeni yazı "öne çıkan" kartında (a.ft), diğerleri PostCard'da (a.pc) — ortak href seçicisi
  await expect(page.locator(`[href="/blog/${SLUG}"]`)).toBeVisible();

  // 5) Sil (satır menüsü → onay diyaloğu)
  await page.goto("/admin/blog");
  await dismissToast(page);
  await page.getByLabel(`${TITLE} için işlemler`).click();
  await page.getByRole("menuitem", { name: "Sil" }).click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('[role="dialog"]')).toContainText("geri alınamaz");
  await page.locator('[role="dialog"] button:has-text("Sil")').click();
  await expect(page.locator(`text=${TITLE}`)).toHaveCount(0, { timeout: 20_000 });

  // 6) Public 404 (soft delete)
  const delRes = await page.request.get(`/blog/${SLUG}`);
  expect(delRes.status()).toBe(404);
});
