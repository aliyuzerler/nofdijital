"use client";

import { useEffect, useRef } from "react";
import { GALLERY } from "@/content/reference-data";
import type { GalleryItemView } from "@/server/services/repositories";

/** Referans lightbox: döngüsel 14 görsel, ESC/oklar, swipe, caption. */
export function Lightbox({ items }: { items?: GalleryItemView[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const idx = useRef(0);
  const touchX = useRef(0);

  const files = items && items.length === 14 ? items.map((i) => i.src) : [...GALLERY.files];
  const captions = items && items.length === 14 ? items.map((i) => i.caption) : [...GALLERY.captions];

  useEffect(() => {
    const lb = boxRef.current;
    const li = imgRef.current;
    if (!lb || !li) return;

    const show = (i: number) => {
      idx.current = ((i % 14) + 14) % 14;
      li.style.opacity = "0";
      setTimeout(() => {
        li.src = files[idx.current]!;
        li.alt = captions[idx.current] ?? "";
        li.style.opacity = "1";
      }, 120);
      if (capRef.current)
        capRef.current.textContent = `${captions[idx.current]}  ·  ${idx.current + 1} / 14`;
    };
    const open = (i: number) => {
      show(i);
      lb.classList.add("o");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      lb.classList.remove("o");
      document.body.style.overflow = "";
    };

    const onOpen = (e: Event) => open((e as CustomEvent<number>).detail);
    const onKey = (e: KeyboardEvent) => {
      if (!lb.classList.contains("o")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx.current - 1);
      if (e.key === "ArrowRight") show(idx.current + 1);
    };
    const onTouchStart = (e: TouchEvent) => (touchX.current = e.touches[0]!.clientX);
    const onTouchEnd = (e: TouchEvent) => {
      const d = e.changedTouches[0]!.clientX - touchX.current;
      if (Math.abs(d) > 50) show(idx.current + (d < 0 ? 1 : -1));
    };

    window.addEventListener("nof-lightbox", onOpen);
    window.addEventListener("keydown", onKey);
    lb.addEventListener("touchstart", onTouchStart, { passive: true });
    lb.addEventListener("touchend", onTouchEnd);

    const btns = {
      close: lb.querySelector<HTMLButtonElement>(".lx"),
      prev: lb.querySelector<HTMLButtonElement>(".lp"),
      next: lb.querySelector<HTMLButtonElement>(".ln2"),
    };
    btns.close?.addEventListener("click", close);
    btns.prev?.addEventListener("click", () => show(idx.current - 1));
    btns.next?.addEventListener("click", () => show(idx.current + 1));
    const onBackdrop = (e: MouseEvent) => {
      if (e.target === lb) close();
    };
    lb.addEventListener("click", onBackdrop);

    return () => {
      window.removeEventListener("nof-lightbox", onOpen);
      window.removeEventListener("keydown", onKey);
      lb.removeEventListener("touchstart", onTouchStart);
      lb.removeEventListener("touchend", onTouchEnd);
      lb.removeEventListener("click", onBackdrop);
    };
     
  }, []);

  return (
    <div id="lb" role="dialog" aria-modal="true" aria-label="Fotoğraf görüntüleyici" ref={boxRef}>
      <button className="lx" aria-label="Kapat" type="button">
        <svg className="i">
          <use href="#i-x" />
        </svg>
      </button>
      <button className="lp" aria-label="Önceki" type="button">
        <svg className="i">
          <use href="#i-l" />
        </svg>
      </button>
      <img alt="" ref={imgRef} />
      <button className="ln2" aria-label="Sonraki" type="button">
        <svg className="i">
          <use href="#i-r" />
        </svg>
      </button>
      <div className="cp" ref={capRef} />
    </div>
  );
}
