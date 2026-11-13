import type { Metadata } from "next";
import { CanvasBackground } from "@/components/site/canvas-background";
import { IconSprite } from "@/components/site/icons";
import { Lightbox } from "@/components/site/lightbox";
import { RevealProvider } from "@/components/site/reveal-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { ToastHost } from "@/components/site/toast";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getPublicSettings } from "@/server/services/settings";
import { getGalleryItems, getServices } from "@/server/services/repositories";
import { getDb } from "@/server/db";
import { pages } from "@/server/db/schema";
import { eq } from "drizzle-orm";

/** Ana sayfa SEO alanları (pages tablosu, slug=home) → tüm (site) rotalarına akar.
 *  Tarayıcı sekme ikonu (favicon) HER ZAMAN mor zeminli marka logosudur (14.11.2026
 *  kullanıcı talebi): admin'den yüklenen şeffaf logo sekmede görünmediği için
 *  favicon /assets/logo.png'e sabitlendi — admin logosu yalnızca header/footer'da.
 *  Sekme başlığı "NOF DİGİTAL" ile başlar: DB'deki eski "NOF DİJİTAL" öneki
 *  görüntülenirken düzeltilir + getHomeSections içindeki self-heal ile kalıcıdır. */
const FAVICON = {
  icon: [{ url: "/assets/logo.png", type: "image/png" }],
  apple: [{ url: "/assets/logo.png" }],
};
/** DB seoTitle'ındaki eski "NOF DİJİTAL" öneki → "NOF DİGİTAL" (marka logosundaki yazımla aynı). */
const normTitle = (t: string) => t.replace(/^NOF\s*D[İI]J[İI]TAL/i, "NOF DİGİTAL");

export async function generateMetadata(): Promise<Metadata> {
  const FALLBACK: Metadata = {
    title: "NOF DİGİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
    description: "Sosyal medya yönetimi, Google & Meta Ads, fotoğraf, video ve prodüksiyon hizmetleri.",
    icons: FAVICON,
  };
  try {
    const row = await (async () => {
      const db = await getDb();
      return (
        await db
          .select({ seoTitle: pages.seoTitle, seoDescription: pages.seoDescription, canonicalUrl: pages.canonicalUrl })
          .from(pages)
          .where(eq(pages.slug, "home"))
          .limit(1)
      )[0];
    })();
    if (!row) return FALLBACK;
    return {
      title: row.seoTitle ? normTitle(row.seoTitle) : FALLBACK.title,
      description: row.seoDescription ?? FALLBACK.description,
      alternates: row.canonicalUrl ? { canonical: row.canonicalUrl } : undefined,
      icons: FAVICON,
    };
  } catch {
    return FALLBACK;
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Hizmetler layout seviyesinde tek seferde okunur; header ve footer'a aynı veri akar.
  const [settings, galleryItems, services] = await Promise.all([
    getPublicSettings(),
    getGalleryItems(),
    getServices(),
  ]);
  return (
    <>
      {/* Marka logosu: nof.css'e dokunmadan kullanıcı talebiyle büyütme (14.11.2026:
          "logo küçük görünüyor" → 60px; ikinci talep "şeffaf zeminli logoları biraz
          daha büyüt" → 74px) + oval köşeler. Header 60→74, kaydırınca 44→52,
          footer 68→82; mobilde taşmayı önlemek için yükseklik+genişlik sınırı. */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "#hd .logo img{height:74px;border-radius:10px;max-width:300px;object-fit:contain}" +
            "#hd.sc .logo img{height:52px;border-radius:9px}" +
            "footer .lg img{height:82px;border-radius:12px}" +
            "@media(max-width:700px){#hd .logo img{height:56px;max-width:220px}#hd.sc .logo img{height:44px}}",
        }}
      />
      {/* Bölüm başlığı vurgu tonlaması (13.11.2026 güncelleme — kullanıcı talebi:
          "tüm vurgular tek ton"). Artık TEK ton ailesi: koyu tema/ koyu zemin →
          --pl (#b9a0ef), açık tema ve beyaz kart → --p (#8254d8). nof.css'teki
          sapmalar (#9335ff .stb-title em) burada ezilir; .acc-vivid da aynı tona
          çekildi (kontak+stats artık ayrı renk değil). Beyaz .ptn kartında
          okunabilirlik için --p kullanılır — 4.5:1 kontrast, aynı mor ailesi.
          Vurgulu em'lerde italik kapatılır — hero/.ab vurgularıyla aynı dil. */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "#v-home .acc-pl,#v-home .acc-vivid,#v-home .stb-title em{color:var(--pl);font-style:normal}" +
            'html[data-theme="light"] #v-home .acc-pl,html[data-theme="light"] #v-home .acc-vivid,html[data-theme="light"] #v-home .stb-title em{color:var(--p)}' +
            "#v-home .ptn h3 em{color:var(--p);font-style:normal}",
        }}
      />
      <IconSprite />
      <CanvasBackground />
      <SiteHeader logoUrl={settings.logoUrl} />
      <RevealProvider />
      <main>{children}</main>
      <SiteFooter settings={settings} services={services} />
      <WhatsAppButton number={settings.whatsappNumber} />
      <Lightbox items={galleryItems} />
      <ToastHost />
    </>
  );
}
