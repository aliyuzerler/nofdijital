import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import type { JSX } from "react";

/** shadcn/ui temel bileşenleri — admin panelde kullanılan primitifler. */

const meta: Meta = {
  title: "UI/Temel Bileşenler",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};
export default meta;

export const Buttons: StoryObj = {
  name: "Button (varyantlar)",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Varsayılan</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button size="sm">Küçük</Button>
      <Button size="lg">Büyük</Button>
      <Button disabled>Devre dışı</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ghost = canvas.getByRole("button", { name: "Ghost" });
    await userEvent.click(ghost);
    await expect(ghost).toBeEnabled();
  },
};

export const Badges: StoryObj = {
  name: "Badge (varyantlar)",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Varsayılan</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const CardExample: StoryObj = {
  name: "Card",
  render: (): JSX.Element => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>NOF DİJİTAL</CardTitle>
        <CardDescription>Sosyal medya, reklam yönetimi ve prodüksiyon.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="sb-mail">E-posta</Label>
          <Input id="sb-mail" placeholder="ornek@nofdigital.com" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">İletişime geç</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // test-runner ortamında getByPlaceholder yok — label eşleşmesi kullanılır
    const mail = canvas.getByLabelText("E-posta");
    await userEvent.type(mail, "test@nofdigital.local");
    await expect(mail).toHaveValue("test@nofdigital.local");
  },
};

export const SwitchExample: StoryObj = {
  name: "Switch (kontrollü)",
  render: () => {
    function Demo() {
      const [on, setOn] = useState(false);
      return (
        <div className="flex items-center gap-3">
          <Switch id="sb-sw" checked={on} onCheckedChange={setOn} />
          <Label htmlFor="sb-sw">{on ? "Açık" : "Kapalı"}</Label>
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch");
    await userEvent.click(sw);
    await expect(canvas.getByText("Açık")).toBeVisible();
  },
};

export const AlertExample: StoryObj = {
  name: "Alert",
  render: () => (
    <Alert className="max-w-md">
      <AlertTitle>Bilgi</AlertTitle>
      <AlertDescription>Örnek uyarı metni — panel aksiyonları için geri bildirim bloğu.</AlertDescription>
    </Alert>
  ),
};
