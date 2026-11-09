"use client";

import { useEffect, useRef } from "react";

/** Referans toast() davranışı — özel olayla tetiklenir. */
export function toast(m: string) {
  window.dispatchEvent(new CustomEvent("nof-toast", { detail: m }));
}

export function ToastHost() {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = (e: Event) => {
      const m = (e as CustomEvent<string>).detail;
      el.innerHTML = `<svg class="i"><use href="#i-ck"/></svg>${m}`;
      el.classList.add("o");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => el.classList.remove("o"), 3600);
    };
    window.addEventListener("nof-toast", on);
    return () => {
      window.removeEventListener("nof-toast", on);
      clearTimeout(timer.current);
    };
  }, []);

  return <div id="toast" role="status" ref={ref} />;
}
