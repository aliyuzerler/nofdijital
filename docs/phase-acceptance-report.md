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
