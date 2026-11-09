import Link from "next/link";
import { ContactForm } from "@/components/site/contact-form";
import { PostCard, ServiceCards } from "@/components/site/cards";
import { WorkGallery } from "@/components/site/work-gallery";
import { GALLERY, POSTS, PROCESS, SITE } from "@/content/reference-data";

const HERO_IMG = [
  { cls: "f1", i: 7, alt: "Stüdyo portre çekimi" },
  { cls: "f2", i: 2, alt: "Maç anı fotoğrafı" },
  { cls: "f3", i: 13, alt: "Takım fotoğrafı" },
];

export default function HomePage() {
  const CLS = ["s7", "s5", "s5", "s7"];
  const BAR_H = ["30%", "48%", "40%", "68%", "58%", "84%", "100%"];

  return (
    <div id="v-home">
      {/* HERO */}
      <section className="hero" id="top">
        <div className="wrap">
          <div className="in-load">
            <span className="eyb">Yaratıcı prodüksiyon × Performans pazarlama</span>
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
            <p className="lead">{SITE.heroLead}</p>
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
            <span className="chip">
              <svg className="i">
                <use href="#i-cam" />
              </svg>
              Foto · Video · Reklam
            </span>
            {HERO_IMG.map((h) => (
              <figure className={h.cls} key={h.cls}>
                <img src={GALLERY.files[h.i]} alt={h.alt} />
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
            Hizmetlerimiz
          </span>
          <h2 className="h2" data-r>
            <span className="ln">
              <span>Fikirden ölçüme,</span>
            </span>
            <span className="ln">
              <span>tek çatı altında.</span>
            </span>
          </h2>
          <ServiceCards />
        </div>
      </section>

      {/* ÇALIŞMALAR — sticky galeri */}
      <WorkGallery />

      {/* HAKKIMIZDA */}
      <section className="sec alt" id="hakkimizda">
        <div className="wrap ab">
          <div>
            <span className="eyb" data-r>
              Hakkımızda
            </span>
            <h2 data-r>
              Yaratıcılığı <em>stratejiyle</em>, stratejiyi ölçülebilir sonuçlarla birleştiriyoruz.
            </h2>
            <p className="lead" data-r>
              {SITE.aboutLead}
            </p>
            <div className="vals" data-r>
              {SITE.aboutValues.map((v) => (
                <div key={v.b}>
                  <b>{v.b}</b>
                  <span>{v.s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="abv" data-r>
            <figure className="a1">
              <img src={GALLERY.files[13]} alt="Takım çekimi" />
            </figure>
            <figure className="a2">
              <img src={GALLERY.files[12]} alt="Takım bütünlüğü" />
            </figure>
            <div className="pan">
              <small>Örnek performans paneli</small>
              <div className="bars">
                {BAR_H.map((h) => (
                  <i key={h} style={{ "--h": h } as React.CSSProperties} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SÜREÇ */}
      <section className="sec" id="surec">
        <div className="wrap">
          <span className="eyb" data-r>
            Çalışma Sürecimiz
          </span>
          <h2 className="h2" data-r>
            Beş adımda, <span style={{ color: "var(--pl)" }}>net bir yol.</span>
          </h2>
          <div className="pr" id="prc">
            {PROCESS.map((p, i) => (
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
                Blog
              </span>
              <h2 className="h2" data-r>
                Son yazılar
              </h2>
            </div>
            <Link className="btn" href="/blog" data-r>
              Tüm Yazılar{" "}
              <svg className="i">
                <use href="#i-arr" />
              </svg>
            </Link>
          </div>
          <div className="bgrid" id="bhome">
            {POSTS.slice(0, 4).map((p, i) => (
              <PostCard key={p.slug} slug={p.slug} category={p.category} title={p.title} excerpt={p.excerpt} date={p.date} cover={p.cover} cls={CLS[i] ?? ""} />
            ))}
          </div>
        </div>
      </section>

      {/* İLETİŞİM */}
      <section className="sec" id="iletisim">
        <div className="wrap ct">
          <div>
            <span className="eyb" data-r>
              İletişim
            </span>
            <h2 data-r>Markanız için yeni bir başlangıca hazır mısınız?</h2>
            <p className="lead" data-r>
              Hedeflerinizi anlatın; size uygun içerik, prodüksiyon ve reklam planını birlikte şekillendirelim.
            </p>
            <div className="cl" data-r>
              {SITE.contactInfo.map((c) => (
                <div key={c.icon}>
                  <svg className="i">
                    <use href={`#i-${c.icon}`} />
                  </svg>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
            <div className="so" data-r>
              <a href="/#iletisim" aria-label="Instagram (örnek)">
                <svg className="i">
                  <use href="#i-ig" />
                </svg>
              </a>
              <a href="/#iletisim" aria-label="LinkedIn (örnek)">
                <svg className="i">
                  <use href="#i-in" />
                </svg>
              </a>
              <a href="/#iletisim" aria-label="YouTube (örnek)">
                <svg className="i">
                  <use href="#i-yt" />
                </svg>
              </a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
