import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { ToastHost } from "@/components/site/toast";
import { WhatsAppButton } from "@/components/site/whatsapp-button";

/** Site etkileşim parçaları: tema düğmesi (DEV-001) ve WhatsApp CTA. */

const meta: Meta = {
  title: "Site/Etkileşim",
  parameters: { layout: "centered" },
};
export default meta;

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--bg, #0b0b12)", padding: 48, borderRadius: 16 }}>{children}</div>;
}

export const ThemeToggleStory: StoryObj = {
  name: "Tema Düğmesi",
  render: () => (
    <Stage>
      <ThemeToggle />
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button", { name: /tema/i });
    const before = document.documentElement.getAttribute("data-theme");
    await userEvent.click(btn);
    const after = document.documentElement.getAttribute("data-theme");
    expect(after).not.toBe(before);
    // localStorage tercihi yazılır (DEV-001)
    const stored = localStorage.getItem("nof-theme");
    expect(stored).toBe(after);
    // geri al
    await userEvent.click(btn);
    expect(document.documentElement.getAttribute("data-theme")).toBe(before);
  },
};

export const WhatsAppButtonStory: StoryObj = {
  name: "WhatsApp Butonu",
  render: () => (
    <Stage>
      <WhatsAppButton number="905555555555" />
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button", { name: /WhatsApp/i });
    await expect(btn).toBeVisible();
  },
};

export const WhatsAppUnconfigured: StoryObj = {
  name: "WhatsApp Butonu (numara yok → uyarı)",
  render: () => (
    <Stage>
      {/* toast() olayını yakalayan host story içinde de mount edilir */}
      <ToastHost />
      <WhatsAppButton number="" />
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button", { name: /WhatsApp/i });
    // numara yok: window.open yerine toast uyarısı gösterilir (#toast host)
    await userEvent.click(btn);
    await waitFor(() => {
      expect(canvas.getByText(/numarası ayarlanmadı/i)).toBeVisible();
    });
  },
};
