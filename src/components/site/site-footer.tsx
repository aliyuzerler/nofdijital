import Link from "next/link";
import { GALLERY, SERVICES, SITE } from "@/content/reference-data";
import type { PublicSettings } from "@/server/services/settings";
import type { ServiceView } from "@/server/services/repositories";

/**
 * Footer — tamamen yönetim panelinden beslenir:
 *  - Menü sütunu: admin > Menü (navigation_items); boşsa varsayılan liste.
 *  - Hizmetler sütunu: admin > Hizmetler (services); boşsa referans liste.
 *  - İletişim sütunu + sosyal linkler: admin > Genel Ayarlar (site_settings).
 * DB boşken görsel birebir korunur (fallback değerleri).
 */

const DEFAULT_NAV = [
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
  nav,
  services,
}: {
  settings: PublicSettings;
  nav: Array<{ label: string; href: string }>;
  services: ServiceView[];
}) {
  const menuItems = nav.length > 0 ? nav : DEFAULT_NAV;
  const serviceTitles =
    services.length > 0 ? services.map((s) => s.title) : SERVICES.map((s) => s.title);

  const contactLines = [
    settings.phone ? `Tel: ${settings.phone}` : "",
    settings.email,
    settings.address,
  ].filter(Boolean);
  const contactItems = contactLines.length > 0 ? contactLines : [...SITE.footerContact];

  const socials = [
    { icon: "ig", label: "Instagram", href: settings.social.instagram || "/#iletisim" },
    { icon: "in", label: "LinkedIn", href: settings.social.linkedin || "/#iletisim" },
    { icon: "yt", label: "YouTube", href: settings.social.youtube || "/#iletisim" },
  ];

  return (
    <footer>
      <div className="wrap">
        <div className="fg4">
          <div>
            <Link className="lg" href="/">
              <img src={GALLERY.logo} alt="NOF DİJİTAL" />
            </Link>
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
