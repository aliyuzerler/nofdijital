# Test Rehberi — Playwright E2E + Storybook

> Faz 8 (2026-11-10) itibarıyla test otomasyonunun nasıl koşulduğu, hangi ortam gereksinimleri
> olduğu ve bilinen tuzaklar bu rehberde toplandı. Strateji bağlamı: `docs/08-TEST-STRATEGY.md`.

## 1. Playwright E2E

### Gereksinimler
- Node/bun ortamı; `@playwright/test@1.57` chromium-1200'i `~/.cache/ms-playwright` altından bulur
  (yeni makinede: `bunx playwright install chromium`).
- **KISIT-001:** PGlite tek yazıcıdır. E2E kullanıcı kurulumundan önce 3000/3100 portlarında çalışan
  bir dev/standalone sunucu OLMAMALIDIR (aksi halde `db/pgdata` kilidi çakışır).
- `.env` mevcut olmalı (`AUTH_SECRET`, `APP_URL=http://localhost:3000`, `DATABASE_DRIVER=pglite`).

### Adımlar
```bash
# 1) Çalışan sunucuyu kapat (dev/standalone) — PGlite kilidi serbest kalsın
# 2) E2E kullanıcılarını idempotent kur (owner + editor)
bun run test:e2e:setup
# 3) Koşum: playwright webServer olarak `bun run dev`'i kendi başlatır/kapatır
bun run test:e2e
# (rapor: bun run test:e2e:report → tests/e2e/report)
```

### Tasarım kararları
- **workers:1** — seed verisi paylaşımlı ve tek-yazıcı DB; sıralı koşum deterministik.
- **Setup project + storageState** (`tests/e2e/auth.setup.ts`) — rol başına bir kez sign-in; her test
  cookie'li context'le başlar. Sebep: better-auth `rateLimit` 60s/10 (BULGU-001, kabul raporu Faz 8).
- **Toast overlay** — admin üstbilgi aksiyonları sağ üstte; sonner bildirimleri tıklamayı kesebilir.
  Blog testi publish/silme işlemini blog tablosunun satır menüsünden yapar (BULGU-002).
- **Blog listesi markup'ı** — en yeni yazı "öne çıkan" kartta (`a.ft`), diğerleri `a.pc` (BULGU-003).

### Test kapsamı
| Dosya | Test | Kapsam |
| --- | --- | --- |
| `tests/e2e/public.spec.ts` | 9 | ana sayfa/7 hizmet, tema kalıcılığı, blog listesi, sitemap, robots, health, contact API, anonim yönlendirme |
| `tests/e2e/admin-rbac.spec.ts` | 8 | RBAC matrisi: anonim, yanlış şifre, owner 11 sayfa + ayar, login/logout, editor izin/403 |
| `tests/e2e/admin-blog.spec.ts` | 1 | blog CRUD: draft→404, publish→200+listed, delete→404 |

CI notu: `CI=1` iken webServer yeniden kullanılmaz (`reuseExistingServer: false`), retry 1, HTML rapor
`tests/e2e/report` klasörüne yazılır. Artifacts (`tests/e2e/.artifacts`, `.auth`, report) gitignoredur —
`.auth` oturum cookie içerir.

## 2. Storybook

### Gereksinimler
- `storybook@9` + `@storybook/nextjs-vite`; Tailwind v4 `.storybook/main.ts` içindeki `viteFinal`
  üzerinden `@tailwindcss/vite` ile işlenir; `public/` statik dizin olarak bağlanır; global dekoratör
  `data-theme` toolbar'ı (Koyu/Açık) ve `IconSprite` yükler.

### Komutlar
```bash
bun run storybook          # dev: http://localhost:6006
bun run build:storybook    # production build → storybook-static/ (gitignored)
bun run test:storybook     # test-runner: dev/build server'a karşı stories testleri
# ayrıntılı: bunx test-runner --url http://127.0.0.1:6006 --index-json
```

### Stories ve play testleri
| Grup | Story | Etkileşim testi |
| --- | --- | --- |
| UI/Temel Bileşenler | Button (9 varyant), Badge, Card, Switch, Alert | buton tıklaması, input typing, switch toggle |
| Site/Bölümler | Hizmet kartları (7), PostCard | kart sayısı == 7 (brief), link href |
| Site/Etkileşim | Tema düğmesi, WhatsApp ×2 | data-theme+localStorage çevrimi, toast uyarısı (ToastHost story içinde mount) |
| Admin/Yetkisiz | 403 ekranı ×2 | başlık + rol metni görünürlüğü |

Test-runner notu: ortam `within(canvasElement)` kullanır; test-runner'ın testing-library sürümünde
`getByPlaceholder` bulunmaz — label eşleşmesi (`getByLabelText`) tercih edilir. Portal/body'e bağlanan
bileşenler (ör. `ToastHost`) story render ağacına açıkça eklenmelidir.

## 3. Statik kalite kapıları
```bash
bun run lint        # eslint . → 0
bun run typecheck   # tsc --noEmit → 0
```
Her iki komut da stories/tests dahil tüm projeyi kapsar; Faz 8 sonunda ikisi de temiz.
