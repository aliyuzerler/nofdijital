"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { saveGeneralSettings, type GeneralSettings } from "@/features/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_LOGO = "/assets/logo.png";

export function GeneralSettingsForm({ initial }: { initial: GeneralSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<GeneralSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Logo dosyasını medya API'sine yükler; dönen adresi logoya atar (Kaydet ile kalıcılaşır). */
  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const json = (await res.json()) as { ok: boolean; error?: string; results?: Array<{ publicUrl: string }> };
      if (!res.ok || !json.ok || !json.results?.[0]) {
        toast.error(json.error ?? "Logo yüklenemedi.");
        return;
      }
      setForm((f) => ({ ...f, logoUrl: json.results![0].publicUrl }));
      toast.success("Logo yüklendi. Kalıcı olması için 'Kaydet'e basın.");
    } catch {
      toast.error("Logo yüklenemedi.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
          <CardTitle className="text-base font-semibold text-neutral-900">Site Logosu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-neutral-200 bg-white p-2">
              <img src={form.logoUrl || DEFAULT_LOGO} alt="Site logosu" className="max-h-14 w-auto" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadLogo(f);
                }}
              />
              <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />} Logo yükle
              </Button>
              {form.logoUrl ? (
                <Button type="button" variant="ghost" onClick={() => setForm({ ...form, logoUrl: "" })}>
                  <RotateCcw className="h-4 w-4" /> Varsayılana dön
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-neutral-400">
            PNG/JPEG/WebP, en fazla 10 MB. Yüklenen logo üst menüde, alt bilgide ve partner kartında kullanılır.
            Kalıcı olması için sayfanın altındaki “Kaydet” düğmesine basın.
          </p>
        </CardContent>
      </Card>

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
