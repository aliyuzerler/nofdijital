# 00 — Ürün Tanımı ve Kabul Kriterleri

## Ürün amacı
Mevcut `nof_digital.html` prototipini görsel olarak aynı kalan, gerçek veri kullanan, SEO uyumlu URL'lere sahip, admin panelinden yönetilebilen NOF DİJİTAL kurumsal web sitesine dönüştür.

## Kesin kapsam
### Ziyaretçi tarafı
- Ana sayfa ve kaynak HTML'de var olan tüm bölümler.
- Hizmetler kartları ve hizmet seçimiyle iletişim formuna geçiş.
- Çalışmalar/stüdyo duvarı galerisi, lightbox, önce/sonra veya carousel davranışı kaynak dosyada mevcutsa aynen korunması.
- Hakkımızda ve beş adımlı çalışma süreci.
- Blog özet alanı, blog arşivi, kategori filtreleme, arama, öne çıkan yazı ve sayfalama.
- SEO uyumlu blog detay sayfası.
- İletişim formu, WhatsApp bağlantısı, telefon/e-posta ve sosyal ağ bağlantıları.
- Mobil menü, scroll/reveal animasyonları, sayaçlar ve azaltılmış hareket tercihi.

### Admin tarafı
- Güvenli admin oturumu ve çıkış.
- Dashboard: toplam/yayındaki/taslak yazılar, medya sayısı ve okunmamış mesajlar.
- Blog: oluşturma, düzenleme, taslak, yayınla, yayından kaldır, planla, sil, önizleme.
- Blog editörü: başlık, slug, spot, kategori, etiket, kapak, gövde içi görsel, alt text, SEO başlık/açıklama, canonical, sosyal görsel.
- Medya kütüphanesi: yükleme, arama, filtre, önizleme, alt text, başlık, kopyalanabilir URL, kullanım ilişkileri, güvenli silme.
- Ana sayfa: her bölümün başlık, açıklama, CTA, görünürlük ve sıralamasını yönetme.
- Hizmetler, süreç adımları, galeri/çalışmalar, navigasyon ve footer yönetimi.
- Site ayarları: logo, favicon, marka adı, telefon, WhatsApp, e-posta, sosyal medya, adres, çalışma saatleri.
- İletişim mesajları: listeleme, okundu durumu, arşivleme/silme.
- SEO: global varsayılanlar, sayfa bazlı metadata, sitemap ve robots yönetim mantığı.
- Önizleme ve yayın geçmişi / denetlenebilir içerik revizyonu.

## Kaynak HTML'den doğrulanan içerik yapısı
- Sayfa dili: `tr`.
- Başlık: `NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama`.
- Meta açıklama: sosyal medya yönetimi, Google & Meta Ads, fotoğraf, video ve prodüksiyon hizmetleri.
- Font: Bricolage Grotesque (başlık) ve DM Sans (gövde).
- Renk tokenları: `#8254D8`, `#58349D`, `#B9A0EF`, `#FFFFFF`, `#F7F6FA`, `#15131B`, `#211D28`, `#77717F`.
- Ana içerik genişliği: CSS'te `min(1320px, 100% - 48px)`.
- Responsive eşikler: `1024px`, `700px`; ayrıca `prefers-reduced-motion: reduce`.
- Ana sayfa bölümleri: `top` (hero), `hizmetler`, `calismalar`, `hakkimizda`, `surec`, `blog-ozet`, `iletisim`.
- Ek görünümler: blog arşivi (`v-blog`) ve blog detayı (`v-post`).
- Hizmet sayısı: 7. Örnekler: Sosyal Medya Yönetimi, Google Ads Reklam Yönetimi, Meta Ads Reklam Yönetimi, Profesyonel Fotoğraf Çekimi, Video Çekimi, Prodüksiyon Hizmeti, Reklam Performans Analizi.
- Süreç adımları: Analiz, Strateji, Üretim, Yayınlama, Optimizasyon.
- Blog kategorileri: Sosyal Medya, Google Ads, Meta Ads, Prodüksiyon, İçerik Stratejileri, Dijital Pazarlama.
- Kaynak HTML içinde 7 örnek blog yazısı bulunur; bunlar örnek/prototip içerikler olarak içeri aktarılabilir, taslak/yayın durumları ayrıca onaylanmalıdır.
- Galeri: `A.imgs` içinde 14 görsel, `A.logo` içinde logo ve `CAP` içinde 14 başlık. Tam sıra `reference-assets/asset-manifest.json` dosyasındadır.
- İletişim formu alanları: ad soyad, e-posta, telefon, ilgilenilen hizmet, mesaj.
- WhatsApp numarası kaynak dosyada boş placeholder'dır; admin ayarından girilecek.

## Görsel kabul kriteri (P0)
- Kaynak HTML ve uygulama aynı viewport boyutlarında karşılaştırılmalıdır: 1440×900, 1366×768, 1024×768, 768×1024, 390×844 ve 360×800.
- Hero, header, hizmet kartları, galeri, hakkımızda, süreç, blog özeti, iletişim ve footer ölçü/renk/tipografi eşleşmesi kontrol edilir.
- Görsellerin dosyası, sırası, kırpımı, object-position ve alt metin davranışı eşleştirilir.
- Galeri algoritması/kompozisyonu ve animasyon davranışı korunur; deterministik seed kullanarak testlerde kararlı hale getirilir.
- Blog liste ve detay sayfalarında mevcut görünüm aynı kalır; yalnızca hash URL yerine gerçek slug URL kullanılır.
- Görsel farklılık toleransı: ilk kabulde kritik alanlarda layout shift/yanlış renk/yanlış asset sıfır; piksel karşılaştırmasında anti-aliasing kaynaklı küçük farklar dışında hedef fark oranı `%1.5` altında. Otomatik ölçümün yanı sıra manuel göz kontrolü zorunludur.

## Yayın kabul kriterleri
- İçerik admin panelinden değişince public sayfada doğru biçimde görünür.
- Taslaklar ve admin ekranları anonim kullanıcıya kapalıdır.
- Admin değişiklikleri validasyon, audit kaydı ve cache invalidation ile uygulanır.
- Vercel Preview ve Production ortamları ayrıdır.
- Docker ile self-hosted build çalışır; Vercel'e özgü olmayan Node.js runtime kullanılır.
- Veritabanı yedekleme ve medya dışa aktarma/taşıma prosedürü belgelenir.
