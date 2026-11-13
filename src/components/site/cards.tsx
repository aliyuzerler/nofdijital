"use client";

import { GALLERY, SERVICES, type ServiceItem } from "@/content/reference-data";

/**
 * Hizmet kartları. NOT: Blog kartı (PostCard) 14.11.2026'da blog ile birlikte
 * kaldırıldı; yerine src/components/site/press-cards.tsx (Basında Biz) geldi.
 */

/** 7 hizmet kartı — tıkla/Enter → hizmet seçimi + iletişime kaydırma. */
export function ServiceCards({ services = SERVICES }: { services?: ServiceItem[] }) {
  const go = (title: string) => window.dispatchEvent(new CustomEvent("nof-service", { detail: title }));

  return (
    <div className="sv" id="svg">
      {services.map((s, i) => (
        <article
          key={s.title}
          className={`card ${s.span} ${s.variant}`.trim()}
          data-r
          style={{ "--d": `${(i % 3) * 0.08}s` } as React.CSSProperties}
          data-sv={s.title}
          tabIndex={0}
          onClick={() => go(s.title)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go(s.title);
          }}
        >
          <span className="no">0{i + 1}</span>
          <div className="ic">
            <svg className="i">
              <use href={`#i-${s.icon}`} />
            </svg>
          </div>
          <div>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <span className="mr">
              Detayı gör{" "}
              <svg className="i">
                <use href="#i-arr" />
              </svg>
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
