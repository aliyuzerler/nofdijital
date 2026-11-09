# 01 — Tasarım Sadakati ve Arayüz Port Rehberi

## Altın kural
`reference/nof_digital.html` dosyası tasarım şartnamesidir. Bu dosyayı bir “ilham” olarak değil, port edilecek mevcut ürünün kendisi olarak kabul et. Birebir görünüm sağlanmadan tasarım sistemini yeniden yorumlama.

## Tokenlar
```css
:root {
  --p: #8254D8;
  --pd: #58349D;
  --pl: #B9A0EF;
  --w: #FFFFFF;
  --bg: #F7F6FA;
  --dk: #15131B;
  --tx: #211D28;
  --mu: #77717F;
  --ln: rgba(33, 29, 40, .12);
  --fd: 'Bricolage Grotesque', 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  --fb: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  --e: cubic-bezier(.2,.7,.2,1);
}
```

## Tipografi ve yerleşim
- Display/başlık: Bricolage Grotesque; gövde ve kontroller: DM Sans.
- `font-smoothing: antialiased` ve kaynak dosyadaki font ağırlıkları korunmalı.
- İçerik konteyneri: `width: min(1320px, 100% - 48px)`.
- Dikey section padding kaynakta `clamp(80px, 11vw, 160px)` yaklaşımıyla tanımlı; birebir CSS değerlerini kaynak HTML'den taşı.
- Header, hero, koyu/açık section geçişleri, border alpha değerleri, radius, shadow, letter spacing ve line-height değerleri kaynak CSS'den alınmalıdır. Tahmin ederek yeniden yazma.

## Bölüm eşleştirme
1. `#top`: hero; canvas arka plan ve hareketli dekoratif/ışık katmanı. Görsel arka plan karakteri ve metin yerleşimi aynı kalmalı.
2. `#hizmetler`: light yüzey ve 7 kart. Kart sırası, ikonları, hover/focus ve CTA yönlendirmesi korunmalı.
3. `#calismalar`: koyu/görsel çalışma alanı; 14 fotoğraf, caption listesi, algoritmik yerleşim, lightbox ve navigasyon.
4. `#hakkimizda`: white yüzey; başlık, açıklama, Yaratıcılık/Strateji/Ölçüm metinleri ve performans paneli görseli.
5. `#surec`: dark yüzey; beş adım ve sayaç/reveal davranışı.
6. `#blog-ozet`: light yüzey; başlık ve son yazılar kartları.
7. `#iletisim`: dark yüzey; iletişim bilgileri, sosyal bağlantılar ve form.
8. Blog arşivi/detay: kaynak dosyanın `.pg`, `.tb`, `.pc`, `.feat`, `.pst` vb. sınıflarını referans al.

## Davranış parity
- Mobil hamburger menüsü aç/kapa ve `aria-expanded`.
- Header aktif durumları ve nav linkleri.
- Hizmet kartına tıklayınca seçilen hizmetin iletişim formunda seçili gelmesi.
- Galeri yerleşimi, drag/scroll kontrolleri ve lightbox aç/kapat/önceki/sonraki/esc davranışı.
- IntersectionObserver reveal ve sayaç animasyonları.
- `prefers-reduced-motion` desteklenmeli.
- Blog kategori filtreleme, arama, sayfalama ve yazı detayına geçiş.
- Browser Back/Forward düzgün çalışmalı.

## Görsel port yöntemi
1. Referans HTML'yi lokal `file://` veya statik server ile açıp baseline screenshot seti oluştur.
2. React/Next portunu yalnızca sabit içerikle oluştur.
3. Aynı viewport ekran görüntülerini al.
4. Büyük blok geometri, font, renk, görsel/crop, scroll yüksekliği ve mobil taşma farklarını düzelt.
5. Parite onaylandıktan sonra içeriği veritabanından besle.
6. Admin'de yönetilebilir alanların tasarım karşılığını koru; yeni metinler uzun olduğunda overflow ve layout testlerini yap.

## Görsel varlıklar
- Kaynak HTML'de gömülü Base64 varlıklar `reference-assets/` dizinine çıkarılmıştır.
- `asset-manifest.json` içindeki sıra, caption ve aspect ratio korunmalıdır.
- Dosyaları sıkıştırma/yeniden encode işlemi yalnızca görsel fark ve kalite onayıyla yapılır.
- Galeri `alt` metinleri ve crop konumları veri modelinde tutulmalı.
