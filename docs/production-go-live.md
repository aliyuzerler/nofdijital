# Production Go-Live Rehberi — NOF DİJİTAL

> Faz 9 (2026-11-10) itibarıyla canlıya çıkış için sıralı adımlar. Strateji: `docs/07-VERCEL-DEPLOYMENT.md`,
> yedekleme: `docs/backup-restore.md`, testler: `docs/testing-guide.md`.

## 0) Bu oturumda tamamlanan üretim hazırlığı (kanıt kaydı)

| İş | Sonuç |
| --- | --- |
| Güvenlik temizliği (`scripts/db/prod-cleanup.ts`) | e2e test hesapları, geçici `.local` şifreli hesaplar, test iletişim kayıtları ve test yazıları silindi — DB'de yalnız site verisi + gerçek admin kaldı |
| Canlı admin | `admin@nofdigital.com` (owner) oluşturuldu; login 200, silinen test hesabı 401, bootstrap 409 kilitli |
| Bağımlılık güncellemeleri | next 16.1.1→16.4.6 (2 kritik GHSAX düzeltmesi), zod 4.0.2→4.6.7 (high), sharp 0.34.3→0.35.5 (libvips CVE'leri) |
| Kullanılmayan paketler kaldırıldı | prisma+@prisma/client (ölü katman `src/lib/db.ts`), next-auth (kritik GSA'lı, proje Better Auth kullanır), next-intl, @mdxeditor/editor, recharts(+ui/chart), react-markdown, react-syntax-highlighter, @reactuses/core, uuid, @tanstack/react-query, @dnd-kit/*, @hookform/resolvers, z-ai-web-dev-sdk — tsc/lint/E2E 20/20 ile regresyon kanıtlandı |
| npm audit | **0 critical / 0 prod-direkt high**; kalan high'lar upstream-nested (defu←better-auth, zod@4.1.11←@vercel/blob→cli-config, source-map-js←next→postcss) — upstream sürüm bekler, CI `--audit-level=critical` kapısı |
| package-lock.json | repo'ya eklendi (yalnız audit + Docker `npm ci` fallback'i için; runtime bun.lock'tur) |
| Docker/standalone smoke | Docker daemon yok — runner stage'in birebir eşleniği yerelde koşuldu: standalone (node server.js) health 200, home 200, /admin 307, admin login 200 (build `next@16.4.6`) |
| CI | `.github/workflows/ci.yml`: quality (lint+typecheck+audit critical gate) / Playwright E2E / Storybook test-runner |

## 1) Hedef ortam değişkenleri (.env örneği)

```
APP_URL=https://<sizin-domain>
DATABASE_DRIVER=postgres
DATABASE_URL=<Neon/Postgres connection string>
AUTH_SECRET=<openssl rand -hex 32 çıktısı>
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=<Vercel Blob token>
BLOB_PUBLIC_BASE_URL=<blob public URL>
SEED_PUBLISH_POSTS=0        # üretim varsayılanı: içerikler draft olarak açılır
```

- `AUTH_SECRET` kesinlikle yeniden üretin; repo'daki hiçbir değer kullanılmaz.
- PGlite yerine `DATABASE_DRIVER=postgres` zorunlu (sunucusuz tek-yazıcı kısıtı KISIT-001).

## 2) Dağıtım adımları (Vercel)

1. Repo'yu Vercel'e bağlayın; `bun install` + `bun run build` otomatik çalışır (standalone output).
2. Ortam değişkenlerini yukarıdaki gibi girin; ilk deploy'u yapın.
3. Veritabanı şeması: `bun run db:migrate:local` yerine Neon'a karşı migration (`docs/backup-restore.md` pg_restore bölümü + `drizzle/` klasörü).
4. İçerik: `SEED_PUBLISH_POSTS=0` ile seed koşulursa tüm yazılar **draft** açılır; admin panelinden tek tek yayınlayın (önerilen üretim akışı).

## 3) İlk owner hesabı (bootstrap)

Canlı DB'de şifreli hesap yokken tek seferlik:

```bash
curl -X POST https://<domain>/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"<gerçek-mail>","password":"<en-az-10-karakter>","name":"NOF Admin"}'
```

- Saat başına 3 deneme limiti var; ilk başarılı sonrası endpoint **kalıcı kilitlenir** (409).
- İkinci admin gerekirse: panelde owner oturumuyla ya da `bun run admin:create <mail> <şifre> <ad> owner` (DB'ye doğrudan erişebilen bir makinede).

## 4) Test hesapları / veri hijyeni kuralları

- `scripts/db/ensure-e2e-users.ts` **yalnızca geliştirme** içindir; production'da KOŞTURMAYIN (bilinen şifreli test hesapları yaratır).
- `bun run prod:cleanup` — e2e-* kullanıcıları, geçici şifreli `.local` hesapları, test iletişim kayıtları ve test yazılarını idempotent siler (sunucu kapalıyken).
- Canlıya çıkmadan önce kontrol: DB'de `email like 'e2e-%'` kullanıcı **olmamalı**; yalnız gerçek admin kalır.

## 5) Canlıya çıkış provaları

- [ ] `/api/health` → `{"ok":true,"db":"postgres","storage":"vercel-blob"}`
- [ ] `/` ve `/blog` 200; `/sitemap.xml` domain'i doğru; `/robots.txt` admin'i kapsıyor
- [ ] `/admin` anonim → 307; medya upload oturumsuz → 401; bootstrap → 409 (kilitli)
- [ ] Admin login (gerçek hesap) 200; yanlış şifre 401
- [ ] Contact form gerçek mail ile kayıt düşüyor (panelde görünür)
- [ ] `docs/backup-restore.md` 1. yedek alındı (tar/pg_dump + sha256)
- [ ] GitHub Actions CI yeşil (lint/typecheck/audit + E2E 20 + Storybook 12)

## 6) Bilinen bekleyenler (upstream/makine işi)

- `defu` (better-auth), `zod@4.1.11` (@vercel/blob→cli-config), `source-map-js` (next→postcss) — upstream sürüm sonrası `bun update` yeterli.
- Gerçek Docker build smoke: daemon'lı makinede `docker build -f infra/Dockerfile .` (runner stage birebir koşumu yerelde kanıtlandı).
- Lighthouse CI: deploy sonrası gerçek domain'e karşı koşulmalı (lokal ölçüm: tests/perf/, desktop 99/mobil 86).
