"use client";

import Link from "next/link";
import { GALLERY, SERVICES } from "@/content/reference-data";

/** 7 hizmet kartı — tıkla/Enter → hizmet seçimi + iletişime kaydırma. */
export function ServiceCards() {
  const go = (title: string) => window.dispatchEvent(new CustomEvent("nof-service", { detail: title }));

  return (
    <div className="sv" id="svg">
      {SERVICES.map((s, i) => (
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

/** Blog kartı (referans .pc) — ortak. */
export function PostCard({
  slug,
  category,
  title,
  excerpt,
  date,
  cover,
  cls = "",
}: {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  cover: number;
  cls?: string;
}) {
  return (
    <Link className={`pc ${cls}`.trim()} href={`/blog/${slug}`}>
      <div className="im">
        <img src={GALLERY_COVER(cover)} alt="" loading="lazy" />
      </div>
      <div className="mt">
        <span className="tag">{category}</span>
        <span>{date}</span>
      </div>
      <h3>{title}</h3>
      <p>{excerpt}</p>
      <span className="rd">
        Yazıyı oku{" "}
        <svg className="i">
          <use href="#i-arr" />
        </svg>
      </span>
    </Link>
  );
}

export function GALLERY_COVER(cover: number): string {
  return GALLERY.files[cover] ?? GALLERY.files[0]!;
}
