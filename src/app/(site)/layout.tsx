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
import { getGalleryItems } from "@/server/services/repositories";
import { getDb } from "@/server/db";
import { pages } from "@/server/db/schema";
import { eq } from "drizzle-orm";

/** Ana sayfa SEO alanları (pages tablosu, slug=home) → tüm (site) rotalarına akar. */
export async function generateMetadata(): Promise<Metadata> {
  const FALLBACK: Metadata = {
    title: "NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
    description: "Sosyal medya yönetimi, Google & Meta Ads, fotoğraf, video ve prodüksiyon hizmetleri.",
  };
  try {
    const db = await getDb();
    const row = (
      await db
        .select({ seoTitle: pages.seoTitle, seoDescription: pages.seoDescription, canonicalUrl: pages.canonicalUrl })
        .from(pages)
        .where(eq(pages.slug, "home"))
        .limit(1)
    )[0];
    if (!row) return FALLBACK;
    return {
      title: row.seoTitle ?? FALLBACK.title,
      description: row.seoDescription ?? FALLBACK.description,
      alternates: row.canonicalUrl ? { canonical: row.canonicalUrl } : undefined,
    };
  } catch {
    return FALLBACK;
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, galleryItems] = await Promise.all([getPublicSettings(), getGalleryItems()]);
  return (
    <>
      <IconSprite />
      <CanvasBackground />
      <SiteHeader />
      <RevealProvider />
      <main>{children}</main>
      <SiteFooter />
      <WhatsAppButton number={settings.whatsappNumber} />
      <Lightbox items={galleryItems} />
      <ToastHost />
    </>
  );
}
