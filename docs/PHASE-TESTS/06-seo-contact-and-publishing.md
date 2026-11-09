# Faz 6 Testi — SEO ve İletişim

- [ ] Blog detay URL'si `/blog/[slug]` ve HTTP status 200/404 doğru.
- [ ] Slug canonical, SEO title/description ve OG image doğru.
- [ ] Sitemap sadece yayınlanmış sayfaları/yazıları içeriyor.
- [ ] robots.txt admin route'larını disallow ediyor; public blog crawlable.
- [ ] Draft route public cache veya sitemap'e sızmıyor.
- [ ] Slug değişikliği eski URL için redirect üretiyor.
- [ ] Search/category/page server-side ve URL/share behavior net.
- [ ] Contact form invalid e-mail/required alanları reddediyor.
- [ ] Rate limit/honeypot çalışıyor; spam public error ile ifşa edilmiyor.
- [ ] Contact submission DB'ye kaydoluyor ve admin inbox'ta görünüyor.
- [ ] UTC storage ve Europe/Istanbul display test edildi.
- [ ] JSON-LD yalnızca doğrulanmış iş verileriyle üretiliyor.

**PASS koşulu:** SEO crawler checks + form E2E + privacy review PASS.
