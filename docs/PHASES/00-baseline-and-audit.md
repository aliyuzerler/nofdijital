# Faz 0 — Kaynak Analizi ve Görsel Baseline

## Amaç
Kaynak HTML'nin bütün görsel ve davranış envanterini çıkarmak; hiçbir UI kodunu yeniden tasarlamadan baseline test altyapısını kurmak.

## Yapılacaklar
1. `reference/nof_digital.html` ve `reference-assets/asset-manifest.json` incele.
2. Tüm section, header/footer, nav, breakpoint, font, renk, image, animation ve event davranışlarını envanterle.
3. 14 gallery item + logo eşlemesini manifest ile doğrula.
4. Blog 7 seed entry, 6 kategori, hizmet 7 kayıt ve süreç 5 adımını kaynak kodla eşleştir.
5. Referans HTML'yi statik local server ile aç; viewport screenshot seti al.
6. Pixel/visual regression için Playwright screenshot altyapısı oluştur.
7. Ürün kapsamı, veri modeli taslağı, ADR şablonu ve env gereksinimini hazırla.
8. Risk listesi oluştur: canvas/galeri kompozisyonu, Base64 assets, fonts, hash routing, generic sample blog content.

## Çıktılar
- `docs/reference-inventory.md`
- `tests/visual/baseline/` screenshot seti
- `docs/adr/0001-architecture.md`
- `docs/risk-register.md`

## Sınırlar
UI yeniden yazımı yok. Kaynak HTML değiştirilmez. Eksik görülen veri uydurulmaz; belirsizlik raporlanır.

## Tamamlanma
Faz 0 test dosyasındaki tüm maddeler PASS olmadan Faz 1'e geçme.
