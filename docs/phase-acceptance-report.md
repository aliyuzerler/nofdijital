# Faz Kabul Raporu — 2026-11-10 (oturum: ADMIN-BUILD)

Kaynak: `pack/NOF-DIGITAL-ZCODE-PACK` · Referans SHA doğrulandı (`d21d1c18…`).
Komutlar: `bun run lint` (0 error), `bunx tsc --noEmit` (0 error), `curl` rota provaları, Agent Browser E2E.

## Faz 0 — Kaynak Analizi ve Baseline — PASS
- [x] Hash hesaplandı, referans değişmedi (REFERENCE-HASH eşleşti).
- [x] asset-manifest.json: logo + 14 görsel doğrulandı.
- [x] Caption/aspect ratio 14 ile eşleşti (13×~0.667 + 1×1.5).
- [x] 7 section ID envanterde (docs/reference-inventory.md).
- [x] Blog arşiv/detay ayrı görünümler → gerçek rotalar (/blog, /blog/[slug], DEV-002).
- [x] 7 yazı, 6 kategori, 7 hizmet, 5 süreç envantere işlendi.
- [x] Breakpoint'ler 1024/700 + reduced-motion CSS'e taşındı.
- [x] Baseline screenshot seti: tests/visual/baseline/ (15 dosya, 6 viewport + durumlar).
- [x] Placeholder iletişim bilgileri uydurulmadı ("eklenecek" aynen korundu).
- [x] Belirsizler risk-register.md'de.

## Faz 1 — Altyapı — PASS
- Next.js 16 App Router + TS strict (`tsc --noEmit` 0 error).
- Drizzle + PGlite (sandbox) / postgres.js (Neon) adapter — ADR 0001.
- StorageProvider: local (aktif) + vercel-blob (token'la aktif) + s3 stub.
- Better Auth facade; genel kayıt kapalı; rate limit; 8s session.
- /api/health 200 `{"ok":true,"db":"pglite"}`.
- .env.example, infra/Dockerfile (standalone, non-root), infra/compose.yaml.

## Faz 2 — Görsel Parite — PASS (2 onaylı sapma ile)
- [x] Header/hero/hizmetler/galeri/about/süreç/blog/iletişim/footer birebir port.
- [x] Canvas arka plan motoru satır bazında TS portu; tab-görünürlük duraklatma eklendi.
- [x] Galeri: placeScene + AABB + seed determinizmi korundu; 3 sahne × 7 benzersiz.
- [x] Lightbox (klavye+swipe), reveal/counter, reduced-motion.
- [x] 6 viewport screenshot seti alındı; 1440 hero/başlık/font/renk referansla eşleşti.
- DEV-001 (kullanıcı talebi): tek tutarlı tema + header/mobil menü tema düğmesi; localStorage kalıcı; FOUC head script. Her iki temada screenshot alındı.
- DEV-004: kaynakta ölü kod olan sayaç (0N) animasyonu etkinleştirildi.
- Fark notu: screenshot'larda piksel düzeyi otomatik karşılaştırma yapılmadı (araç yok); manuel göz kontrolü + yapısal parite. Lighthouse ölçümü bu oturumda yapılmadı.

## Faz 3 — DB ve İçerik — PASS
- [x] Migration 0000+0001 fresh PGlite'a uygulandı.
- [x] Seed 2 kez koştu → duplicate yok (unique indexler sonrası).
- [x] 7 hizmet / 5 süreç / 6 kategori / 7 yazı / 14 galeri / 15 medya / 7 section / 6 nav.
- [x] Galeri media ilişkileri manifest sırasıyla aynı.
- Blog gövdeleri: şablon içerik — SEED_PUBLISH_POSTS=0 → draft; sandbox'ta parite için 1 (yazı içinde ".nt prototip" notu korunur). Rapor: bilinçli tercih, production'da 0 olmalı.
- [x] Türkçe slugify (auto "e2e-test-yazisi-admin-akisi" doğrulandı).
- [x] Public query yalnız published; draft 404 (E2E kanıtlandı).
- Admin listesi taslak/yayın ayrımı yapar (durum sekmeleri).

## Faz 4/5/6 — Admin + SEO — PASS (MVP kapsamı)
- Login/logout (Better Auth): E2E giriş başarılı; /admin anonime 307→/admin/login.
- Dashboard metrikleri: 7 yazı / 7 yayında / 15 medya / 0 okunmamış (canlı doğrulandı).
- Blog CRUD: create→draft 404→publish→200+listed→delete→404 (tam E2E PASS); audit log kayıtları düştü.
- Tiptap editör: starter-kit + link + image; H1/iframe/script kapalı (konfigürasyon).
- Medya: sahte MIME red ✓, 11 MB red ✓, checksum dedup ✓, oturumsuz red ✓.
- Ana sayfa bölüm editörü: 7 bölüm + görünürlük; form DB'den okuyor.
- Hizmetler/süreç/portfolyo/menü/mesajlar/audit-log sayfaları mevcut.
- Genel ayarlar: WhatsApp numarası → public butona yayıldı (E2E ✓).
- SEO: sitemap.xml 200, robots.txt 200 (admin/api disallow), /blog/[slug] metadata + canonical/OG.
- İletişim: Zod + honeypot + rate limit + DB kaydı; geçersiz istek 400 ✓; mesaj admin inbox'ta ✓.
- ROL NOTU: editor rolü ayrımı kod seviyesinde (requireRole) mevcut; ayrı editor kullanıcısıyla E2E koşulmadı (yalnız owner test edildi).
- BUILD NOTU: `bun run build` bu oturumda koşulmadı (dev sunucusu 3000'i meşgul tutuyor; build ayrı oturumda doğrulanmalı). Docker build sandbox'ta denenmedi (Docker yok).

## Bilinen eksikler / sonraki adımlar
1. ~~`bun run build` + `bun run start` (standalone) doğrulaması.~~ → **Faz 7'de tamamlandı.**
2. ~~Lighthouse/CWV ölçümü ve bundle analizi.~~ → **Faz 7'de tamamlandı (aşağıda).**
3. ~~Editor kullanıcısıyla RBAC matris E2E'si.~~ → **Faz 7'de tamamlandı (aşağıda).**
4. ~~Görsel piksel-diff otomasyonu.~~ → **Faz 7'de tamamlandı (pixelmatch, aşağıda).**
5. Production'da SEED_PUBLISH_POSTS=0 (doğrulandı) + gerçek admin şifresi bootstrap (production kurulumunda yapılır).
6. ~~Veritabanı yedekleme/restore tatbikatı belgesi.~~ → **Faz 7'de tamamlandı (docs/backup-restore.md).**
7. `npm audit` (package-lock gerektirir) + Docker build smoke + Lighthouse CI — production makine işleri.

## Faz 7 — Build ve Release Doğrulaması — PASS (2026-11-10, oturum: REPO-PUSH)

- [x] `bunx tsc --noEmit` → 0 error; `bun run lint` → 0 error.
- [x] `bun run build` → PASS. pgdata sağlıklıyken statik prerender gerçek DB içeriğini okudu (DB fallback uyarısı yok).
- [x] Standalone (`bun .next/standalone/server.js`, PORT=3100) → `/api/health` `{"ok":true,"db":"pglite"}`; `/`, `/blog` 200; `/admin` 307→login; sitemap/robots 200; ana sayfa HTML'i dev ile birebir (hero metni `<span class="ln">` satır sarmalayıcılarıyla bölünür — test artefaktıdır).
- **HATA-001 (düzeltildi):** Next standalone sunucusu `process.chdir()` ile `.next/standalone` içine geçiyor; göreli `PGLITE_DATA_DIR` yanlış çözümleniyordu → `src/server/db/index.ts` proje kökünü `.next/standalone` son ekine göre geri hesaplıyor; mutlak yol verilirse aynen kullanılıyor.
- **HATA-002 (düzeltildi):** Sandbox'lar arası zorla kapatma sonrası `db/pgdata` bozuldu ("PGlite failed to initialize properly") → migration+seed idempotent akışla taze kuruldu.
- **KISIT-001 (bilinen):** PGlite tek yazıcıdır — dev (3000) ve standalone (3100) aynı `db/pgdata` dizinini EŞ ZAMANLI açamaz; ikinci başlayan "select 1" hatası verir. Production'da tek süreç/tek dizin kuralı geçerlidir; çoklu örnek için `DATABASE_DRIVER=postgres` kullanılmalıdır.
- [x] Sağlık rotası teşhis log'u güçlendirildi (cause/cwd/driver/dataDir — istemciye sızmaz, docs/05 uyumlu).
- [x] Repo yayına hazır: `.env` + `db/` git geçmişinden temizlendi (filter-branch), `.env.example` eklendi, `main` → `github.com/aliyuzerler/nofdijital` pushlandı.

## Faz 7 — Ölçüm, Güvenlik, RBAC, Yedekleme, Piksel-Diff — PASS (2026-11-10, oturum: FAZ7)

Detaylı tablolar ve kanıtlar: `docs/release-checklist.md`, `docs/backup-restore.md`, `tests/perf/`, `tests/visual/diff/report.md`.

### Performans (Lighthouse 1.5 — prod standalone, localhost)
- Ana sayfa desktop: **99/100** (LCP 1.0s, CLS 0, TBT 30ms); mobil: **86/100** (LCP 4.1s simüle kısıtlama, CLS 0); blog desktop: **100/100** (LCP 0.3s). A11y 91-96, BP 100, SEO 100.
- A11y küçük bulgular: ARIA children, heading sırası, kontrast (parite kaynaklı, düşük öncelik).
- Bundle: statik JS ~1.4MB; admin chunk'ları public sayfaya sızmayan (8 ortak vendor chunk, admin'e özel 6 chunk yalnız admin'de).

### Güvenlik provaları (prod standalone)
- [x] Başlıklar: X-Content-Type-Options, Referrer-Policy, X-Frame-Options=DENY, Permissions-Policy, CSP-Report-Only — curl -I ile doğrulandı.
- [x] /admin anonim→307; medya upload oturumsuz→401; contact geçersiz→400; draft yazı→404; bootstrap kilitli→409.
- [x] Secret scan: client JS'te env ADI getter'ları hariç secret yok; takip edilen dosyalar temiz.
- [ ] `npm audit` — sandbox'ta package-lock üretilemedi (bun.lock); production işi olarak kaldı.

### RBAC E2E (editor + owner, gerçek tarayıcı akışı)
- [x] Owner/editor login (better-auth credential) PASS; sayfalar: iki rol de tüm admin sayfalarında 200, anonim 307.
- [x] Owner-only action'lar: ayarlar + navigasyon editörde "Bu alana erişim yetkiniz yok" ekranı; owner pozitif kontrol "Ayarlar kaydedildi ve siteye yansıtıldı.".
- [x] Editor izinli action: hizmet güncelleme → "Hizmet güncellendi." (test düzenlemesi sonrasında geri alındı).
- **HATA-003 (düzeltildi):** better-auth `baseURL` tanımlanmamış → localhost:3000 fallback'i; farklı port/host'tan tarayıcı istekleri 403 INVALID_ORIGIN → `src/server/auth/index.ts`'e `baseURL: process.env.APP_URL` eklendi (production domain için de zorunlu).
- **HATA-004 (düzeltildi):** `scripts/db/create-editor.ts` credential `accountId`'yi email yazıyordu; better-auth `accountId = user.id` bekler → düzeltildi (better-auth kaynak satır kanıtı: api/routes/sign-in.mjs:318).

### Yedekleme/restore tatbikatı — PASS
- tar (4.8MB, sha256 kayıtlı) → `/tmp/restore-pgdata` → 3101'de standalone → health ok + 7 published yazı + 2 kullanıcı birebir; medya 15 dosya sha256 manifestosu (`tests/perf/media-checksums.txt`). Rehber: `docs/backup-restore.md` (Neon pg_dump/pg_restore + rollback tablosu dahil).

### SEED_PUBLISH_POSTS=0 doğrulaması — PASS
- Taze dizinde migrate+seed → 7/7 draft, 0 published; üretim varsayılanı güvenli.

### Piksel-diff otomasyonu — araç PASS
- `scripts/visual-diff.mjs` (pixelmatch+pngjs): 13 çift karşılaştırıldı, diff PNG'leri + rapor `tests/visual/diff/`. Statik bölümler referansa yakın (iletişim %7.1, süreç %12.7); galeri/hero yüksek fark randomizasyon+canvas'tan (beklenen, bilgilendirme amaçlı — CI kapısı değil). 8 çiftte referans karşılık yok (dark/light/mobil durumlar).
- Dev notu: bu oturumda sandbox şablon temizliği `db/` ve `.env`'i sıfırladı; DB yeniden kuruldu (migrate+seed idempotent akış 3. kez kanıtlandı), `.env` restore edildi, owner+editor hesapları `scripts/db/create-editor.ts` ile oluşturuldu.

## Faz 8 — Test Otomasyonu: Playwright E2E + Storybook — PASS (2026-11-10, oturum: TEST-AUTOMATION)

### Playwright E2E — 20/20 PASS
- Kurulum: `@playwright/test@1.57` (chromium-1200 önbellekten, indirme gerekmedi). `playwright.config.ts`: webServer `bun run dev` (3000), `/api/health` hazırlık kapısı, workers:1 (PGlite tek-yazıcı + paylaşılan seed), trace retain-on-failure.
- Kullanıcı kurulumu: `scripts/db/ensure-e2e-users.ts` (idempotent; `e2e-owner@nofdigital.local` / `e2e-editor@nofdigital.local`, sunucu KAPALIYKEN çalışır → `bun run test:e2e:setup`).
- Oturum yönetimi: `tests/e2e/auth.setup.ts` setup project rol başına **bir kez** sign-in açıp `storageState` yazar; testler cookie'li context'lerle başlar.
- Kapsam (`tests/e2e/`):
  - `public.spec.ts` (9 test): ana sayfa + **7 hizmet kartı**, tema düğmesi kalıcılığı (data-theme + localStorage), blog listesi, sitemap.xml blog URL'leri, robots.txt /admin koruması, /api/health, contact API pozitif+400, /admin anonim→307.
  - `admin-rbac.spec.ts` (8 test): RBAC matrisi otomasyonu (Faz 7 manuel E2E'nin kalıcı hali) — anonim yönlendirme, **yanlış şifre reddi (gerçek sign-in)**, owner 11 admin sayfası 200 + ayar kaydetme, gerçek login/logout akışı, editor izinli 3 sayfa 200, editor'e ayarlar+menüde "Bu alana erişim yetkiniz yok".
  - `admin-blog.spec.ts` (1 test): blog CRUD uçtan uca — create(draft) → public 404 → publish(satır menüsü) → public 200 + listede (öne çıkan `a.ft` kartı dahil) → delete(onay diyaloğu) → public 404.
- Koşum kanıtı: `bunx playwright test` → **20 passed (1.3m)**; `bunx tsc --noEmit` 0, `eslint .` 0.

### Storybook — 12/12 PASS (SB 9.1 + nextjs-vite)
- Kurulum: `storybook@9`, `@storybook/nextjs-vite`, `@tailwindcss/vite` (viteFinal ile Tailwind v4), `staticDirs: public/`; global dekoratör `data-theme` toolbar'ı (Koyu/Açık) + `IconSprite`.
- Stories (`src/stories/`, 12 story): UI/Temel Bileşenler (Button varyantları, Badge, Card, Switch, Alert + play testleri), Site/Bölümler (7 hizmet kartı sayımı, PostCard link), Site/Etkileşim (tema düğmesi play: data-theme+localStorage çevrimi; WhatsApp pozitif + numarasız→toast uyarısı), Admin/Yetkisiz Ekranı (editor 403 + rolü olmayan).
- Doğrulama: `storybook dev --ci --smoke-test` exit 0; `bunx storybook build` exit 0 (1.77s); `bunx test-storybook --index-json` → **12 passed, 12 total** (test-runner playwright 1.57, aynı chromium-1200).

### Koşumda görülen bulgular (test tasarımı kayıtları; ürün kodu değişikliği gerekmedi)
- **BULGU-001 (dikkat):** better-auth `rateLimit` 60s/10 — E2E gibi çok sayıda sign-in üreten koşumlar limiti aşabilir; çözüm setup-project + storageState (koşum başına 4 auth isteği). Production davranışı bilinçli ve doğru.
- **BULGU-002 (UX notu):** admin üstbilgi aksiyon düğmeleri (Kaydet/Yayınla) sağ üst köşede; sonner bildirimleri aynı köşeye düşer ve fare üzerinde beklerken tıklamayı kesebilir. Test akışı bildirimden etkilenmeyen satır menüsüne taşındı; insan kullanıcada bildirim ~4s'de kendiliğinden kapanır. Gelecek iyileştirme: bildirim konumu/buton altına düşme.
- **BULGU-003 (test düzeltmesi):** blog listesinde en yeni yazı "öne çıkan" kartta (`a.ft`) render ediliyor — liste seçicisi `a.pc` yerine ortak href seçicisi oldu.

### Komutlar (repo kökü)
- `bun run test:e2e:setup` → E2E kullanıcıları (sunucu kapalıyken)
- `bun run test:e2e` → Playwright koşumu (webServer'ı kendisi yönetir)
- `bun run storybook` / `bun run build:storybook` / `bun run test:storybook`
- Rehber: `docs/testing-guide.md`
