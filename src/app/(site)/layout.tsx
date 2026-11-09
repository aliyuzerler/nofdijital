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

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <>
      <IconSprite />
      <CanvasBackground />
      <SiteHeader />
      <RevealProvider />
      <main>{children}</main>
      <SiteFooter />
      <WhatsAppButton number={settings.whatsappNumber} />
      <Lightbox />
      <ToastHost />
    </>
  );
}
