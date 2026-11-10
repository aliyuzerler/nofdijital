import { expect, test as setup } from "@playwright/test";
import { E2E_EDITOR, E2E_OWNER } from "./helpers";

/**
 * Rol başına oturum state'i bir kez açar (storageState).
 * Neden: better-auth rateLimit (60s / 10 istek) — her testte gerçek sign-in POST
 * atmak limiti aşar ve "E-posta veya şifre hatalı" ile aralıklı hatalar üretir.
 */
const AUTH_DIR = "tests/e2e/.auth";

setup("owner oturumu kaydet", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder("ornek@nofdigital.com").fill(E2E_OWNER.email);
  await page.locator('input[type="password"]').fill(E2E_OWNER.password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("h1")).toContainText("Hoş geldiniz", { timeout: 15_000 });
  await page.context().storageState({ path: `${AUTH_DIR}/owner.json` });
});

setup("editor oturumu kaydet", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder("ornek@nofdigital.com").fill(E2E_EDITOR.email);
  await page.locator('input[type="password"]').fill(E2E_EDITOR.password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("h1")).toContainText("Hoş geldiniz", { timeout: 15_000 });
  await page.context().storageState({ path: `${AUTH_DIR}/editor.json` });
});
