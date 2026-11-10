import { expect, test } from "@playwright/test";

/**
 * Public site smoke testleri — brief gereksinimleri:
 * 7 hizmet kartı, tema düğmesi, blog listesi/detay, sitemap/robots, contact API doğrulaması.
 * NOT: /api/contact IP başına dakikada 5 istek hız limitine sahiptir (docs/05) —
 * bu dosyada en fazla 2 POST yapılır; testler workers:1 ile sıralı koşar.
 */

test.describe("Ana sayfa", () => {
  test("hero + 7 hizmet kartı + header/footer render", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();

    // Brief: 7 hizmet kartı (data-sv etiketli .card.lg öğeleri)
    await expect(page.locator("#hizmetler .sv .card[data-sv]")).toHaveCount(7);

    // Header nav + footer
    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.locator("footer").first()).toBeVisible();
  });

  test("tema düğmesi karanlık/açık arasında geçer (DEV-001)", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initial = await html.getAttribute("data-theme");
    const toggle = page.locator('[aria-label*="ema" i], [title*="ema" i]').first();
    await toggle.click();
    const after = await html.getAttribute("data-theme");
    expect(after).not.toBe(initial);
    // localStorage tercihi kalıcı
    const stored = await page.evaluate(() => localStorage.getItem("nof-theme"));
    expect(stored).toBeTruthy();
    // yeniden yüklemede korunur
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", stored!);
  });

  test("referanslar: 2 şerit simetrik marquee + footer bağlantısı", async ({ page }) => {
    await page.goto("/");
    const refs = page.locator("#referanslar");
    await expect(refs).toBeVisible();
    // Brief: iki şerit, biri sağdan sola biri soldan sağa
    await expect(refs.locator(".rfg-row")).toHaveCount(2);
    await expect(refs.locator(".rfg-row.rev")).toHaveCount(1);
    // 15 benzersiz logo × 2 (döngü kopyası)
    await expect(refs.locator(".rfg-chip img")).toHaveCount(30);
    // yönlendirme: header "Referanslarımız" → /#referanslar
    await expect(page.locator('nav.m a[href="/#referanslar"]')).toBeVisible();
    // yönlendirme: footer "Referanslarımız" → /#referanslar
    await expect(page.locator('footer a[href="/#referanslar"]')).toBeVisible();
    await page.locator('footer a[href="/#referanslar"]').click();
    await expect(page).toHaveURL(/\/#referanslar$/);
  });
});

test.describe("Blog", () => {
  test("blog listesi published yazıları listeler", async ({ page }) => {
    await page.goto("/blog");
    const res = page.url();
    expect(res).toContain("/blog");
    await expect(page.locator("main")).toBeVisible();
    // seed ile en az 1 published yazı mevcut
    const cards = page.locator("a.pc, .pc");
    await expect(cards.first()).toBeVisible();
  });
});

test.describe("Sitemap ve robots", () => {
  test("sitemap.xml blog URL'lerini içerir", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/blog/");
  });

  test("robots.txt 200 ve sitemap işaretli", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Sitemap");
    expect(body).toContain("/admin");
  });
});

test.describe("Health", () => {
  test("/api/health db bağlantılı ok döner", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});

test.describe("Contact API", () => {
  const validPayload = {
    name: "E2E Test Kişisi",
    email: "e2e-contact@nofdigital.local",
    message: "Playwright E2E koşumundan gönderilen otomatik iletişim mesajı.",
  };

  test("geçerli gönderim kabul edilir", async ({ request }) => {
    const res = await request.post("/api/contact", { data: validPayload });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  test("geçersiz gönderim 400 döner (mesaj <10 karakter)", async ({ request }) => {
    const res = await request.post("/api/contact", { data: { ...validPayload, message: "kısa" } });
    expect(res.status()).toBe(400);
  });
});

test.describe("Güvenlik provaları", () => {
  test("admin rotası anonime 307 ile login'e yönlendirir", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
