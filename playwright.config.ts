import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E yapılandırması.
 * - Sunucu: webServer olarak `bun run dev` (3000 portu) — /api/health hazır olunca testler başlar.
 * - KISIT-001: PGlite tek yazıcıdır. webServer dışında çalışan bir dev/standalone
 *   örneği varsa önce kapatın (aksi halde ikisi aynı db/pgdata'yı açamaz).
 * - Kullanıcı kurulumu sunucu KAPALIYKEN yapılır: `bun scripts/db/ensure-e2e-users.ts`
 *   (npm scripti: `test:e2e:setup`). webServer ayağa kalkmadan önce koşulmalı.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "tests/e2e/.artifacts",
  // Paylaşılan seed verisi + tek-yazıcı DB: sıralı koşum
  fullyParallel: false,
  workers: process.env.CI ? 1 : 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "tests/e2e/report" }]] : [["list"]],
  use: {
    baseURL,
    locale: "tr-TR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Oturum state'ini rol başına bir kez açar (better-auth rate limit: 60s/10)
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "bun run dev",
    url: `${baseURL}/api/health`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
