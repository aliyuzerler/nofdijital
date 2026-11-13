import Link from "next/link";
import { GALLERY, SERVICES, SITE } from "@/content/reference-data";
import { LogoHomeLink } from "./logo-home-link";
import type { PublicSettings } from "@/server/services/settings";
import type { ServiceView } from "@/server/services/repositories";

/**
 * Footer — hizmetler sütunu admin > Hizmetler'den, iletişim + sosyal linkler
 * Genel Ayarlar'dan beslenir. Menü sütunu STATİKTİR: admin > Menü paneli
 * kaldırıldı (12.11.2026) — manuel sekmeler yönlendirme yapamıyordu.
 * DB boşken görsel birebir korunur (fallback değerleri).
 */

const MENU = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hizmetler", href: "/#hizmetler" },
  { label: "Çalışmalarımız", href: "/#calismalar" },
  { label: "Referanslarımız", href: "/#referanslar" },
  { label: "Hakkımızda", href: "/#hakkimizda" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/#iletisim" },
];

export function SiteFooter({
  settings,
  services,
}: {
  settings: PublicSettings;
  services: ServiceView[];
}) {
  const menuItems = MENU;
  const serviceTitles =
    services.length > 0 ? services.map((s) => s.title) : SERVICES.map((s) => s.title);

  const contactLines = [
    settings.phone ? `Tel: ${settings.phone}` : "",
    settings.email,
    settings.address,
  ].filter(Boolean);
  const contactItems = contactLines.length > 0 ? contactLines : [...SITE.footerContact];

  // Sosyal butonlar: LinkedIn + YouTube yönlendirmeleri kaldırıldı (14.11.2026
  // kullanıcı talebi) — yalnızca Instagram butonu gösterilir.
  const socials = [
    { icon: "ig", label: "Instagram", href: settings.social.instagram || "/#iletisim" },
  ];

  return (
    <footer>
      <div className="wrap">
        <div className="fg4">
          <div>
            {/* Mor zeminli marka logosu: nof.css footer .lg beyaz chip'i sıfırlanır. */}
            <LogoHomeLink
              className="lg"
              style={{ background: "transparent", padding: 0, borderRadius: 0 }}
              src={settings.logoUrl || GALLERY.logo}
            />
            <p>Yaratıcı prodüksiyon ve performans odaklı dijital pazarlamayı tek çatıda buluşturan ajans.</p>
            <div className="so">
              {socials.map((s) => (
                <a
                  key={s.icon}
                  href={s.href}
                  aria-label={s.label}
                  {...(s.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  <svg className="i">
                    <use href={`#i-${s.icon}`} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4>Menü</h4>
            <ul>
              {menuItems.map((n) => (
                <li key={`${n.href}-${n.label}`}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Hizmetler</h4>
            <ul>
              {serviceTitles.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>İletişim</h4>
            <ul>
              {contactItems.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="fb">
          <span>© {new Date().getFullYear()} NOF DİJİTAL. Tüm hakları saklıdır.</span>
          <span>{SITE.footerNote}</span>
        </div>
      </div>
    </footer>
  );
}
