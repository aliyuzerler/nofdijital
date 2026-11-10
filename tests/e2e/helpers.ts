import { expect, type Page } from "@playwright/test";

/** E2E kullanıcıları: scripts/db/ensure-e2e-users.ts ile kurulur (lokal, seed şifreleri). */
export const E2E_OWNER = { email: "e2e-owner@nofdigital.local", password: "OwnerE2E123!", name: "E2E Owner" };
export const E2E_EDITOR = { email: "e2e-editor@nofdigital.local", password: "EditorE2E123!", name: "E2E Editor" };

/** Rol başına kaydedilmiş oturum state'leri (auth.setup.ts üretir). */
export const OWNER_STATE = "tests/e2e/.auth/owner.json";
export const EDITOR_STATE = "tests/e2e/.auth/editor.json";

/** Admin giriş akışı; başarılıysa /admin paneline yönlendirilir. */
export async function login(page: Page, user: { email: string; password: string }, target = "/admin") {
  await page.goto("/admin/login");
  await page.getByPlaceholder("ornek@nofdigital.com").fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 15_000 });
}

/** Chrome'daki Çıkış yap düğmesi. */
export async function logout(page: Page) {
  await page.getByRole("button", { name: "Çıkış yap" }).click();
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15_000 });
}
