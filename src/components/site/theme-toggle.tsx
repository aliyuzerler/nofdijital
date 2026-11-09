"use client";

import { useCallback, useSyncExternalStore } from "react";

/** DEV-001: karanlık/açık tema düğmesi; tercih localStorage'da saklanır. */

function subscribe(cb: () => void) {
  window.addEventListener("nof-theme-change", cb);
  return () => window.removeEventListener("nof-theme-change", cb);
}
function getSnapshot(): "dark" | "light" {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}
function getServerSnapshot(): "dark" | "light" {
  return "dark";
}

export function ThemeToggle({ variant = "hd" }: { variant?: "hd" | "mm" }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = getSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("nof-theme", next);
    } catch {
      /* storage kapalıysa yalnızca oturumluk değişir */
    }
    window.dispatchEvent(new CustomEvent("nof-theme-change", { detail: next }));
  }, []);

  return (
    <button
      type="button"
      className={`tgl${variant === "mm" ? " tgl-mm" : ""}`}
      onClick={toggle}
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      title={theme === "dark" ? "Açık tema" : "Koyu tema"}
    >
      <svg className="i" aria-hidden="true">
        <use href={theme === "dark" ? "#i-sun" : "#i-moon"} />
      </svg>
    </button>
  );
}
