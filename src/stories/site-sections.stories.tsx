import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { PostCard, ServiceCards } from "@/components/site/cards";
import { ReferencesSection } from "@/components/site/references-section";
import { SERVICES, type ServiceItem } from "@/content/reference-data";

/** Public site ana bölümleri: 7 hizmet kartı ve blog kartı (Faz 2 birebir port). */

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

export const PostCardExample: StoryObj = {
  name: "Blog Kartı",
  render: () => (
    <div style={{ background: "var(--bg, #0b0b12)", minHeight: "60vh", padding: "48px 24px" }}>
      <PostCard
        slug="ornek-yazi"
        category="Sosyal Medya"
        title="Instagram takvimi nasıl kurulur?"
        excerpt="Haftalık içerik takvimini 30 dakikada kuran, ölçülebilir bir akış."
        date="10 Kas 2026"
        cover={0}
        cls="s5"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector("a.pc") as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link!.getAttribute("href")).toBe("/blog/ornek-yazi");
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
