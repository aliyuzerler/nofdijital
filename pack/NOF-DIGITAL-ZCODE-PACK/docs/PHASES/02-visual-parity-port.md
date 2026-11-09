# Faz 2 — Tasarımın Birebir Next.js Portu

## Amaç
Kaynak HTML'nin public arayüzünü React/Next bileşenlerine taşı; henüz CMS entegrasyonu yapmadan görsel parite sağla.

## Yapılacaklar
1. Design tokenları ve font yükleme stratejisini oluştur.
2. Header/navigation, hero, services, gallery, about, process, blog preview, contact ve footer bileşenlerini kaynak CSS ve DOM davranışına göre çıkar.
3. CSS class/selector değerlerini taşırken kaynak ölçüleri koru; gerekmedikçe Tailwind ile yeniden tasarlama.
4. Kaynak 14 gallery imajını manifest sırasıyla import et; crop/object position eşleştir.
5. Canvas background, gallery placement algoritması, lightbox, scroll/reveal, counter, reduced-motion davranışlarını port et.
6. Blog archive/detail'ı geçici fixture data ile gerçek path yapısına port et (`/blog`, `/blog/[slug]`).
7. 1440, 1366, 1024, 768, 390, 360 viewport screenshotlarını referansla karşılaştır.
8. Farkları görsel rapor olarak kaydet; kabul kriterleri sağlanmadan CMS'e geçme.

## Önemli
Tasarımı güzelleştirme veya bileşenleri başka stile çevirme. Source of truth HTML'dir.
