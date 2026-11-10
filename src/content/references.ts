/**
 * Referanslarımız — client logo marquee'si için statik logo listesi.
 * Kaynak dosyalar: upload/resimler.rar → scripts/prepare-reference-logos.py
 * ile normalize edildi (4 birebir çift elendi → 15 benzersiz marka; beyaz kenar
 * kırpma; max 220x340; yükseltme yok). Görseller public/assets/logos/ altında.
 */
export type ReferenceLogo = { src: string; alt: string };

export const REFERENCE_LOGOS: ReferenceLogo[] = [
  { src: "/assets/logos/koza-atletik.png", alt: "Koza Atletik" },
  { src: "/assets/logos/dinamo.png", alt: "Dinamo 2010" },
  { src: "/assets/logos/tuzla-yuzme.png", alt: "Tuzla Yüzme Kulübü" },
  { src: "/assets/logos/cansia-spor.png", alt: "Cansia Spor Kulübü" },
  { src: "/assets/logos/aura-hair-beauty.png", alt: "B&S Aura Hair Beauty" },
  { src: "/assets/logos/venga-concept.png", alt: "Venga Concept" },
  { src: "/assets/logos/tuzla-canada.png", alt: "Tuzla Canada Okulları" },
  { src: "/assets/logos/pendik-voleybol.png", alt: "Pendik Voleybol Spor Kulübü" },
  { src: "/assets/logos/avaron-coffee.png", alt: "Avaron Coffee" },
  { src: "/assets/logos/maximus-wellness.png", alt: "Maximus Wellness" },
  { src: "/assets/logos/maximus-training.png", alt: "Maximus Functional Training" },
  { src: "/assets/logos/nocre-hotel.png", alt: "Nocrè Hotel" },
  { src: "/assets/logos/lipa.png", alt: "Lipa" },
  { src: "/assets/logos/koylu-sandwich.png", alt: "Köylü Sandwich" },
  { src: "/assets/logos/pitoscu-murat.png", alt: "Pitoscu Murat" },
];
