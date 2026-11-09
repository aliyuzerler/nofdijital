# MASTER PROMPT — NOF DİJİTAL'İ GERÇEK WEB SİTESİNE DÖNÜŞTÜR

Sen bu projede kıdemli bir full-stack ürün mühendisisin. Proje klasöründeki `reference/nof_digital.html` mevcut NOF DİJİTAL web sitesinin onaylanmış tasarım ve davranış kaynağıdır. İlk hedefin mevcut arayüzün ekranda **aynı görünmesini** sağlamaktır. Bu dosya ilham değil, birebir port edilecek referanstır.

## Kesin ürün hedefi
Bu HTML'yi Vercel'de yayınlanacak; admin paneli, PostgreSQL veritabanı, medya kütüphanesi, gerçek blog sistemi, SEO uyumlu URL'ler ve ana sayfanın tamamını yönetme kabiliyeti olan gerçek bir web uygulamasına dönüştür. İleride kendi VPS/Docker sunucuma taşınabileceği için Vercel'e özel servislere iş mantığı düzeyinde kilitlenme.

## Kaynak HTML'den korunacak ekranlar
- Ana sayfa: hero, hizmetler, çalışmalar/galeri, hakkımızda, beş adımlı süreç, son yazılar, iletişim ve footer.
- Blog arşivi: öne çıkan yazı, kategori filtreleri, arama, sayfalama.
- Blog detay sayfası.
- Responsive header/mobile menu, gallery lightbox, scroll/reveal/counter, reduced-motion.

Kaynak tokenlar: Bricolage Grotesque + DM Sans; `#8254D8`, `#58349D`, `#B9A0EF`, `#F7F6FA`, `#15131B`, `#211D28`, `#77717F`; content width max 1320px; CSS media breakpoints 1024px ve 700px. Kaynak CSS'nin daha ayrıntılı ölçüleri tahmin edilmemeli; HTML'den aynen alınmalı.

Kaynakta 7 hizmet, 5 süreç adımı, 6 blog kategorisi, 7 blog kartı, 14 galeri fotoğrafı ve 1 logo vardır. `reference-assets/asset-manifest.json` ve görsellerin sırası referans alınmalıdır. Örnek blog gövdeleri şablon/prototip içeriktir; gerçek ve doğrulanmış içerik olarak yayınlama, taslak/review durumuyla seed et.

## Mimari
- Next.js App Router, React, TypeScript strict.
- Neon PostgreSQL + Drizzle ORM.
- Vercel Blob başlangıç medya provider'ı; `StorageProvider` adapter arayüzüyle soyutla.
- Admin için güncel uyumlu bir auth kütüphanesi; genel kayıt kapalı; owner/editor RBAC.
- Tiptap JSON editor + allowlisted rendering/sanitization.
- Playwright E2E, Vitest unit/integration, screenshot visual regression.
- Dockerfile `output: standalone`, non-root image; local Postgres + MinIO opsiyonlu compose.
- Vercel deploy Preview/Production ayrı env; Neon runtime pooled connection, migrations için unpooled connection.

## Admin'de yönetilecekler
Blog yazıları (CRUD, draft, preview, schedule, publish), kategoriler, etiketler, kapak ve içerik görselleri, medya kütüphanesi, homepage tüm metin/görsel/CTA/bölüm görünürlüğü ve sırası, hizmetler, galeri, süreç adımları, navigasyon/footer, logo, telefon, WhatsApp, e-posta, sosyal linkler, SEO metadata, iletişim mesajları, yayın revizyonları ve audit log.

## Zorunlu güvenlik
- Her server action/route handler server-side authentication + authorization yapar.
- Admin route'larını sadece client-side hide ederek koruma.
- Input Zod; SQL Drizzle parametreleri; rich text sanitize.
- Upload allowlisted raster MIME + magic byte + size + dimensions; SVG/HTML kapalı.
- Blob token ve DB credentials asla `NEXT_PUBLIC_` değil.
- Rate limit login/contact/upload; CSRF, XSS, IDOR, open redirect, path traversal kontrolü.
- Security headers/CSP; secrets/logs korunur.
- Draft/public separation ve media ownership/reference check.

## Performans
Server Components default; admin editor lazy/isolated; next/image; responsive assets; lazy gallery; bundle analyze; DB indexes/pagination; targeted revalidation; reduced motion; canvas and gallery profiling. Hedef CWV: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 (75th percentile), ölçüp raporla.

## Görsel kabul
Referans ve uygulama aynı viewportlarda screenshot karşılaştırması: 1440×900, 1366×768, 1024×768, 768×1024, 390×844, 360×800. Hero ve her section; font, renk, spacing, crop, height, mobile overflow ve interaction parity. Önce static React port ile parity; ancak onaylandıktan sonra DB'den besle. Tasarımı yeniden tasarlama.

## Geliştirme protokolü
`docs/PHASES/` sırasıyla 0–7 fazları uygula. Her fazdan sonra karşılık gelen `docs/PHASE-TESTS/` checklist'ini çalıştır. Faz testleri PASS değilse sonraki faza geçme. Başarısız test sonucu uydurma veya saklama.

Her yanıtta:
1. Hedef ve mevcut fazı belirt.
2. Önce mevcut repo yapısını incele; var olan çalışan kodu silmeden plan yap.
3. Küçük ve test edilebilir değişiklikler yap.
4. Değişen dosyaları ve komut sonuçlarını raporla.
5. Bilinmeyen gerçek işletme verisini uydurma; placeholder olarak bırak.
6. Secrets isteme veya çıktılama.

İlk görev: Faz 0'ı gerçekleştir. Sadece envanter, risk listesi, screenshot baseline ve ADR hazırla; Faz 0 testlerini PASS etmeden kod mimarisini/arayüzü değiştirme.
