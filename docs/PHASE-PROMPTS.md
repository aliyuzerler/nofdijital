# Faz Başlatma Promptları

Aşağıdaki promptlardan yalnızca sıradaki fazı kullan. Faz testleri PASS olmadan diğerine geçme.

## Faz 0
`docs/PHASES/00-baseline-and-audit.md` dosyasını eksiksiz uygula. Kaynak HTML ve asset'leri değiştirme. Section/DOM/CSS/JS davranış envanteri, örnek içerik veri listesi, responsive baseline screenshotları, risk register ve ADR oluştur. `docs/PHASE-TESTS/00-baseline-and-audit.md` maddelerini çalıştır, PASS/FAIL raporu ver. Hiçbir UI kodunu yeniden yazma.

## Faz 1
`docs/PHASES/01-foundation-and-infrastructure.md` dosyasını uygula. Next.js, TS strict, test/lint/CI, Drizzle+Neon bağlantısı, StorageProvider abstraction, auth facade, `.env.example`, Docker standalone ve local service compose kur. Secrets ekleme. Test dosyası 01'i çalıştır ve tüm komut sonuçlarını raporla.

## Faz 2
`docs/PHASES/02-visual-parity-port.md` dosyasını uygula. Önce static content ile HTML'nin birebir Next.js portunu üret. CSS değerlerini kaynaktan taşı; yeniden tasarlama. Galeri algoritması ve Base64 görseller yerine çıkartılmış asset'leri manifest sırasıyla kullan. Tüm viewport screenshotlarını kıyasla. Test 02 PASS olmadan DB'ye geçme.

## Faz 3
`docs/PHASES/03-database-and-content-model.md` dosyasını uygula. Drizzle schema ve migration üret. Kaynak 7 service, 5 process, 6 category, 7 post, 14 gallery item seed et. Prototip blog body'leri taslak/review olarak işaretle. Public sorguda draft çıkmadığını kanıtla. Test 03 ve visual parity çalıştır.

## Faz 4
`docs/PHASES/04-admin-cms-and-media.md` dosyasını uygula. Secure admin auth/RBAC, blog CRUD, Tiptap, preview, media library, Vercel Blob adapter ve audit/revisions geliştir. Anonymous/editor/owner kontrolleri ile upload abuse/XSS testlerini yap. Test 04 PASS.

## Faz 5
`docs/PHASES/05-homepage-and-site-settings.md` dosyasını uygula. Ana sayfa bölümleri, hizmetler, galeri, süreç, about, navigation/footer ve iletişim ayarlarını admin'den yönetilebilir yap. Sabit renderer ve tasarım tokenları korunmalı. Test 05 ve viewport screenshot regression PASS.

## Faz 6
`docs/PHASES/06-seo-contact-and-publishing.md` dosyasını uygula. Gerçek `/blog/[slug]`, metadata/canonical/OG, sitemap/robots, redirect, contact submission, publish/schedule, timezone ve cache invalidation geliştir. Test 06 PASS.

## Faz 7
`docs/PHASES/07-security-performance-and-release.md` dosyasını uygula. Güvenlik audit, performance budget, Lighthouse, bundle analysis, Docker smoke, Vercel preview/production release, backup/restore ve media export kontrolünü tamamla. Test 07 PASS olmadan production release önerme.
