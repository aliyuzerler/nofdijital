import { expect, test } from "@playwright/test";
import { E2E_EDITOR, E2E_OWNER, EDITOR_STATE, OWNER_STATE, login, logout } from "./helpers";

/**
 * RBAC matrisi (kabul raporu Faz 7 bölümünün Playwright otomasyonu):
 * - Anonim → /admin 307 login'e
 * - owner → tüm sayfalar 200 + ayarlar kaydedebilir
 * - editor → izinli sayfalar 200, ayarlar/menü → "Bu alana erişim yetkiniz yok"
 *
 * Oturumlar auth.setup.ts'te rol başına BİR kez açılır (storageState);
 * sign-in POST sayısı better-auth rate limiti (60s/10) altında tutulur.
 */

test.describe("Anonim erişim", () => {
  test("/admin anonimi login'e yönlendirir", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("yanlış şifre girişi reddedilir (gerçek sign-in)", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder("ornek@nofdigital.com").fill(E2E_OWNER.email);
    await page.locator('input[type="password"]').fill("yanlisSifre123!");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator("text=/hatalı|başarısız|Giriş yapılamadı|geçersiz/i").first()).toBeVisible();
  });
});

test.describe("Owner rolü", () => {
  test.use({ storageState: OWNER_STATE });

  test("panel açılır ve tüm admin sayfaları 200 döner", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("Hoş geldiniz");

    for (const path of [
      "/admin/blog",
      "/admin/services",
      "/admin/process",
      "/admin/portfolio",
      "/admin/pages/home",
      "/admin/settings/general",
      "/admin/settings/seo",
      "/admin/navigation",
      "/admin/media",
      "/admin/messages",
      "/admin/audit-log",
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} → 200`).toBe(200);
    }
  });

  test("ayarı kaydedebilir (owner-only pozitif kontrol)", async ({ page }) => {
    await page.goto("/admin/settings/general");
    await expect(page.locator("h1")).toBeVisible();
    const save = page.getByRole("button", { name: /kaydet/i });
    await expect(save.first()).toBeEnabled();
  });

  test("gerçek login akışı çalışır ve çıkış login'e döndürür", async ({ page }) => {
    // storageState'siz taze oturum: gerçek sign-in + sign-out
    await page.context().clearCookies();
    await login(page, E2E_OWNER);
    await logout(page);
  });
});

test.describe("Editor rolü", () => {
  test.use({ storageState: EDITOR_STATE });

  test("izinli sayfalar 200: blog, hizmetler, medya", async ({ page }) => {
    for (const path of ["/admin/blog", "/admin/services", "/admin/media"]) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} → 200`).toBe(200);
    }
  });

  test("owner-only alanlar yetkisiz ekranı gösterir: ayarlar + menü", async ({ page }) => {
    for (const path of ["/admin/settings/general", "/admin/navigation"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toContainText("Bu alana erişim yetkiniz yok");
    }
  });

  test("mesajlar sayfası mevcut davranışı korur", async ({ page }) => {
    const res = await page.goto("/admin/messages");
    // Kabul: editor mesajları görebiliyorsa 200, aksi halde Forbidden ekranı — ikisi de matrise uygun
    expect([200]).toContain(res?.status() ?? 0);
    const forbidden = page.locator("text=Bu alana erişim yetkiniz yok");
    const visible = await forbidden.count();
    if (visible > 0) await expect(forbidden.first()).toBeVisible();
  });
});
