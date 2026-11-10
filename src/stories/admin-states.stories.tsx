import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Forbidden } from "@/components/admin/forbidden";

/**
 * Admin 403 ekranı — RBAC matrisinin görsel hali.
 * Not: Forbidden yalnızca tip düzeyinde sunucu guard'ından import eder (import type),
 * tarayıcı bundle'ına server-only kod girmez.
 */

const meta: Meta<typeof Forbidden> = {
  title: "Admin/Yetkisiz Ekranı",
  component: Forbidden,
  parameters: { layout: "fullscreen" },
};
export default meta;

export const EditorForbidden: StoryObj<typeof Forbidden> = {
  name: "Editör → owner alanı",
  render: () => (
    <div style={{ background: "#fafafa", minHeight: "50vh" }}>
      <Forbidden role="editor" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Bu alana erişim yetkiniz yok" })).toBeVisible();
    await expect(canvas.getByText(/Şu anki rolünüz: editör/)).toBeVisible();
  },
};

export const UnknownRole: StoryObj<typeof Forbidden> = {
  name: "Rol bilgisi olmadan",
  render: () => (
    <div style={{ background: "#fafafa", minHeight: "50vh" }}>
      <Forbidden />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Bu alana erişim yetkiniz yok" })).toBeVisible();
    expect(canvas.queryByText(/rolünüz/)).toBeNull();
  },
};
