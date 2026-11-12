import Link from "next/link";
import { PostCard, ServiceCards } from "@/components/site/cards";
import { WorkGallery } from "@/components/site/work-gallery";
import { ReferencesSection } from "@/components/site/references-section";
import { StatsBand } from "@/components/site/stats-band";
import { getGalleryItems, getHomeSections, getProcessSteps, getPublishedPosts, getServices, getStatsSection, toPostItems } from "@/server/services/repositories";
import { getPublicSettings } from "@/server/services/settings";
import { GALLERY, SITE } from "@/content/reference-data";

const CLS = ["s7", "s5", "s5", "s7"];

/**
 * Başlığı DB'den basar; admin > Ana Sayfa > Bölüm kartındaki "Başlık" alanını
 * sitede yayınlar. "Vurgulu kelime" (accent) başlık içinde geçiyorsa site
 * diline uygun etiketle (process: renkli span, about: em) vurgulanır;
 * geçmiyorsa başlık düz metin olarak basılır (görsel bozulmaz).
 */
function AccentedTitle({
  text,
  accent,
  tag = "span",
  style,
}: {
  text: string;
  accent?: string;
  tag?: "span" | "em";
  style?: React.CSSProperties;
}) {
  if (!accent || !text.includes(accent)) return <>{text}</>;
  const i = text.indexOf(accent);
  const Tag = tag;
  return (
    <>
      {text.slice(0, i)}
      <Tag style={style}>{accent}</Tag>
      {text.slice(i + accent.length)}
    </>
  );
}

/**
 * force-dynamic: İçerik tamamen DB'den beslenir (admin paneli düzenlemeleri).
 * Statik prerender yapılsaydı admin'de yapılan düzenlemeler siteye yansıması
 * için yeniden deploy gerekirdi (kullanıcı raporu: "düzenler görüntülenmiyor").
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sections, services, steps, galleryItems, posts, statsSection, settings] = await Promise.all([
    getHomeSections(),
    getServices(),
    getProcessSteps(),
    getGalleryItems(),
    getPublishedPosts(4),
    getStatsSection(),
    getPublicSettings(),
  ]);

  const hero = sections.hero?.body ?? {};
  const about = sections.about?.body ?? {};
  const process = sections.process?.body ?? {};
  const contact = sections.contact?.body ?? {};
  const blogCta = (sections["blog-preview"]?.body as { cta?: { label?: string; href?: string } } | undefined)?.cta;

  const heroLead = (hero.lead as string) ?? SITE.heroLead;
  const heroImages = (hero.images as Array<{ mediaKey: string; alt: string; cls: string }> | undefined) ?? [
    { mediaKey: "gallery/gallery-08.webp", alt: "Stüdyo portre çekimi", cls: "f1" },
    { mediaKey: "gallery/gallery-03.webp", alt: "Maç anı fotoğrafı", cls: "f2" },
    { mediaKey: "gallery/gallery-14.webp", alt: "Takım fotoğrafı", cls: "f3" },
  ];
  const heroImgSrc = (key: string) => `/uploads/${key}`;
  const aboutValues = (about.values as Array<{ b: string; s: string }> | undefined) ?? SITE.aboutValues;
  const aboutLead = (about.lead as string) ?? SITE.aboutLead;
  const aboutImages = (about.images as Array<{ mediaKey: string; alt: string; cls: string }> | undefined) ?? [
    { mediaKey: "gallery/gallery-14.webp", alt: "Takım çekimi", cls: "a1" },
    { mediaKey: "gallery/gallery-13.webp", alt: "Takım bütünlüğü", cls: "a2" },
  ];
  // İletişim bilgileri: önce admin > Genel Ayarlar (site_settings); orada değer
  // yoksa bölümün DB gövdesindeki info dizisi, o da yoksa referans liste kullanılır.
  const settingsInfo = [
    settings.phone ? { icon: "ph", text: settings.phone } : null,
    settings.whatsappNumber ? { icon: "wa", text: settings.whatsappNumber } : null,
    settings.email ? { icon: "mail", text: settings.email } : null,
  ].filter((v): v is { icon: string; text: string } => v !== null);
  const contactInfo =
    settingsInfo.length > 0
      ? settingsInfo
      : ((contact.info as Array<{ icon: string; text: string }> | undefined) ?? SITE.contactInfo);
  const socialLinks = [
    { icon: "ig", label: "Instagram", href: settings.social.instagram || "/#iletisim" },
    { icon: "in", label: "LinkedIn", href: settings.social.linkedin || "/#iletisim" },
    { icon: "yt", label: "YouTube", href: settings.social.youtube || "/#iletisim" },
  ];
  const postItems = toPostItems(posts);

  // İstatistik bandı: admin panelinden yönetilir (page_sections: stats → bodyJson).
  // Bölüm DB'de yoksa varsayılan içerikle gösterilir; admin "Görünür" kapalıysa gizlenir.
  const statsBody = (statsSection?.body ?? {}) as {
    lead?: string;
    accent?: string;
    statsItems?: Array<{ value: number; suffix?: string; label: string }>;
  };
  const showStats = statsSection ? statsSection.visible : true;
  const statsItems = statsBody.statsItems?.length
    ? statsBody.statsItems.map((i) => ({ value: i.value, suffix: i.suffix ?? "", label: i.label }))
    : null;

  return (
    <div id="v-home">
      {/* HERO */}
      <section className="hero" id="top">
        <div className="wrap">
          <div className="in-load">
            <span className="eyb">{sections.hero?.eyebrow ?? "Yaratıcı prodüksiyon × Performans pazarlama"}</span>
            <h1>
              {SITE.heroTitleLines.map((line, i) => (
                <span className="ln" key={line}>
                  <span>
                    {i === 1 ? (
                      <>
                        yaratmak, <em>doğru</em>
                      </>
                    ) : (
                      line
                    )}
                  </span>
                </span>
              ))}
            </h1>
            <p className="lead">{heroLead}</p>
            <div className="bt">
              <Link className="btn" href="/#hizmetler">
                Hizmetlerimizi Keşfedin{" "}
                <svg className="i">
                  <use href="#i-arr" />
                </svg>
              </Link>
              <Link className="btn ghost" href="/#iletisim">
                Bizimle İletişime Geçin
              </Link>
            </div>
          </div>
          <div className="art in-load" data-par>
            {heroImages.map((h) => (
              <figure className={h.cls} key={h.cls}>
                { }
                <img src={heroImgSrc(h.mediaKey)} alt={h.alt} />
              </figure>
            ))}
          </div>
        </div>
        <div className="scr">
          <i></i>Kaydır
        </div>
      </section>

      {/* BANT */}
      <div className="band" aria-hidden="true">
        <div>
          {[...SITE.band, ...SITE.band].map((b, i) => (
            <span key={i}>{b}</span>
          ))}
        </div>
      </div>

      {/* HİZMETLER */}
      <section className="sec" id="hizmetler">
        <div className="wrap">
          <span className="eyb" data-r>
            {sections.services?.eyebrow ?? "Hizmetlerimiz"}
          </span>
          <h2 className="h2" data-r>
            <span className="ln">
              <span>Fikirden ölçüme,</span>
            </span>
            <span className="ln">
              <span>tek çatı altında.</span>
            </span>
          </h2>
          <ServiceCards services={services} />
        </div>
      </section>

      {/* ÇALIŞMALAR — sticky galeri */}
      <WorkGallery
        items={galleryItems}
        eyebrow={sections.gallery?.eyebrow ?? undefined}
        title={sections.gallery?.title ?? undefined}
      />

      {/* İSTATİSTİK BANDI — sayaçlı (Referansların üstü, admin'den yönetilir) */}
      {showStats ? (
        <StatsBand
          eyebrow={statsSection?.eyebrow ?? null}
          title={statsSection?.title ?? null}
          accent={statsBody.accent ?? null}
          lead={statsBody.lead ?? null}
          items={statsItems}
        />
      ) : null}

      {/* REFERANSLARIMIZ — 2 şerit simetrik logo marquee */}
      <ReferencesSection />

      {/* HAKKIMIZDA */}
      <section className="sec alt" id="hakkimizda">
        <div className="wrap ab">
          <div>
            <span className="eyb" data-r>
              {sections.about?.eyebrow ?? "Hakkımızda"}
            </span>
            <h2 data-r>
              <AccentedTitle
                text={sections.about?.title ?? "Yaratıcılığı stratejiyle, stratejiyi ölçülebilir sonuçlarla birleştiriyoruz."}
                accent={(about.accent as string) ?? "stratejiyle"}
                tag="em"
              />
            </h2>
            <p className="lead" data-r>
              {aboutLead}
            </p>
            <div className="vals" data-r>
              {aboutValues.map((v) => (
                <div key={v.b}>
                  <b>{v.b}</b>
                  <span>{v.s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="abv" data-r>
            <figure className="a1">
              { }
              <img src={heroImgSrc(aboutImages[0]?.mediaKey ?? "gallery/gallery-14.webp")} alt={aboutImages[0]?.alt ?? "Takım çekimi"} />
            </figure>
            <figure className="a2">
              { }
              <img src={heroImgSrc(aboutImages[1]?.mediaKey ?? "gallery/gallery-13.webp")} alt={aboutImages[1]?.alt ?? "Takım bütünlüğü"} />
            </figure>
          </div>
        </div>
      </section>

      {/* SÜREÇ */}
      <section className="sec" id="surec">
        <div className="wrap">
          <span className="eyb" data-r>
            {sections.process?.eyebrow ?? "Çalışma Sürecimiz"}
          </span>
          <h2 className="h2" data-r>
            <AccentedTitle
              text={sections.process?.title ?? "Beş adımda, net bir yol."}
              accent={(process.accent as string) ?? "net bir yol."}
              tag="span"
              style={{ color: "var(--pl)" }}
            />
          </h2>
          <div className="pr" id="prc">
            {steps.map((p, i) => (
              <div className="st" data-r key={p.title}>
                <div className="n" data-count={i + 1}>
                  00
                </div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG ÖZET */}
      <section className="sec alt" id="blog-ozet">
        <div className="wrap">
          <div className="bh">
            <div>
              <span className="eyb" data-r>
                {sections["blog-preview"]?.eyebrow ?? "Blog"}
              </span>
              <h2 className="h2" data-r>
                {sections["blog-preview"]?.title ?? "Son yazılar"}
              </h2>
            </div>
            <Link className="btn" href={blogCta?.href ?? "/blog"} data-r>
              {blogCta?.label ?? "Tüm Yazılar"}{" "}
              <svg className="i">
                <use href="#i-arr" />
              </svg>
            </Link>
          </div>
          <div className="bgrid" id="bhome">
            {postItems.slice(0, 4).map((p, i) => (
              <PostCard
                key={p.slug}
                slug={p.slug}
                category={p.category}
                title={p.title}
                excerpt={p.excerpt}
                date={p.date}
                cover={p.cover}
                cls={CLS[i] ?? ""}
              />
            ))}
          </div>
        </div>
      </section>

      {/* İLETİŞİM */}
      <section className="sec" id="iletisim">
        <div className="wrap ct">
          <div>
            <span className="eyb" data-r>
              {sections.contact?.eyebrow ?? "İletişim"}
            </span>
            <h2 data-r>{sections.contact?.title ?? "Markanız için yeni bir başlangıca hazır mısınız?"}</h2>
            <p className="lead" data-r>
              {(contact.lead as string) ?? "Hedeflerinizi anlatın; size uygun içerik, prodüksiyon ve reklam planını birlikte şekillendirelim."}
            </p>
            <div className="cl" data-r>
              {contactInfo.map((c) => (
                <div key={c.icon}>
                  <svg className="i">
                    <use href={`#i-${c.icon}`} />
                  </svg>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
            <div className="so" data-r>
              {socialLinks.map((s) => (
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
          <aside className="ptn" data-r aria-label="Partnerlerimiz">
            <span className="eyb">Partnerlerimiz</span>
            <h3>
              Güvenilir platformların <em>resmî iş ortağıyız</em>
            </h3>
            <div className="ptn-grid">
              {/* Mor zeminli marka logosu: karo zeminini şeffaflaştır, logonun arkasına fon eklenmez. */}
              <div className="ptn-tile me" style={{ background: "transparent" }}>
                <img src={settings.logoUrl || "/assets/logo.png"} alt="NOF Dijital" />
              </div>
              <div className="ptn-tile">
                <img src="/assets/partners/meta.svg" alt="Meta Business" />
                <span>Meta Business</span>
              </div>
              <div className="ptn-tile">
                <img src="/assets/partners/google-wordmark.png" alt="Google Partner" />
                <span>Google Partner</span>
              </div>
              <div className="ptn-tile">
                <img src="/assets/partners/tiktok.svg" alt="TikTok Marketing" />
                <span>TikTok Marketing</span>
              </div>
            </div>
            <p className="ptn-note">
              <svg className="i">
                <use href="#i-ck" />
              </svg>
              <span>
                Meta Business, Google Partner ve TikTok Marketing iş ortaklıklarıyla kampanyalarınız resmî
                kanallardan yönetilir.
              </span>
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
