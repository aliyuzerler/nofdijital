import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { ServiceCards } from "@/components/site/cards";
import { PressCards } from "@/components/site/press-cards";
import { ReferencesSection } from "@/components/site/references-section";
import { SERVICES, type ServiceItem } from "@/content/reference-data";
import type { PressItemView } from "@/server/services/repositories";

/** Public site ana bölümleri: 7 hizmet kartı ve Basında Biz kartı (blog 14.11.2026'da kaldırıldı). */

const meta: Meta = {
  title: "Site/Bölümler",
  parameters: { layout: "fullscreen" },
};
export default meta;

export const SevenServiceCards: StoryObj = {
  name: "Hizmet Kartları (7)",
  render: () => (
    <div style={{ background: "var(--bg, #0b0b12)", minHeight: "100vh", padding: "48px 24px" }}>
      <ServiceCards services={SERVICES as ServiceItem[]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Brief gereksinimi: tam 7 hizmet kartı
    const cards = within(canvasElement).getAllByText(/.+/).filter(() => true);
    const articles = canvasElement.querySelectorAll("article.card");
    expect(articles.length).toBe(7);
    expect(cards.length).toBeGreaterThan(7);
  },
};

const PRESS_SAMPLE: PressItemView[] = [
  {
    id: "press-1",
    url: "https://ornek-yayin.com/haber/nof-digital",
    imageUrl: "/assets/gallery/gallery-01.webp",
    description: "NOF Digital'ın ürettiği kampanya, örnek yayında ayın işleri arasında gösterildi.",
    sourceName: "Örnek Yayın",
  },
];

export const PressCardExample: StoryObj = {
  name: "Basında Biz Kartı",
  render: () => (
    <div style={{ background: "var(--bg, #0b0b12)", minHeight: "60vh", padding: "48px 24px" }}>
      <PressCards items={PRESS_SAMPLE} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector("a.pr") as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link!.getAttribute("href")).toBe("https://ornek-yayin.com/haber/nof-digital");
    expect(link!.getAttribute("target")).toBe("_blank");
    expect(link!.getAttribute("rel")).toContain("noopener");
    await userEvent.hover(link!);
  },
};

export const ReferencesMarquee: StoryObj = {
  name: "Referans Marquee (2 şerit)",
  render: () => (
    <div style={{ background: "var(--bg, #0b0b12)", minHeight: "60vh", padding: "48px 0" }}>
      <ReferencesSection />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Brief: simetrik 2 şerit — biri sağdan sola, diğeri soldan sağa
    const rows = canvasElement.querySelectorAll(".rfg-row");
    expect(rows.length).toBe(2);
    const t1 = rows[0]!.querySelector(".rfg-track") as HTMLElement;
    const t2 = rows[1]!.querySelector(".rfg-track") as HTMLElement;
    expect(getComputedStyle(t1).animationDirection).toBe("normal");
    expect(getComputedStyle(t2).animationDirection).toBe("reverse");
    // 15 benzersiz logo, döngü için iki katı render edilir
    expect(canvasElement.querySelectorAll(".rfg-chip img").length).toBe(30);
    // çip boyutu: logo 82px gösterim (kaynak büyütmesi yok — max 220px kaynak)
    expect(canvasElement.querySelectorAll<HTMLImageElement>(".rfg-chip img")[0]!.alt).toBeTruthy();
  },
};
