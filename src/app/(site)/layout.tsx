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
 *  Tarayıcı sekme ikonu (favicon) admin'de yüklenen logodan beslenir. */
export async function generateMetadata(): Promise<Metadata> {
  const FALLBACK: Metadata = {
    title: "NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
    description: "Sosyal medya yönetimi, Google & Meta Ads, fotoğraf, video ve prodüksiyon hizmetleri.",
    icons: { icon: [{ url: "/assets/logo.png", type: "image/png" }], apple: [{ url: "/assets/logo.png" }] },
  };
  try {
    const [settings, row] = await Promise.all([
      getPublicSettings(),
      (async () => {
        const db = await getDb();
        return (
          await db
            .select({ seoTitle: pages.seoTitle, seoDescription: pages.seoDescription, canonicalUrl: pages.canonicalUrl })
            .from(pages)
            .where(eq(pages.slug, "home"))
            .limit(1)
        )[0];
      })(),
    ]);
    const logo = settings.logoUrl || "/assets/logo.png";
    if (!row) return FALLBACK;
    return {
      title: row.seoTitle ?? FALLBACK.title,
      description: row.seoDescription ?? FALLBACK.description,
      alternates: row.canonicalUrl ? { canonical: row.canonicalUrl } : undefined,
      icons: { icon: [{ url: logo, type: "image/png" }], apple: [{ url: logo }] },
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
      {/* Marka logosu: nof.css'e dokunmadan kullanıcı talebiyle büyütme + oval köşeler
          (koyu/açık tema ve kaydırma durumu dahil). Header 34→44, kaydırınca 36, footer 40→52. */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "#hd .logo img{height:44px;border-radius:10px}#hd.sc .logo img{height:36px;border-radius:9px}footer .lg img{height:52px;border-radius:12px}",
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
