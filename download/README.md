# NOF DİJİTAL — Tasarım Prototipi

**Dosya:** `nof-dijital-demo.html` — çift tıklayıp tarayıcıda açın; kurulum gerekmez (CSS/JS/görseller gömülü).

## Tema Sistemi (koyu / açık)
- Header'ın sağındaki **ay / güneş düğmesi** temayı değiştirir (masaüstü ve mobilde aynı yerde).
- Seçim **localStorage'da** (`nof-theme`) saklanır: sayfayı yenileseniz bile aynı tema ile açılır.
- Varsayılan tema: **açık**. Site artık kaydırırken beyaz↔koyu geçiş yapmaz; tüm sayfa tek temada kalır.
- Canvas arka planı (parçacıklar, halkalar, kareler) seçilen temanın renklerine uyar; bölüm bazlı sahne değişimi (kamera lensi, çerçeveler, zaman çizgisi…) scroll davranışı olarak korunur.
- `prefers-reduced-motion` açıkken tema geçişi animasyonsuz uygulanır.

## Kontroller
- Menü: Ana Sayfa / Hizmetler / Çalışmalarımız / Hakkımızda / Blog / İletişim (hash tabanlı; geri-ileri tuşları çalışır).
- Çalışmalarımız: scroll ile yatay akan 7'li sahneler; karta tıklayınca lightbox (←/→, ESC, dokunmatik kaydırma).
- Blog: arşiv filtreleri, arama, sayfalama, yazı detayı.
- WhatsApp düğmesi: `CFG.whatsappNumber` (app içinde) boş olduğu için uyarı gösterir; numara girildiğinde wa.me açar.

## Notlar
- İletişim formu ve sosyal bağlantılar temsilidir; hiçbir veri gönderilmez.
- İletişim bilgilerindeki telefon/e-posta örnek amaçlıdır.
- Test edilen genişlikler: 1440 / 1280 / 1024 / 390 / 360 px — konsol hatası yok, yatay taşma yok.
