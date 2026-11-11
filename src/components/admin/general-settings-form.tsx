"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveGeneralSettings, type GeneralSettings } from "@/features/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GeneralSettingsForm({ initial }: { initial: GeneralSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<GeneralSettings>(initial);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveGeneralSettings(form);
      if (res.ok) {
        toast.success("Ayarlar kaydedildi ve siteye yansıtıldı.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" aria-label="Genel site ayarları">
      <Card className="border-neutral-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-neutral-900">İletişim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wa-number">WhatsApp numarası</Label>
            <Input id="wa-number" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="905xxxxxxxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 …" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@nofdigital.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Şehir, semt…" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-neutral-900">Sosyal Medya</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ig">Instagram</Label>
            <Input id="ig" value={form.social.instagram} onChange={(e) => setForm({ ...form, social: { ...form.social, instagram: e.target.value } })} placeholder="https://instagram.com/…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="li">LinkedIn</Label>
            <Input id="li" value={form.social.linkedin} onChange={(e) => setForm({ ...form, social: { ...form.social, linkedin: e.target.value } })} placeholder="https://linkedin.com/…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yt">YouTube</Label>
            <Input id="yt" value={form.social.youtube} onChange={(e) => setForm({ ...form, social: { ...form.social, youtube: e.target.value } })} placeholder="https://youtube.com/…" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
        </Button>
      </div>
    </form>
  );
}
