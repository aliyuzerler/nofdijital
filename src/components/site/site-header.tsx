"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { GALLERY } from "@/content/reference-data";

const NAV = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hizmetler", href: "/#hizmetler" },
  { label: "Çalışmalarımız", href: "/#calismalar" },
  { label: "Referanslarımız", href: "/#referanslar" },
  { label: "Hakkımızda", href: "/#hakkimizda" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/#iletisim" },
];

export function SiteHeader() {
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

  const goSection = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const id = href.split("#")[1];
    if (id && pathname === "/") {
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
          <Link href="/" className="logo" aria-label="NOF DİJİTAL ana sayfa">
            <img src={GALLERY.logo} alt="NOF DİJİTAL" />
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
