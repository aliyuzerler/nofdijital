# NOF DİJİTAL — Geliştirme Paketi

Bu paket, `reference/nof_digital.html` dosyasını **tek ve kesin görsel kaynak (golden reference)** kabul ederek gerçek, yönetilebilir ve taşınabilir bir web uygulamasına dönüştürmek için hazırlanmıştır.

## İlk önce okunacaklar
1. `AGENTS.md` — her görevde uyulacak proje kuralları.
2. `docs/00-PROJECT-BRIEF.md` — ürün kapsamı ve kabul ölçütleri.
3. `docs/01-DESIGN-FIDELITY.md` — mevcut arayüzün birebir korunması.
4. `docs/02-ARCHITECTURE.md` — Vercel ve taşınabilir mimari.
5. `docs/PHASES/` — geliştirme sırası.
6. `docs/PHASE-TESTS/` — faz tamamlanmadan çalıştırılacak testler.

## En önemli kural
Önce görünümü koru, sonra içerikleri dinamikleştir. Tasarımı yeniden yorumlama, sadeleştirme veya modernleştirme. Kaynak HTML'de bulunmayan yeni bir görsel dil üretme. Her görsel değişiklikte referans HTML ile aynı ekran boyutunda karşılaştırma yap.

## Başlangıç
- Bu paketi yeni Git deposunun köküne çıkar.
- `reference/nof_digital.html` dosyasını değiştirmeden sakla.
- `reference-assets/` içindeki çıkarılmış görselleri `asset-manifest.json` sırasıyla eşleştir.
- `AGENTS.md` ve ilgili skill dosyalarını araca tanıt.
- Faz 0'ı bitirmeden uygulama geliştirmeye başlama.

## Hedef teknoloji
Next.js App Router + TypeScript + PostgreSQL (Neon) + Drizzle ORM + Vercel Blob adapter + admin kimlik doğrulama kütüphanesi + Docker.

## Önemli
Bu bir başlangıç ve talimat paketidir; tamamlanmış web uygulaması değildir. Gerçek uygulama kodu, veritabanı tabloları ve canlı ortam bağlantıları fazlar sırasında geliştirilecektir. Hiçbir gerçek gizli anahtar bu pakete konulmamıştır.
