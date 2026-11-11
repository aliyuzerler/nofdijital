"use client";

import { useEffect, useRef } from "react";

/**
 * İstatistik bandı — Referansların üstünde (Referans tasarımından site diline uyarlama).
 *
 * Yönetim: içerik admin panelinden düzenlenir (page_sections: stats → bodyJson);
 * boş/eksik gelirse DEFAULTS ile render eder (DB'siz deploy'da da çalışır).
 *
 * Animasyon: sayılar ekrana girdiğinde SIRAYLA (kademeli 380 ms gecikme)
 * 0'dan hedefe sayar (easeOutCubic, 1.5 s). SSR final değeri basar (no-JS/SEO
 * dostu); animasyon mount sonrası devralır. prefers-reduced-motion'da final
 * değer anında kalır.
 *
 * Güvenlik/kapsam: bu komponent yalnızca .stb-* sınıflarını kullanır; nof.css'e
 * evrensel seçici EKLENMEZ, mevcut kurallara dokunulmaz (admin paneli etkilenmez).
 */

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const DEFAULT_STATS: StatItem[] = [
  { value: 25, suffix: "", label: "Farklı Sektör" },
  { value: 85, suffix: "+", label: "İş Birliği Yaptığımız Markalar" },
  { value: 2325, suffix: "", label: "Bitmiş Proje" },
];

const DEFAULTS = {
  title: "Biz olmadan sizi fark edemezler!",
  accent: "fark edemezler!",
  lead: "Fark edilmek, fark yaratmak ile başlar. Markanızı öne çıkaran yaratıcı çözümlerle sizinle birlikteyiz.",
};

const fmt = (n: number) => n.toLocaleString("tr-TR");

/** Gelen kalemleri doğrular; bozuk kayıt bile bandı düşürmez (varsayılana düşer). */
function sanitize(items: StatItem[] | null | undefined): StatItem[] | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const out: StatItem[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const value = typeof it.value === "number" ? it.value : Number.parseFloat(String((it as { value?: unknown }).value ?? ""));
    const label = typeof it.label === "string" ? it.label.trim() : "";
    if (!Number.isFinite(value) || value < 0 || !label) continue;
    out.push({ value: Math.round(value), suffix: typeof it.suffix === "string" ? it.suffix.slice(0, 8) : "", label: label.slice(0, 120) });
  }
  return out.length ? out : null;
}

/** Başlığı basar; accent kelimesi geçiyorsa <em> ile vurgular. */
function TitleWithAccent({ title, accent }: { title: string; accent?: string | null }) {
  const t = title ?? DEFAULTS.title;
  const a = accent && accent.length > 0 && t.includes(accent) ? accent : null;
  if (a) {
    const i = t.indexOf(a);
    return (
      <>
        {t.slice(0, i)}
        <em>{a}</em>
        {t.slice(i + a.length)}
      </>
    );
  }
  return <>{t}</>;
}

export function StatsBand({
  eyebrow,
  title,
  accent,
  lead,
  items,
}: {
  eyebrow?: string | null;
  title?: string | null;
  accent?: string | null;
  lead?: string | null;
  items?: StatItem[] | null;
}) {
  const stats = sanitize(items) ?? DEFAULT_STATS;
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const nums = Array.from(grid.querySelectorAll<HTMLElement>("[data-target]"));
    if (!nums.length) return;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          if (RM) return; // SSR final değerleri zaten DOM'da
          nums.forEach((el, i) => {
            const target = Number.parseFloat(el.dataset.target ?? "0");
            const t0 = performance.now() + i * 380; // sırayla başlar
            const D = 1500;
            const tick = (now: number) => {
              const p = Math.min(1, Math.max(0, (now - t0) / D));
              if (p <= 0) {
                requestAnimationFrame(tick);
                return;
              }
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent = fmt(Math.round(target * eased)); // sonek ayrı .stb-plus elemanında
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        });
      },
      { threshold: 0.35 },
    );
    io.observe(grid);
    return () => io.disconnect();
  }, [stats]);

  return (
    <section className="stb" aria-label="NOF Dijital rakamlarla">
      <div className="wrap stb-wrap">
        <div>
          {eyebrow ? (
            <span className="eyb" data-r>
              {eyebrow}
            </span>
          ) : null}
          <h2 className="stb-title" data-r>
            <TitleWithAccent title={title ?? DEFAULTS.title} accent={accent ?? DEFAULTS.accent} />
          </h2>
          <p className="stb-sub" data-r style={{ "--d": "0.08s" } as React.CSSProperties}>
            {lead ?? DEFAULTS.lead}
          </p>
          <div className="stb-grid" data-r ref={gridRef} style={{ "--d": "0.16s" } as React.CSSProperties}>
            {stats.map((s) => (
              <div className="stb-item" key={`${s.label}-${s.value}`}>
                <div className="stb-top">
                  <span className="stb-num" data-target={s.value}>
                    {fmt(s.value)}
                  </span>
                  {s.suffix ? <span className="stb-plus">{s.suffix}</span> : null}
                </div>
                <span className="stb-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <figure className="stb-media" data-r style={{ "--d": "0.1s" } as React.CSSProperties}>
          <img src="/assets/stats-face.webp" alt="Yaratıcı prodüksiyon — ışık ve parıltı" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}
