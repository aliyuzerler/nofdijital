import { REFERENCE_LOGOS, type ReferenceLogo } from "@/content/references";

/**
 * Referanslarımız — iki şeritli simetrik logo marquee'si.
 * 1. şerit sağdan sola (normal), 2. şerit soldan sağa (reverse) kayar; aynı süre
 * kullanıldığı için hız simetrisi korunur. Döngü `.band`/`mq` desenidir:
 * içerik iki kez render edilir ve şerit translateX(-50%) ile kayar (nof.css).
 * Ekranda logolar 82px yüksekliğinde beyaz çip kartlarında gösterilir (mobil 54px) —
 * yuvarlak (kare) logolar yükseklik sınırından en çok yararlanır; geniş logolar
 * max-width ile kırpılır. Düşük kaliteli kaynaklar büyütülmez (kaynaklar en fazla 220px).
 * Saf CSS animasyonu → server component; prefers-reduced-motion kuralı (nof.css)
 * animasyonu otomatik kapatır.
 */
function LogoTrack({ logos }: { logos: ReferenceLogo[] }) {
  const loop = [...logos, ...logos];
  return (
    <div className="rfg-track">
      {loop.map((l, i) => (
        <span className="rfg-chip" key={`${l.alt}-${i}`} aria-hidden={i >= logos.length || undefined}>
          <img src={l.src} alt={i >= logos.length ? "" : l.alt} loading="lazy" />
        </span>
      ))}
    </div>
  );
}

export function ReferencesSection() {
  const half = Math.ceil(REFERENCE_LOGOS.length / 2);
  const rowA = REFERENCE_LOGOS.slice(0, half);
  const rowB = REFERENCE_LOGOS.slice(half);

  return (
    <section className="sec" id="referanslar">
      <div className="wrap">
        <span className="eyb" data-r>
          Referanslarımız
        </span>
        <h2 className="h2" data-r>
          Birlikte <em>çalıştığımız</em> markalar
        </h2>
      </div>
      <div className="rfg">
        <div className="rfg-row" aria-label="Referans logoları — 1. şerit">
          <LogoTrack logos={rowA} />
        </div>
        <div className="rfg-row rev" aria-label="Referans logoları — 2. şerit (ters yön)">
          <LogoTrack logos={rowB} />
        </div>
      </div>
    </section>
  );
}
