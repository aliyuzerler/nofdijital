# Faz Testi Çalıştırma Promptları

## Genel kural
Testleri çalıştırmadan PASS deme. Bir test ortamı veya secret yoksa `BLOCKED` olarak raporla; test atlandıysa nedenini belirt.

## Promptlar
- **Faz 0:** Kaynak referans dosyasının hash ve asset-manifest eşleşmesini doğrula; tüm içerik/section/breakpoint envanterini checklist'e göre kontrol et. Sadece kanıtla PASS ver.
- **Faz 1:** Lint, typecheck, unit, build, DB connect, migration dry run, StorageProvider test, admin guard smoke, Docker build/run çalıştır. Komut ve exit code raporla.
- **Faz 2:** Playwright ile 6 viewport'ta reference ve local app screenshot üret; section bazlı karşılaştırma raporu çıkar. Responsive, font, crop, canvas, galeri, lightbox, reduced-motion davranışlarını manuel + otomatik kontrol et.
- **Faz 3:** Fresh database migration/seed; idempotency; count/relationship; slug unique; draft leakage; DB query logs; screenshot parity. Kanıt ve satır sayılarını raporla.
- **Faz 4:** Anonymous/owner/editor role matrix; CRUD lifecycle; draft preview; MIME spoof, oversized file, SVG, path traversal, token leak, XSS payload; media in-use delete. E2E trace ekle.
- **Faz 5:** Admin'den her section içeriğini değiştir; public render güncellendiğini doğrula. Boş, uzun, Türkçe karakterli metin, mobil taşma, missing asset, reorder ve visibility senaryoları.
- **Faz 6:** Crawler kontrolleri, metadata/canonical, sitemap, robots, redirects, published/draft, contact spam/validation, timezone. Public route status'larını raporla.
- **Faz 7:** Security audit; secret scan; dependency scan; Lighthouse CI; Core Web Vitals; bundle analysis; DB backup/restore; media checksum export; Docker and Vercel smoke. Critical/High issue tablosu ve release recommendation üret.
