/* ============ NOF DİJİTAL — İçerik Verisi (prototip) ============ */
window.__NOF_DATA__ = (() => {

  /* Galeri projeleri (21 görsel) */
  const PROJECTS = {
    g01: { t: 'Aroma Skincare — Ürün Serisi', c: 'Ürün Çekimi' },
    g02: { t: 'Vela — Sezon Kampanyası',       c: 'Moda Çekimi' },
    g03: { t: 'Le Petit — Menü İçerikleri',    c: 'Gastronomi' },
    g04: { t: 'Kinetik — Sneaker Lansmanı',    c: 'Ürün Çekimi' },
    g05: { t: 'Mavi Dere — Marka İçeriği',     c: 'Gastronomi' },
    g06: { t: 'Perde Arkası: Reklam Filmi',    c: 'Prodüksiyon' },
    g07: { t: 'Nord — Kurumsal Portreler',     c: 'Portre' },
    g08: { t: 'Aurum — Makro Seri',            c: 'Ürün Çekimi' },
    g09: { t: 'Glaze — Doku Çalışması',        c: 'Kampanya' },
    g10: { t: 'Vertex — Mekân Çekimi',         c: 'Mekân' },
    g11: { t: 'Sonar — Lansman Görselleri',    c: 'Ürün Çekimi' },
    g12: { t: 'Umami — Menü Tanıtımı',         c: 'Gastronomi' },
    g13: { t: 'Rota — Lookbook',               c: 'Moda Çekimi' },
    g14: { t: 'Noir — Kampanya Görselleri',    c: 'Kampanya' },
    g15: { t: 'Stüdyo Günü',                   c: 'Prodüksiyon' },
    g16: { t: 'Marka Atölyesi',                c: 'Ajans' },
    g17: { t: 'Content Day — Sosyal Medya',    c: 'Sosyal Medya' },
    g18: { t: 'Paketle — Ambalaj Serisi',      c: 'Marka Kimliği' },
    g19: { t: 'Forma — Fitness Serisi',        c: 'Kampanya' },
    g20: { t: 'Tatlı Ritüel — Patisserie',     c: 'Gastronomi' },
    g21: { t: 'Optik Nova — Ürün Serisi',      c: 'Ürün Çekimi' },
  };

  /* Sahneler: her sahnede 7 farklı görsel */
  const SCENES = [
    ['g01', 'g04', 'g08', 'g11', 'g14', 'g18', 'g21'], // Ürün & Kampanya
    ['g06', 'g15', 'g16', 'g02', 'g13', 'g19', 'g07'], // Prodüksiyon & İnsan
    ['g03', 'g05', 'g12', 'g20', 'g09', 'g10', 'g17'], // Marka Dünyaları
  ];

  /* Blog yazıları (prototip içerik) */
  const POSTS = [
    {
      slug: 'sosyal-medya-algoritmalari-2026', img: 'b01', cat: 'Sosyal Medya',
      date: '28 Ekim 2026', read: '8 dk',
      t: '2026\u2019da Sosyal Medya Algoritmaları: Neler Değişti, Neler Geçerli?',
      ex: 'Kaydırma süresi mi, kaydetme mi? Algoritmaların önceliğini yeniden düzenlediği bu yıl markaların ilk yarım saniyede kazanması gerekiyor.',
      body: `
<p>Bu yıl platformların ortak mesajı net: içerik, ilk yarım saniyede dikkat yakalamıyororsa görülmüyor. Algoritmalar artık yalnızca beğeni sayısına değil; <strong>kaydetme, paylaşım ve tamamlama oranı</strong> gibi "kullanıcının kasıtlı tercihi" sinyallerine çok daha yüksek ağırlık veriyor.</p>
<h2>Kaydetme, yeni beğeni</h2>
<p>Rehber niteliğindeki içerikler — tarifler, check-list\u2019ler, "kaydedin" tarzı karne içerikleri — akışta organik olarak daha uzun süre dolaşıyor. Markanız için pratik sonuç şu: her hafta en az bir "işe yarayan" içerik yayınlamak, ürün fotoğrafından daha güçlü bir dağıtım motoru kuruyor.</p>
<h2>Video artık format değil, varsayılan</h2>
<p>Dikey video her platformun ana diline dönüştü. Ancak fark yaratan şey ekipman değil; <strong>ilk 3 saniyedeki vaat</strong>. Kurgumuzda hep aynı kuralı uyguluyoruz: izleyicinin bir sorusu olsun, videonuz cevap olsun.</p>
<ul>
<li>İlk 3 saniye: probleme ya da sonuca doğrudan girin.</li>
<li>Orta bölüm: kısa kesmeler, altyazı zorunlu (sessiz izleme oranı hâlâ yüksek).</li>
<li>Son: tek net aksiyon — kaydet, paylaş ya da profili ziyaret et.</li>
</ul>
<blockquote>Algoritmayı kandırmaya çalışmak yerine algoritmanın sevdiği içeriği üretin: gerçekten işine yarayan insanlar için tasarlanmış içerik.</blockquote>
<h2>Marka için yol haritası</h2>
<p>2026 planı yapan bir markanın öncelik sırası bence şu: 1) kaydedilmeye değer rehber içerik, 2) yüzü ve sesi tanınır hale getiren "insan odaklı" videolar, 3) toplulukla gerçek etkileşim kuran yayınlar. Reklam bütçesi bu üçünün üstüne gelir; yerine geçmez.</p>
<p>Sosyal medya yönetimi paketlerimizde bu çerçeveyi markaya özel takvime dönüştürüyoruz. Detaylar için iletişim bölümünden bize ulaşabilirsiniz.</p>`
    },
    {
      slug: 'google-ads-kalite-puani', img: 'b02', cat: 'Google Ads',
      date: '14 Ekim 2026', read: '6 dk',
      t: 'Google Ads\u2019te Kalite Puanını Yükseltmenin 7 Pratik Yolu',
      ex: 'Aynı bütçeyle daha düşük tıklama maliyeti mümkün: kalite puanını yükselten dokuz küçük ama kalıcı düzeltme.',
      body: `
<p>Kalite puanı, Google Ads\u2019te en hafife alınan maliyet aracıdır. Reklam veren iki marka aynı anahtar kelime için yarışırken kalite puanı 10 olan reklam, 5 olan reklamdan belirgin biçimde <strong>daha düşük tıklama maliyeti</strong> öder. Yani bütçenizi büyütmeden önce skorunuzu büyütmek isteyebilirsiniz.</p>
<h2>Skoru ne yükseltir?</h2>
<p>Google\u2019ın üç bileşeni var: tahmini tıklama oranı, reklam ilgi düzeyi ve açılış sayfası deneyimi. Bu üçü aynı yönde iyileştiğinde skor hızla toparlanır. Pratikte en çok işe yarayan adımlar şunlar:</p>
<ul>
<li>Anahtar kelimeleri başlıklara tek tek taşımak; geniş öbekleme yapmamak.</li>
<li>Her reklam grubuna en az bir "arı" reklam varyasyonu eklemek.</li>
<li>Açılış sayfası başlığının arama niyetiyle aynı dili konuşması.</li>
<li>Sayfa hızını 2 saniyenin altına çekmek (mobil öncelikli).</li>
<li>Negatif kelime listelerini haftalık temizlemek.</li>
<li>Reklam uzantılarını (site bağlantısı, açıklama, görsel) eksiksiz doldurmak.</li>
<li>Düşük CTR\u2019lı anahtar kelimeleri ayrı "düşük niyet" grubuna ayırmak.</li>
</ul>
<h2>Ne zaman beklemeli?</h2>
<p>Düzeltmeler sonrası skorun güncellenmesi birkaç gün alabilir. Panikle bütçeyi değiştirmek, öğrenme aşamasındaki kampanyayı sıfırlar. İki hafta boyunca yalnızca gözlemleyin; sonra karar verin.</p>
<blockquote>Kalite puanı bir hedef değil, tanı: reklamınızın kullanıcı sorusuna gerçekten cevap olduğunun tanısı.</blockquote>
<p>Kampanya denetimi için ekibimizle iletişime geçebilirsiniz.</p>`
    },
    {
      slug: 'meta-ads-retargeting', img: 'b03', cat: 'Meta Ads',
      date: '30 Eylül 2026', read: '7 dk',
      t: 'Meta Ads\u2019te Retargeting: Bütçenizi Doğru Kullanmak',
      ex: 'Soğuk kitleye harcanan her kuruş sıcak kitleyi bekliyor olabilir. Retargeting kurulumunda en sık gördüğümüz beş hata ve çözümleri.',
      body: `
<p>Retargeting, reklam bütçesinin en yüksek geri dönüşlü ama en kolay yanlış kurulabilen alanı. Piksel yüklü ama kampanya yapısı hatalı olduğunda markalar "retargeting çalışmıyor" sonucuna varıyor. Oysa sorun genelde bütçe dağılımında.</p>
<h2>En sık gördüğümüz 5 hata</h2>
<ul>
<li>Tüm bütçeyi soğuk kitleye harcayıp sıcak kitleyi "kendiliğinden" beklemek.</li>
<li>Siteye giren herkesi aynı havuzda tutmak: 7 gün ve 30 gün kitleleri ayrılmalı.</li>
<li>Sepet terk edenlere aynı yaratıcıyı göstermek (mesaj güncel olmalı).</li>
<li>Frekans sınırı koymamak: 30 günde 20 kez görünen reklam, markayı yorar.</li>
<li>Satın alanları dışlamamak: dönüşüm sonrası aynı reklamı göstermek boşa harcama.</li>
</ul>
<h2>Sağlıklı bir kademelendirme</h2>
<p>Bütçenin <strong>%60–70\u2019i</strong> yeni kitle keşfine, <strong>%30–40\u2019ı</strong> retargeting katmanlarına ayrılmalı. Retargeting içi sıralama: sepet terk &gt; ürün görünümü &gt; site etkileşimi. Her katmana farklı mesaj ve farklı yaratıcı üretin; tek reklamı üç kitleye göstermek retargeting değildir.</p>
<blockquote>Retargeting, hatırlatma değil hatırlatılan bir <em>neden</em> ister: indirim, yeni seri ya da sosyal kanıt.</blockquote>
<h2>Ölçüm</h2>
<p>Retargeting başarısı doğrudan satışın yanında <strong>yardımcı dönüşümlerle</strong> de izlenmeli: profil kaydetme, mesaj başlatma, katalog görüntüleme. Meta\u2019nın zenginleştirilmiş dönüşüm ayarları ve agregasyon tabanlı olay ölçümüyle, bu yıl piksel yerine Conversions API tercih etmek ölçüm kalitesini belirgin artırıyor.</p>
<p>Kampanya yapınızı birlikte gözden geçirmek isterseniz bize yazın.</p>`
    },
    {
      slug: 'urun-fotografciligi-kompozisyon', img: 'b04', cat: 'Prodüksiyon',
      date: '18 Eylül 2026', read: '5 dk',
      t: 'Ürün Fotoğrafçılığında Dönüşüm Sağlayan 6 Kompozisyon Kuralı',
      ex: 'İyi ürün fotoğrafı süsleme değil, yönlendirme işidir. Satın alma kararını değiştiren altı kompozisyon kuralı.',
      body: `
<p>Ürün fotoğrafı, e-ticarette "görsel süsleme" değil <strong>satış aracı</strong>dır. Doğru kompozisyon, gözü önce ürünün en çok satan detayına, sonra fiyat etiketine götürür. Stüdyoda uygulamaya çalıştığımız altı kural şunlar:</p>
<h2>1. Tek odak kuralı</h2>
<p>Karede tek bir ana ürün; yardımcı elemanlar (ambalaj aksesuarı, doku, dolgu) ürünle olan hiyerarşisini bozmamalı. Kamera açısından bakıldığında ikinci bir "ilgi merkezi" varsa, o kare reklam değil dekorasyondur.</p>
<h2>2. Negatif alan reklam alanıdır</h2>
<p>Ürünün etrafındaki boşluk, reklam metninin yerleşeceği yerdir. Katalog çekimlerinde ürünü kareye hemen her zaman ortalamıyoruz; metin planına göre asimetrik yerleştiriyoruz.</p>
<h2>3. Işık yönü = anlam yönü</h2>
<p>Yandan gelen sert ışık teknolojik ürünlere, yumuşak tepeden ışık kozmetiğe daha çok yakışır. Yönü seçerken ürün kategorisinin hissiyatını düşünün.</p>
<h2>4. Ölçek referansı</h2>
<p>Tek başına ürün boyutunu düşündürür; kol, avuç ya da bilinen bir nesne ölçeği anında çözer.</p>
<h2>5. Renk sayısı sınırı</h2>
<p>Arka plan + ürün + bir aksan rengi. Fazla renk, fiyat algısını düşürür; sınırlı palet "premium" okur.</p>
<h2>6. Seri tutarlılığı</h2>
<p>Ürün sayfasında ilk görsel ile son görsel aynı dili konuşmalı. Kural: aynı ışık, aynı açı aralığı, aynı zemin — içerik değişir, imza kalır.</p>
<blockquote>İyi kompozisyon fark edilmez; satın almak isteyen kullanıcı fark etmeden satın alır.</blockquote>
<p>Ürün çekimi paketlerimiz hakkında bilgi almak için iletişime geçin.</p>`
    },
    {
      slug: 'icerik-takvimi-rehberi', img: 'b05', cat: 'İçerik Stratejileri',
      date: '27 Ağustos 2026', read: '6 dk',
      t: 'İçerik Takvimi Nasıl Hazırlanır? Adım Adım Rehber',
      ex: 'Spiral takvim mi, sütun planı mı? Hem ajans hem marka için çalışan 4 haftalık içerik takvimi kurulumu.',
      body: `
<p>İçerik takvimi, yaratıcılığı daraltmak için değil <strong>boşaltmak</strong> için vardır. Takvim ne kadar netse, üretim o kadar hızlı ve "yaratıcı krizi" o kadar nadir olur. Ajans olarak her müşteride uyguladığımız kurulum şöyle:</p>
<h2>Adım 1 — Sütunları belirleyin</h2>
<p>Her marka için 3–4 sabit sütun tanımlıyoruz: eğitim (rehberler), ürün (satış), topluluk (arka plan, ekip, müşteri hikâyesi) ve gündem (sezon, trend). Bu sütunlar takvimin omurgasıdır; hiçbir hafta tek sütunla geçmez.</p>
<h2>Adım 2 — Ritmi sabitleyin</h2>
<ul>
<li>Haftada 4–5 yayın: 2 eğitim, 1 ürün, 1 topluluk, 1 esnek.</li>
<li>Haftada 1 video (Reels/Shorts) — üretim günü sabit.</li>
<li>Ayda 1 büyük içerik: kampanya, çekim günü ya da seri başlangıcı.</li>
</ul>
<h2>Adım 3 — 4 haftalık görünüm</h2>
<p>Aylık takvimde her haftaya tek tema verin. Tema, sütunlardan hangisinin öne geçeceğini belirler; böylece içerikler birbirini hatırlatır ve akış "dizi gibi" ilerler.</p>
<h2>Adım 4 — Onay hattını kurun</h2>
<p>Marka tarafı için tek onay kanalı ve net tarihler: içerik taslakları X günü, düzeltmeler Y günü, yayın Z günü. Onay belirsizliği, takvimin en büyük düşmanıdır.</p>
<blockquote>Planlayan ekip üretir, üreten ekip ölçer, ölçen ekip büyür. Takvim bu zincirin ilk halkası.</blockquote>
<p>Takvim şablonunu markanıza uyarlamak isterseniz, ilk görüşmede birlikte kurabiliriz.</p>`
    },
    {
      slug: 'roas-mi-cpa-mi', img: 'b06', cat: 'Dijital Pazarlama',
      date: '9 Ağustos 2026', read: '7 dk',
      t: 'ROAS mı, CPA mı? Reklam Performansında Doğru Metrik Seçimi',
      ex: 'Yanlış metrik, doğru kampanyayı kapatır. Hangi aşamada hangi metriğe bakmalısınız?',
      body: `
<p>Reklam raporlarında en çok tartışılan soru: başarıyı <strong>ROAS</strong> ile mi <strong>CPA</strong> ile mi ölçmeli? Doğru cevap tek bir metrik değil; kanal aşamasına göre değişen bir <em>metrik dizisi</em>.</p>
<h2>ROAS ne zaman konuşulur?</h2>
<p>ROAS (reklam harcamasının gelir karşılığı) katalog ve e-ticaret kampanyalarının ana dilidir. Ancak yeni başlatılan kampanyada ROAS beklentisi, öğrenciye ilk hafta diploma beklemek gibidir: öğrenme aşamasında veri gürültülüdür. Bu aşamada bakılacak şey <strong>CPM, CTR ve sepete ekleme oranıdır</strong>.</p>
<h2>CPA ne zaman konuşulur?</h2>
<p>Lead (form, arama, randevu) kampanyalarında CPA ana metriktir. Ama CPA tek başına yanıltıcıdır: gelen potansiyel müşterinin niteliği görülmeden "ucuz" bir kayıt aslında pahalı olabilir. Bu yüzden CPA yanına <strong>kaliteli müşteri oranı</strong> eklenmeli.</p>
<h2>Önerdiğimiz bakış dizisi</h2>
<ul>
<li>Hafta 1–2: dağıtım sağlıklı mı? (CPM, frekans, CTR)</li>
<li>Hafta 3–4: dönüşüm yaşıyor mu? (dönüşüm oranı, CPA / ROAS ilk sinyaller)</li>
<li>Ay 2+: ölçek kararları (kazanan küme bütçesi, yaratıcı yenileme)</li>
</ul>
<blockquote>Metriği yanlış seçmek, iyi çalışan bir kampanyayı erken kapatmanın en hızlı yoludur.</blockquote>
<p>Raporlama paketimizde her kampanya bu diziyi temel alır; ekran görüntüsü değil, karar dosyası göndeririz.</p>`
    },
    {
      slug: 'video-produksiyon-brief', img: 'b07', cat: 'Prodüksiyon',
      date: '22 Temmuz 2026', read: '5 dk',
      t: 'Video Prodüksiyonda Brief Süreci: Fikirden Sete',
      ex: 'İyi bir çekim günü, setten çok ofiste kazanılır. Brief\u2019ten shot-list\u2019e uzanan yol haritası.',
      body: `
<p>Video prodüksiyonda başarının yarısı sette, diğer yarısı <strong>brief masasında</strong> kazanılır. Süreç hızlandırıldığında kurbanı hep aynı olur: marka dili. Peki verimli bir brief nasıl kurulur?</p>
<h2>Brief\u2019te bulunması gereken 5 bilgi</h2>
<ul>
<li>Hedef: video kimi nereye götürecek? (satış, tanıtım, işe alım…)</li>
<li>Kitle: izleyen kim, nerede izleyecek, kaç saniye verecek?</li>
<li>Ton: resmî mi, samimi mi? Hangi markalara benziyoruz, hangilerine benzemiyoruz?</li>
<li>Must-have: mutlaka görünmesi gereken ürün, mekân, yüz, mesaj.</li>
<li>Kullanım yerleri: Reels mi TV mi web mi? Bu, çekim oranını ve süreyi belirler.</li>
</ul>
<h2>Brief\u2019ten shot-list\u2019e</h2>
<p>Brief netleşince sahneye küçük ineriz: açılı karesi, ürün yakın planları, insan teması, kapanış. Her sahne bir amaca yazılır; "stüdyoda güzel durur" karesi listeye girmez. Bu disiplin, kurguda süreyi ve maliyeti ciddi biçimde azaltır.</p>
<h2>Çekim günü nasıl akmalı?</h2>
<p>Gün iki bloğa bölünür: ilk blok ışık hassasiyeti gerektiren sahneler, ikinci blok hareketli/flexible sahneler. Ekip her sahneyi ekranda kontrol ederek kapatır; "sonradan düzelir" varsayımı prodüksiyonda en pahalı varsayımdır.</p>
<blockquote>Sette kazanılan bir dakika, kurguda kazanan bir saattir.</blockquote>
<p>Prodüksiyon sürecimiz hakkında detay için iletişim bölümüne bakabilirsiniz.</p>`
    },
    {
      slug: 'marka-dili-tone-of-voice', img: 'b08', cat: 'İçerik Stratejileri',
      date: '3 Temmuz 2026', read: '6 dk',
      t: 'Marka Dili: Sosyal Medyada Tutarlı Tone of Voice Kurmak',
      ex: 'Aynı markanın üç farklı kanalda üç farklı kişi gibi konuşması, güveni sessizce eritir. Tutarlı bir ses nasıl kurulur?',
      body: `
<p>Marka dili; görsel kimlik kadar belirleyici ama çok daha kolay bozulan bir alandır. Farklı ekip üyeleri, farklı kanallarda farklı tonlar kullandığında takipçi <strong>markaya değil, gönderene</strong> alışır. O kişi değiştiğinde güven de değişir.</p>
<h2>Ses karakterini üç kelimeye indirin</h2>
<p>Her marka için üç karakter kelimesi seçiyoruz (örnek: "net, sıcak, esprili") ve her kelimeye yap/etme kuralları yazıyoruz. "Net" ne demek? Cümle 15 kelimeyi geçmez. "Sıcak" ne demek? "Müşterimiz" değil "sen" diye hitap ederiz.</p>
<h2>Kanal bazlı uyarlama</h2>
<ul>
<li>Instagram: samimi, görsel öncelikli, kısa paragraflar.</li>
<li>LinkedIn: uzman tonu, veri ve örnek ağırlıklı.</li>
<li>Web &amp; e-posta: net fayda cümlesi, aksiyon odaklı kapanış.</li>
</ul>
<p>Ton değişir, <strong>söz dizimi karakteri değişmez</strong>: aynı kısaltmalar, aynı komik durumlardan kaçınma listesi, aynı yazım tercihleri.</p>
<h2>Ses kılavuzu tek sayfalık olsun</h2>
<p>40 sayfalık PDF kimse açmaz. Ekibin gerçekten kullandığı kılavuz tek sayfadır: 3 karakter kelimesi, 8 örnek cümle, 5 yasaklı kelime. İçerik üreticinin masasında dursun.</p>
<blockquote>Tutarlı ses, sessiz bir güven yatırımınızdır: hiçbir kampanyada görünmez ama her satışta vardır.</blockquote>
<p>Marka dili kılavuzu için ilk ücretsiz görüşmeye davetiz.</p>`
    },
  ];

  const CATS = ['Sosyal Medya', 'Google Ads', 'Meta Ads', 'Prodüksiyon', 'İçerik Stratejileri', 'Dijital Pazarlama'];
  const SERVICES = [
    'Sosyal Medya Yönetimi', 'Google Ads Reklam Yönetimi', 'Meta Ads Reklam Yönetimi',
    'Profesyonel Fotoğraf Çekimi', 'Video Çekimi', 'Prodüksiyon Hizmeti', 'Reklam Performans Analizi',
  ];

  return { PROJECTS, SCENES, POSTS, CATS, SERVICES };
})();
