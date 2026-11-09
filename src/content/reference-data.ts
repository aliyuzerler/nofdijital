/**
 * Referans içerik verisi (Faz 2 fixture kaynağı).
 * Kaynak: reference/nof_digital.html — birebir taşınmıştır (docs/reference-inventory.md).
 * Faz 3'te repository katmanı DB'den besler; bu dosya seed kaynağıdır.
 */

export const GALLERY = {
  files: Array.from({ length: 14 }, (_, i) => `/assets/gallery/gallery-${String(i + 1).padStart(2, "0")}.webp`),
  captions: [
    "Aksiyon · Spor",
    "Maç Günü · Duygu",
    "Smaç · Hızlı Çekim",
    "Salon Atmosferi",
    "Kulis · Doğal Anlar",
    "Saha Kenarı",
    "Stüdyo Portre",
    "Stüdyo · Top",
    "Kampanya Çekimi",
    "Salon · Renk",
    "Takım Ruhu",
    "Savunma · Hareket",
    "Takım Bütünlüğü",
    "Takım Fotoğrafı",
  ],
  /** Kaynak A.ar — en-boy oranları */
  ar: [0.607, 0.667, 0.667, 0.667, 0.667, 0.667, 0.667, 0.667, 0.667, 0.667, 0.667, 0.667, 0.667, 1.5],
  /** Kaynak SC matrisi — 3 sahne × 7 benzersiz görsel */
  scenes: [
    [2, 6, 12, 4, 10, 0, 9],
    [13, 7, 1, 11, 5, 8, 3],
    [6, 9, 3, 0, 13, 10, 1],
  ],
  logo: "/assets/logo.png",
} as const;

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  span: string;
  variant: string;
}

export const SERVICES: ServiceItem[] = [
  {
    icon: "share",
    title: "Sosyal Medya Yönetimi",
    description:
      "Strateji, içerik takvimi, topluluk yönetimi ve düzenli raporlama ile markanızın sesini güçlendiririz.",
    span: "c7",
    variant: "",
  },
  {
    icon: "search",
    title: "Google Ads Reklam Yönetimi",
    description: "Arama niyetini yakalayan, dönüşüme odaklı kampanya kurulumu ve sürekli optimizasyon.",
    span: "c5",
    variant: "dk",
  },
  {
    icon: "mega",
    title: "Meta Ads Reklam Yönetimi",
    description: "Doğru kitleye doğru kreatifle ulaşan Instagram ve Facebook reklamları.",
    span: "c4",
    variant: "",
  },
  {
    icon: "cam",
    title: "Profesyonel Fotoğraf Çekimi",
    description: "Ürün, portre, etkinlik ve spor fotoğrafçılığında markanıza özel görsel dil.",
    span: "c4",
    variant: "pu",
  },
  {
    icon: "vid",
    title: "Video Çekimi",
    description: "Tanıtım, reklam ve sosyal medya için sinematik ve dinamik videolar.",
    span: "c4",
    variant: "",
  },
  {
    icon: "film",
    title: "Prodüksiyon Hizmeti",
    description: "Konsept, set, çekim ve post prodüksiyon süreçlerini baştan sona yönetiriz.",
    span: "c6",
    variant: "dk",
  },
  {
    icon: "chart",
    title: "Reklam Performans Analizi",
    description: "Verileri anlamlı içgörülere dönüştüren raporlar ve net aksiyon önerileri.",
    span: "c6",
    variant: "",
  },
];

export const PROCESS: Array<{ title: string; description: string }> = [
  {
    title: "Analiz",
    description: "Marka, rakipler ve hedef kitle incelenir; mevcut performans verileri değerlendirilir.",
  },
  {
    title: "Strateji",
    description:
      "Hedefler, kanallar, mesaj ve bütçe planı netleştirilir; içerik ve reklam yol haritası çıkarılır.",
  },
  {
    title: "Üretim",
    description: "Fotoğraf, video ve tasarım üretimi; konsepte uygun set ve kurgu ile hayata geçer.",
  },
  {
    title: "Yayınlama",
    description: "İçerikler ve kampanyalar planlanan takvimle doğru kanallarda yayına alınır.",
  },
  {
    title: "Optimizasyon",
    description: "Veriler izlenir, testler yapılır; kampanyalar sürekli iyileştirilir ve raporlanır.",
  },
];

export const CATEGORIES = [
  "Sosyal Medya",
  "Google Ads",
  "Meta Ads",
  "Prodüksiyon",
  "İçerik Stratejileri",
  "Dijital Pazarlama",
] as const;

export interface PostItem {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  cover: number;
  reading: string;
}

export const POSTS: PostItem[] = [
  {
    slug: "icerik-takvimi",
    category: "Sosyal Medya",
    title: "Sosyal Medya İçerik Takvimi Nasıl Planlanır?",
    excerpt:
      "Düzenli paylaşım, planlı bir takvimle başlar. İçerik sütunları ve format dengesiyle sürdürülebilir bir akış kurun.",
    date: "12 Kasım 2026",
    cover: 4,
    reading: "6 dk",
  },
  {
    slug: "google-ads-yapisi",
    category: "Google Ads",
    title: "Google Ads Hesabında Kampanya Yapısı Kurmanın Temelleri",
    excerpt: "Net bir hesap yapısı, bütçenin doğru yere gitmesini ve verilerin okunabilir olmasını sağlar.",
    date: "04 Kasım 2026",
    cover: 0,
    reading: "7 dk",
  },
  {
    slug: "meta-kreatif-testi",
    category: "Meta Ads",
    title: "Meta Ads'te Kreatif Testi: Neyi, Nasıl Ölçmeliyiz?",
    excerpt: "Aynı anda çok değişken test etmek yerine tek bir hipotezle ilerlemek daha güvenilir sonuç verir.",
    date: "28 Ekim 2026",
    cover: 8,
    reading: "5 dk",
  },
  {
    slug: "cekim-oncesi",
    category: "Prodüksiyon",
    title: "Çekim Öncesi Hazırlık: Prodüksiyonu Kolaylaştıran Adımlar",
    excerpt: "Konsept, mekân, ekipman ve çekim listesi önceden netleştiğinde set günü sakin ve verimli geçer.",
    date: "20 Ekim 2026",
    cover: 5,
    reading: "6 dk",
  },
  {
    slug: "icerik-stratejisi",
    category: "İçerik Stratejileri",
    title: "Markanız İçin İçerik Stratejisi: Hikâyeden Formata",
    excerpt: "Güçlü bir hikâye, her kanalda farklı biçimde ama tutarlı bir sesle anlatılabilir.",
    date: "11 Ekim 2026",
    cover: 10,
    reading: "8 dk",
  },
  {
    slug: "dogru-metrikler",
    category: "Dijital Pazarlama",
    title: "Raporlamada Doğru Metrikleri Seçmek",
    excerpt: "Her göstergeyi izlemek yerine hedefle ilişkili birkaç metriğe odaklanmak karar vermeyi hızlandırır.",
    date: "02 Ekim 2026",
    cover: 9,
    reading: "5 dk",
  },
  {
    slug: "video-ritim",
    category: "Sosyal Medya",
    title: "Kısa Video İçeriklerde Ritim ve İlk Üç Saniye",
    excerpt: "İzleyiciyi tutan şey; güçlü bir açılış, net bir akış ve kanala uygun bir kurgu ritmidir.",
    date: "24 Eylül 2026",
    cover: 2,
    reading: "4 dk",
  },
];

/** Kaynak body() şablonu — prototip içerik (seed'de draft durumu). */
export const POST_BODY_HTML = `
<p>%LEAD% Bu yazıda konuyu pratik bir çerçevede ele alıyoruz.</p>
<h2>Neden önemli?</h2>
<p>Dijital kanallarda her karar; hedef kitle, format ve zamanlama ile birlikte düşünüldüğünde anlam kazanır. Planlı ilerleyen markalar, hem üretimde hem raporlamada daha tutarlı sonuçlara ulaşır.</p>
<blockquote>Önce neyi başarmak istediğinizi netleştirin; araçlar ve formatlar ondan sonra gelir.</blockquote>
<h2>Uygulama adımları</h2>
<ol><li>Hedefi ve ölçüm yöntemini tanımlayın.</li><li>Kitleyi ve kanalı netleştirin.</li><li>Küçük bir pilot ile başlayın.</li><li>Sonuçları düzenli olarak değerlendirin.</li></ol>
<h3>Sık yapılan hatalar</h3>
<p>Çok fazla şeyi aynı anda değiştirmek, sonuçların nedenini anlamayı zorlaştırır. Tek seferde tek değişken test etmek daha sağlıklı bir yaklaşımdır.</p>
<h3>Küçük bir kontrol listesi</h3>
<ul><li>Hedef net mi?</li><li>Kreatif ve mesaj kanala uygun mu?</li><li>Ölçüm kurulumu hazır mı?</li></ul>
<h2>Sonuç</h2>
<p>Güçlü sonuçlar çoğu zaman karmaşık yöntemlerden değil, tutarlı uygulamadan gelir. Ekibimizle bu süreci birlikte planlamak isterseniz iletişime geçebilirsiniz.</p>
<div class="nt">Bu yazı tasarım prototipi için hazırlanmış örnek içeriktir.</div>
`;

/** Site meta — Faz 5'te site_settings tablosundan gelir. */
export const SITE = {
  name: "NOF DİJİTAL",
  title: "NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
  description: "Sosyal medya yönetimi, Google & Meta Ads, fotoğraf, video ve prodüksiyon hizmetleri.",
  heroTitleLines: ["Dijitalde fark", "yaratmak, doğru", "stratejiyle başlar."],
  heroLead:
    "Markanız için yaratıcı içerikler, profesyonel prodüksiyon ve ölçülebilir reklam stratejileri geliştiriyoruz.",
  band: [
    "Sosyal Medya Yönetimi",
    "Google Ads",
    "Meta Ads",
    "Fotoğraf Çekimi",
    "Video Çekimi",
    "Prodüksiyon",
    "Performans Analizi",
  ],
  aboutTitle: "Yaratıcılığı stratejiyle, stratejiyi ölçülebilir sonuçlarla birleştiriyoruz.",
  aboutLead:
    "NOF DİJİTAL; çekim setinde de reklam panelinde de aynı titizlikle çalışır. Fikri sahada üretir, yayında test eder, verilerle iyileştirir.",
  aboutValues: [
    { b: "Yaratıcılık", s: "Markanın hikâyesini görsel ve harekete dönüştüren özgün prodüksiyon." },
    { b: "Strateji", s: "Hedef kitleye ve kanala göre kurgulanan içerik ve reklam planı." },
    { b: "Ölçüm", s: "Her kampanyada net metrikler, düzenli raporlama ve optimizasyon." },
  ],
  contactInfo: [
    { icon: "ph", text: "Telefon numarası — buraya eklenecek" },
    { icon: "wa", text: "WhatsApp hattı — buraya eklenecek" },
    { icon: "mail", text: "E-posta adresi — buraya eklenecek" },
  ],
  footerContact: ["Telefon — eklenecek", "E-posta — eklenecek", "Adres — eklenecek"],
  footerNote: "Tasarım prototipi — içerikler örnektir.",
} as const;

/** Hizmet seçimi formuna aktarılırken kullanılan seçenek listesi. */
export const SERVICE_OPTIONS = [...SERVICES.map((s) => s.title), "Henüz emin değilim"];
