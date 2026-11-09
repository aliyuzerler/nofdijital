# Faz 3 — PostgreSQL, Drizzle ve İçerik Taşıma

## Amaç
Public sayfanın sabit içeriklerini ilişkisel veritabanına taşı; public görünüm aynı kalırken veri kaynağı DB olsun.

## Yapılacaklar
1. `docs/03-DATA-MODEL.md` modelini Drizzle schema'ya dönüştür.
2. Foreign keys, unique indexes, check constraints ve safe deletion kur.
3. İlk migration ve idempotent seed oluştur.
4. Kaynak HTML'den servis 7, süreç 5, blog kategori 6, blog kartı 7 ve galeri 14 verisini import et.
5. Kaynak HTML'deki generic blog body metnini gerçek içerik gibi kabul etme; draft/needs review olarak işaretle.
6. Repository/service katmanı oluştur; public query yalnızca published içerik döndürsün.
7. Slugify, Turkish character handling, uniqueness ve redirect kayıtlarını test et.
8. Public page data adapter'ını fixture'dan DB'ye geçir; screenshot parity tekrar kontrol.

## Sınırlar
Admin editör yok; DB'deki içerik üzerinden public render çalışır.
