import { type PressItemView } from "@/server/services/repositories";

/**
 * Basında Biz kartları (14.11.2026): görsel üstte, altında açıklama + kaynak
 * etiketi. Kartın tamamı orijinal haber kaynağına gider — YENİ SEKMEDE açılır
 * (rel="noopener noreferrer", güvenli dış bağlantı). Ana sayfa önizlemesi ve
 * /basinda-biz sayfası aynı bileşeni paylaşır.
 */
export function PressCards({ items }: { items: PressItemView[] }) {
  return (
    <div className="pr-grid">
      {items.map((p, i) => (
        <a
          key={p.id}
          className="pr"
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          data-r
          style={{ "--d": `${(i % 4) * 0.08}s` } as React.CSSProperties}
          aria-label={p.description}
        >
          <div className="im">
            <img src={p.imageUrl} alt={p.sourceName ? `${p.sourceName} haberi` : "Basın haberi görseli"} loading="lazy" />
          </div>
          {p.sourceName ? (
            <span className="tag">{p.sourceName}</span>
          ) : (
            <span className="tag">Basın</span>
          )}
          <p>{p.description}</p>
          <span className="rd">
            Haberi oku{" "}
            <svg className="i">
              <use href="#i-arr" />
            </svg>
          </span>
        </a>
      ))}
    </div>
  );
}
