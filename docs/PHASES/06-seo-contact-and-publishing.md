# Faz 6 — SEO, İletişim ve Yayın İş Akışı

## Amaç
Gerçek SEO URL'leri, metadata, sitemap, iletişim formu ve yayın iş akışını tamamla.

## Yapılacaklar
1. `/blog/[slug]` server-rendered detail; slug canonical ve 404.
2. Metadata API; title/description/canonical/Open Graph/Twitter image.
3. `sitemap.xml` published pages + published blog posts; `robots.txt` admin disallow.
4. Blog category archive; search + pagination server side.
5. Slug redirects tablosu ve redirect handler.
6. Contact form server-side Zod validation, honeypot/rate limit; DB kaydı.
7. Admin messages inbox, read/archive.
8. Publish/schedule workflow; timezone display Europe/Istanbul; timestamps UTC.
9. Revalidate blog/home/sitemap cache after publish/update.
10. Broken links, metadata, structured data (Organization/Article only when factual data available) tests.

## Sınırlar
Fake business contact details, reviews, addresses or stats invent edilmez; placeholder'lar admin settings'te açıkça boş kalır.
