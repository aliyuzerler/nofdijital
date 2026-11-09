"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Referans reveal/sayaç davranışı: tek IntersectionObserver (threshold .15),
 * .in sınıfı kalıcı; data-count sayaçları 6*n frame'de artar.
 */
export function RevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let io: IntersectionObserver | null = null;

    const count = (el: HTMLElement) => {
      const n = +el.dataset.count!;
      let t = 0;
      if (RM) {
        el.textContent = "0" + n;
        return;
      }
      const s = () => {
        t += 1;
        el.textContent = "0" + Math.min(n, Math.ceil(t / 6));
        if (t < 6 * n) requestAnimationFrame(s);
      };
      s();
    };

    io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            // DEV-004: referansta count() yalnızca gözlemlenen elemanın data-count'u
            // varsa çalışıyordu; .n[data-count] çocukları gözlemlenmediği için ölü koddu.
            // Tasarım niyeti sayacı çalıştırmaktır — gözlemlenen bölüm içinde aranır.
            const self = e.target as HTMLElement;
            const c = self.dataset.count ? self : self.querySelector<HTMLElement>("[data-count]");
            if (c) count(c);
            io!.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );

    document.querySelectorAll<HTMLElement>("[data-r],.ln,.in-load,.st,.pan,.abv").forEach((el) => {
      if (!el.classList.contains("in")) io!.observe(el);
    });

    return () => io?.disconnect();
  }, [pathname]);

  return null;
}
