"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Logo bağlantısı: ana sayfadayken site en başına yumuşak kaydırır
 * (Next.js aynı rotada gezinirken kaydırma yapmadığı için); başka bir
 * sayfadaysa normal şekilde ana sayfaya yönlendirir. Header + footer ortak.
 */
export function LogoHomeLink({
  src,
  className,
  alt = "NOF DİJİTAL",
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  const pathname = usePathname();
  const scrollTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
  };
  return (
    <Link href="/" className={className} aria-label="NOF DİJİTAL ana sayfa" onClick={(e) => pathname === "/" && scrollTop(e)}>
      <img src={src} alt={alt} />
    </Link>
  );
}
