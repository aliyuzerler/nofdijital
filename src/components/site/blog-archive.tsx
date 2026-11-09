"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, type PostItem } from "@/content/reference-data";
import { PostCard } from "./cards";

/** Blog arşivi: kategori filtreleri, arama, sayfalama (referans davranışı). */
export function BlogArchive({ posts }: { posts: PostItem[] }) {
  const [cat, setCat] = useState("Tümü");
  const [q, setQ] = useState("");
  const [pgi, setPgi] = useState(1);
  const PS = 4;

  const view = useMemo(() => {
    const L = posts.filter(
      (p) => (cat === "Tümü" || p.category === cat) && (p.title + p.excerpt).toLowerCase().includes(q.toLowerCase()),
    );
    const featured = L[0];
    const rest = L.slice(1);
    const pages = Math.max(1, Math.ceil(rest.length / PS));
    const page = Math.min(pgi, pages);
    const items = pgi === 1 && !featured ? [] : rest.slice((page - 1) * PS, page * PS);
    return { featured, rest, pages, page, items, total: L.length };
  }, [posts, cat, q, pgi]);

  const CLS = ["s7", "s5", "s5", "s7"];

  return (
    <>
      <a className="ft" id="feat" href={`/blog/${view.featured?.slug ?? ""}`} style={{ display: view.featured && pgi === 1 ? "" : "none" }}>
        {view.featured && (
          <>
            <div className="im">
              <img src={coverUrl(view.featured.cover)} alt="" />
            </div>
            <div className="tx">
              <span className="eyb" style={{ color: "var(--pl)" }}>
                Öne çıkan
              </span>
              <h2>{view.featured.title}</h2>
              <p>{view.featured.excerpt}</p>
              <div className="mt" style={{ color: "rgba(255,255,255,.6)" }}>
                <span className="tag">{view.featured.category}</span>
                <span>
                  {view.featured.date} · {view.featured.reading}
                </span>
              </div>
            </div>
          </>
        )}
      </a>

      <div className="tb">
        <div className="chips" id="chips">
          {["Tümü", ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={c === cat ? "on" : ""}
              data-c={c}
              onClick={() => {
                setCat(c);
                setPgi(1);
              }}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
        <label className="sb">
          <svg className="i">
            <use href="#i-search" />
          </svg>
          <input
            id="q"
            type="search"
            placeholder="Yazılarda ara…"
            aria-label="Yazılarda ara"
            value={q}
            onChange={(e) => {
              setQ(e.target.value.trim());
              setPgi(1);
            }}
          />
        </label>
      </div>

      <div className="bgrid" id="blist">
        {view.items.length
          ? view.items.map((p, i) => <PostCard key={p.slug} {...p} cls={CLS[i % 4] ?? ""} />)
          : view.total
            ? null
            : (
              <div className="em">Aramanıza uygun yazı bulunamadı.</div>
            )}
      </div>

      {view.pages > 1 && (
        <div className="pgn" id="pgn">
          {Array.from({ length: view.pages }, (_, i) => (
            <button
              key={i + 1}
              className={i + 1 === view.page ? "on" : ""}
              data-p={i + 1}
              onClick={() => setPgi(i + 1)}
              type="button"
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function coverUrl(cover: number): string {
  return `/assets/gallery/gallery-${String(cover + 1).padStart(2, "0")}.webp`;
}
