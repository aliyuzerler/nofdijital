import Link from "next/link";
import { GALLERY, SERVICES, SITE } from "@/content/reference-data";

export function SiteFooter() {
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
              <a href="/#iletisim" aria-label="Instagram">
                <svg className="i">
                  <use href="#i-ig" />
                </svg>
              </a>
              <a href="/#iletisim" aria-label="LinkedIn">
                <svg className="i">
                  <use href="#i-in" />
                </svg>
              </a>
              <a href="/#iletisim" aria-label="YouTube">
                <svg className="i">
                  <use href="#i-yt" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4>Menü</h4>
            <ul>
              <li>
                <Link href="/">Ana Sayfa</Link>
              </li>
              <li>
                <Link href="/#hizmetler">Hizmetler</Link>
              </li>
              <li>
                <Link href="/#calismalar">Çalışmalarımız</Link>
              </li>
              <li>
                <Link href="/#hakkimizda">Hakkımızda</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/#iletisim">İletişim</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Hizmetler</h4>
            <ul>
              {SERVICES.map((s) => (
                <li key={s.title}>{s.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>İletişim</h4>
            <ul>
              {SITE.footerContact.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="fb">
          <span>© 2026 NOF DİJİTAL. Tüm hakları saklıdır.</span>
          <span>{SITE.footerNote}</span>
        </div>
      </div>
    </footer>
  );
}
