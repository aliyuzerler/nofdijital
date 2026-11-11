import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Admin popup formu (Dialog) — Süreç > "Yeni adım" panelinin birebir karşılığı.
 *
 * Neden önemli: koyu temada nof.css gövde metin rengi (beyaz) Radix portalına
 * yansırsa beyaz panel üstünde içerik görünmez olur (2026-11'de üretimde
 * yaşandı). Doğru kalıp: DialogContent üzerinde açık metin rengi (admin'de
 * admin.css portal kuralı, burada className ile) — play testi bunu garanti eder.
 */
const meta: Meta = {
  title: "UI/Popup Form (Dialog)",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};
export default meta;

/** Portal içeriğinde beyaz-üstüne-beyaz denetimi için renk okuma yardımcısı. */
function isWhiteColor(color: string): boolean {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !color) return false;
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return d[0] > 240 && d[1] > 240 && d[2] > 240;
}

function PopupFormDemo() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  return (
    <div>
      <Button onClick={() => setOpen(true)} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
        Yeni adım
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg text-neutral-900">
          <DialogHeader>
            <DialogTitle>Yeni adım</DialogTitle>
            <DialogDescription>Süreç bölümündeki adımlar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-title">Başlık</Label>
              <Input id="s-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Açıklama</Label>
              <textarea
                id="s-desc"
                rows={3}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#9335FF]"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="s-vis" className="text-sm font-normal">
                Görünür
              </Label>
              <Switch id="s-vis" defaultChecked />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button className="bg-[#9335FF] text-white hover:bg-[#8426F2]">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const PopupForm: StoryObj = {
  name: "Süreç > Yeni adım (koyu tema)",
  render: () => <PopupFormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1) Popup "Yeni adım" butonuyla açılır
    await userEvent.click(canvas.getByRole("button", { name: "Yeni adım" }));

    // 2) Portal gövdeye bağlanır; panel, başlık ve label metin rengi koyu olmalı
    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content).not.toBeNull();
    const contentColor = content ? getComputedStyle(content).color : "";
    expect(isWhiteColor(contentColor)).toBe(false);

    const titleEl = document.querySelector('[data-slot="dialog-title"]');
    expect(titleEl?.textContent).toBe("Yeni adım");
    if (titleEl) expect(isWhiteColor(getComputedStyle(titleEl).color)).toBe(false);

    const labelEl = Array.from(document.querySelectorAll('[data-slot="dialog-content"] label')).find(
      (l) => l.textContent === "Başlık",
    );
    expect(labelEl).not.toBeUndefined();
    if (labelEl) expect(isWhiteColor(getComputedStyle(labelEl).color)).toBe(false);

    // 3) Input etkileşimi: yazılan değer görünür şekilde geri döner
    const input = document.getElementById("s-title") as HTMLInputElement | null;
    expect(input).not.toBeNull();
    await userEvent.type(input!, "Depo Analizi");
    expect(input!.value).toBe("Depo Analizi");
    if (input) expect(isWhiteColor(getComputedStyle(input).color)).toBe(false);

    // 4) Vazgeç popup'ı kapatır
    await userEvent.click(within(document.body).getByRole("button", { name: "Vazgeç" }));
    await waitFor(() => expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull());
  },
};
