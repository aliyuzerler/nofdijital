"use client";

import { useCallback, useEffect, useRef } from "react";
import { GALLERY } from "@/content/reference-data";
import { placeScene } from "./gallery-engine";
import type { GalleryItemView } from "@/server/services/repositories";

/**
 * Referans sticky yatay galeri: 3 sahne × 7 benzersiz fotoğraf,
 * scroll ile senkron yatay kaydırma, ilerleme göstergesi, lightbox tetiği.
 * Görseller DB'den (portfolio_images) gelir; fallback GALLERY sabiti.
 */
export function WorkGallery({
  items,
  eyebrow,
  title,
}: {
  items?: GalleryItemView[];
  /** Ana sayfa bölüm başlığı — admin > Ana Sayfa > Galeri kartından gelir. */
  eyebrow?: string;
  title?: string;
}) {
  const secRef = useRef<HTMLElement>(null);
  const stkRef = useRef<HTMLDivElement>(null);
  const gtRef = useRef<HTMLDivElement>(null);
  const wnRef = useRef<HTMLSpanElement>(null);
  const wbRef = useRef<HTMLElement>(null);
  const state = useRef({ W: 0, H: 0, mode: false, range: 1 });

  const files = items && items.length === 14 ? items.map((i) => i.src) : [...GALLERY.files];
  const captions = items && items.length === 14 ? items.map((i) => i.caption) : [...GALLERY.captions];
  const ars = items && items.length === 14 ? items.map((i) => i.ar) : [...GALLERY.ar];

  const scrollWork = useCallback(() => {
    const sec = secRef.current;
    const gt = gtRef.current;
    if (!sec || !gt) return;
    const { W, range } = state.current;
    const s = window.scrollY - sec.offsetTop - state.current.H * 0.2;
    const p = Math.max(0, Math.min(1, s / range));
    gt.style.transform = `translate3d(${-p * 2 * W}px,0,0)`;
    if (wbRef.current) wbRef.current.style.transform = `scaleX(${p * 0.8 + 0.2})`;
    if (wnRef.current) wnRef.current.textContent = "0" + (1 + Math.round(p * 2));
  }, []);

  const layoutGallery = useCallback(
    (force = false) => {
      const stk = stkRef.current;
      if (!stk || !stk.offsetWidth) return;
      const W = stk.clientWidth;
      const H = stk.clientHeight;
      const mob = W < 760;
      const st = state.current;
      if (!force && st.W === W && Math.abs(st.H - H) < 90 && st.mode === mob) return;
      st.W = W;
      st.H = H;
      st.mode = mob;

      const gt = gtRef.current;
      if (!gt) return;
      gt.style.width = GALLERY.scenes.length * W + "px";
      gt.innerHTML = GALLERY.scenes
        .map((ids, si) => {
          const placed = placeScene(ids, W, H, 101 + si * 37 + (mob ? 900 : 0), mob, ars);
          return (
            `<div class="scene" style="width:${W}px">` +
            placed
              .map(
                (p) =>
                  `<figure class="ph" tabindex="0" data-id="${p.id}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;--r:${p.rot.toFixed(2)}deg"><img src="${files[p.id]}" alt="${captions[p.id]}" draggable="false"><figcaption class="cp"><span>${captions[p.id]}</span><svg class="i"><use href="#i-arr"/></svg></figcaption></figure>`,
              )
              .join("") +
            "</div>"
          );
        })
        .join("");

      const range = (GALLERY.scenes.length - 1) * H * 0.95;
      if (secRef.current) secRef.current.style.height = H + range + H * 0.5 + "px";
      st.range = range;
      scrollWork();
    },
    [scrollWork, files, captions, ars],
  );

  useEffect(() => {
    layoutGallery(true);
    let tm: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(tm);
      tm = setTimeout(() => layoutGallery(), 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(tm);
    };
  }, [layoutGallery]);

  useEffect(() => {
    let tk = false;
    const upd = () => {
      tk = false;
      scrollWork();
    };
    const onScroll = () => {
      if (!tk) {
        tk = true;
        requestAnimationFrame(upd);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollWork]);

  const onGalleryClick = (e: React.MouseEvent) => {
    const f = (e.target as HTMLElement).closest<HTMLElement>(".ph");
    if (f) window.dispatchEvent(new CustomEvent("nof-lightbox", { detail: +f.dataset.id! }));
  };
  const onGalleryKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const f = (e.target as HTMLElement).closest<HTMLElement>(".ph");
      if (f) window.dispatchEvent(new CustomEvent("nof-lightbox", { detail: +f.dataset.id! }));
    }
  };

  return (
    <section className="work" id="calismalar" ref={secRef}>
      <div className="stk" id="stk" ref={stkRef}>
        <div className="wh1">
          <span className="eyb">{eyebrow ?? "Çalışmalarımız"}</span>
          <h2>{title ?? "Stüdyo duvarı"}</h2>
        </div>
        <div className="wpg">
          <span id="wn" ref={wnRef}>
            01
          </span>
          <i>
            <b id="wb" ref={wbRef as React.RefObject<HTMLElement>} />
          </i>
          <span style={{ opacity: 0.5 }}>03</span>
        </div>
        <div
          id="gt"
          ref={gtRef}
          onClick={onGalleryClick}
          onKeyDown={onGalleryKey}
          role="list"
          aria-label="Stüdyo duvarı fotoğrafları"
        />
      </div>
    </section>
  );
}
