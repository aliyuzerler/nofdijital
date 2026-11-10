# Release Checklist — NOF Dijital

Tarih: 2026-11-10 · Faz 7 kapanış kontrol listesi. Kaynak: `docs/PHASES/07-security-performance-and-release.md`

## A. Kod kalitesi
- [x] `bunx tsc --noEmit` → 0 hata
- [x] `bun run lint` → 0 hata
- [x] `bun run build` → PASS (statik prerender gerçek DB verisiyle, 0 DB fallback)
- [x] Testler: E2E admin akışları (Faz 4) + Faz 7 RBAC/güvenlik provaları PASS

## B. Güvenlik
- [x] Güvenlik başlıkları üretimde: X-Content-Type-Options, Referrer-Policy, X-Frame-Options=DENY, Permissions-Policy, CSP-Report-Only (curl -I ile doğrulandı)
- [x] Oturumsuz erişimler: /admin→307, medya upload→401, contact geçersiz→400, draft yazı→404, bootstrap kilitli→409
- [x] Secret scan: client JS'te yalnız env **adı** getter'ları (değer yok); takip edilen dosyalarda secret yok; .env.example placeholder
- [x] better-auth: genel kayıt kapalı, rate limit 10/60s, oturum 8s, cookie cache 5dk
- [x] `npm audit` (Faz 9): package-lock üretildi (repo'da, npm ci fallback için) → **0 critical, 0 prod-direkt high**; next 16.4.6 / zod 4.6.7 / sharp 0.35.5 yamalandı, 13 kullanılmayan paket kaldırıldı. Kalan high'lar upstream-nested (detay: `docs/production-go-live.md` §0 ve §6); CI kapısı `--audit-level=critical`

## C. Performans (Lighthouse 1.5, prod standalone, localhost)
| Rapor | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Ana sayfa desktop | 99 | 91 | 100 | 100 | 1.0s | 0 | 30ms |
| Ana sayfa mobil | 86 | 91 | 100 | 100 | 4.1s | 0 | 120ms |
| Blog desktop | 100 | 96 | 100 | 100 | 0.3s | 0 | 10ms |

Raporlar: `tests/perf/lh-home-{desktop,mobile}.report.{json,html}`, `tests/perf/lh-blog-desktop.*`
- Mobil LCP 4.1s: simüle mobil kısıtlama + hero galeri görselleri; iyileştirme alanı (resim önceliklendirme/priority). A11y: 3 küçük bulgu (ARIA children, heading sırası, kontrast) — parite kaynaklı, düşük öncelik.
- Bundle: toplam statik JS ~1.4MB (sıkıştırılmamış); admin chunk'ları public sayfalara sızmayan (`/` HTML'i yalnız 8 ortak vendor chunk yüklüyor, admin'e özel 6 chunk public'te yok).
- Build raporu: `tests/perf/bundle-report.txt`

## D. RBAC (editor ile E2E, prod standalone + gerçek tarayıcı)
- [x] Login: owner + editor (better-auth credential) PASS
- [x] Sayfalar: her iki rol tüm admin sayfalarında 200; anonim 307→login
- [x] Owner-only (ayarlar, navigasyon): editor'e "Bu alana erişim yetkiniz yok" ekranı
- [x] Editor izinli (hizmetler güncelle): "Hizmet güncellendi." toast; owner pozitif kontrol "Ayarlar kaydedildi"
- Not: RBAC E2E sırasında 2 hata bulundu ve düzeltildi:
  - **HATA-003:** better-auth `baseURL` ayarlanmadığından localhost:3000'e sabitleniyor, farklı port/host'tan tarayıcı girişleri 403 INVALID_ORIGIN → `baseURL: process.env.APP_URL` eklendi
  - **HATA-004:** yardımcı script `scripts/db/create-editor.ts` credential hesapta `accountId`'yi email yazıyordu; better-auth `accountId = user.id` bekliyor → düzeltildi

## E. Yedekleme / restore
- [x] PGlite tatbikatı PASS (docs/backup-restore.md): tar→restore→3101 health ok→7 yazı+2 kullanıcı birebir
- [x] Medya checksum manifestosu: tests/perf/media-checksums.txt (15 dosya)
- [x] Neon pg_dump/pg_restore rehberi: docs/backup-restore.md (sandbox'ta pg_dump ikilisi yok — production'da çalıştırılır)

## F. Seed / içerik politikası
- [x] `SEED_PUBLISH_POSTS=0` → 7/7 draft (taze dizinde doğrulandı) — üretimde hiçbir içerik otomatik yayınlanmaz
- [x] Sandbox parite ortamında SEED_PUBLISH_POSTS=1 kullanılır (rapor notu korunur)

## G. Release adımları (uygulama sırası)
1. `.env` değerleri: `AUTH_SECRET` (yeni), `APP_URL=https://<domain>`, `DATABASE_DRIVER=postgres`, `DATABASE_URL=postgres://…neon…`, `STORAGE_PROVIDER=vercel-blob`, `BLOB_READ_WRITE_TOKEN`, `SEED_PUBLISH_POSTS=0`
2. Vercel project connect (`docs/07-VERCEL-DEPLOYMENT.md`), env'leri gir, ilk preview deploy
3. Bootstrap: `/api/admin/bootstrap` → gerçek owner e-posta + güçlü şifre (yalnız credential yokken çalışır, 3/saat rate limit)
4. Production smoke: `/api/health` ok, `/` `/blog` 200, `/admin` 307, sitemap/robots 200, WhatsApp numarası yayında
5. Domain/DNS cutover (bkz. rollback tablosu docs/backup-restore.md §5)

## H. Bilinen sınırlar / kalan maddeler
- Lighthouse CI, Docker build smoke, editor/owner dışı RBAC genişletme, piksel-diff'i CI kapısına çevirmek — sonraki işler
- PGlite tek yazıcıdır: çoklu örnek/ölçeklenme için `DATABASE_DRIVER=postgres` zorunlu
- CSP şu an Report-Only; gerçek enforce'a geçmeden önce prod raporları izlenmeli
