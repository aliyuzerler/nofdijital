"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { GALLERY } from "@/content/reference-data";

/**
 * Statik site menüsü — admin > Menü paneli kaldırıldı (12.11.2026).
 * Manuel eklenen sekmeler yönlendirme yapamadığı için menü artık tamamen
 * burada tanımlı; yönlendirmeler goSection ile tek noktadan yönetilir.
 */
const NAV = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hizmetler", href: "/#hizmetler" },
  { label: "Çalışmalarımız", href: "/#calismalar" },
  { label: "Referanslarımız", href: "/#referanslar" },
  { label: "Hakkımızda", href: "/#hakkimizda" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/#iletisim" },
];

export function SiteHeader({ logoUrl }: { logoUrl?: string }) {
  // Admin > Genel Ayarlar'dan yüklenen logo; tanımsızsa statik marka logosu.
  const LOGO_SRC = logoUrl || GALLERY.logo;
  const [sc, setSc] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const mmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const upd = () => setSc(window.scrollY > 20 || pathname !== "/");
    let raf = requestAnimationFrame(upd);
    window.addEventListener("scroll", upd, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", upd);
    };
  }, [pathname]);

  /* Menü linklerine tıklanınca kapanır (goSection içinde setOpen(false)); ekstra effect gerekmez */

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : href === "/blog" ? pathname.startsWith("/blog") : false;

  /** Sayfa en başa yumuşak kaydırma (reduced-motion duyarlı). */
  const scrollTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
    setOpen(false);
  };

  const goSection = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const id = href.split("#")[1];
    if (!id) {
      // Hash'siz hedef (ör. "/"): ana sayfadaysak site en başına kaydır;
      // değilse normal gezinme (yönlendirme sonrası Next en baştan açar).
      if (href === "/" && pathname === "/") scrollTop(e);
      else setOpen(false);
      return;
    }
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const y = el.getBoundingClientRect().top + window.scrollY - (el.id === "iletisim" ? 0 : 60);
        window.scrollTo({ top: el.id === "calismalar" ? el.offsetTop : y, behavior: RM ? "auto" : "smooth" });
      }
      setOpen(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <>
      <header id="hd" className={sc ? "sc" : ""}>
        <div className="wrap">
          {/* Marka logosu artık mor zeminli blok: nof.css .logo beyaz chip'ini
              bileşen düzeyinde sıfırlıyoruz (arka plan eklenmez). */}
          <Link
            href="/"
            className="logo"
            style={{ background: "transparent", padding: 0, borderRadius: 0 }}
            aria-label="NOF DİJİTAL ana sayfa"
            onClick={(e) => pathname === "/" && scrollTop(e)}
          >
            <img src={LOGO_SRC} alt="NOF DİJİTAL" />
          </Link>
          <nav className="m" aria-label="Ana menü">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? "on" : ""} onClick={goSection(n.href)}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }} className="hd-tools">
            <ThemeToggle />
            <Link className="btn sm" href="/#iletisim" onClick={goSection("/#iletisim")}>
              Teklif Al{" "}
              <svg className="i">
                <use href="#i-arr" />
              </svg>
            </Link>
            <button
              className="burger"
              aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              type="button"
            >
              <svg className="i">
                <use href={open ? "#i-x" : "#i-menu"} />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div id="mm" className={open ? "o" : ""} aria-hidden={!open} ref={mmRef}>
        {NAV.map((n) => (
          <Link key={n.href} className="l" href={n.href} onClick={goSection(n.href)}>
            {n.label}
          </Link>
        ))}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 28 }}>
          <ThemeToggle variant="mm" />
          <Link className="btn" href="/#iletisim" onClick={goSection("/#iletisim")}>
            Proje Başlat{" "}
            <svg className="i">
              <use href="#i-arr" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}
