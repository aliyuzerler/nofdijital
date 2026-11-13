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
} as const;

/** Hizmet seçimi formuna aktarılırken kullanılan seçenek listesi. */
export const SERVICE_OPTIONS = [...SERVICES.map((s) => s.title), "Henüz emin değilim"];
