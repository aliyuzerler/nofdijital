import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { PostCard, ServiceCards } from "@/components/site/cards";
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
