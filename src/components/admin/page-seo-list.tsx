"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { savePageSeo, type PageSeoRow } from "@/features/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function PageSeoForm({ row }: { row: PageSeoRow }) {
  const router = useRouter();
  const [seoTitle, setSeoTitle] = useState(row.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(row.seoDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(row.canonicalUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await savePageSeo({ pageId: row.id, seoTitle, seoDescription, canonicalUrl });
      if (res.ok) {
        toast.success("SEO bilgileri kaydedildi.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-neutral-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-neutral-900">
          {row.title} <span className="text-sm font-normal text-neutral-400">/{row.slug === "home" ? "" : row.slug}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4" aria-label={`${row.title} SEO formu`}>
          <div className="space-y-2">
            <Label htmlFor={`seo-title-${row.id}`}>SEO başlığı</Label>
            <Input id={`seo-title-${row.id}`} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Tarayıcı sekmesi ve arama sonucu başlığı" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`seo-desc-${row.id}`}>SEO açıklaması</Label>
            <textarea
              id={`seo-desc-${row.id}`}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#9335FF]"
              placeholder="Arama sonucu snippet açıklaması"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`seo-canonical-${row.id}`}>Canonical URL</Label>
            <Input id={`seo-canonical-${row.id}`} value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://… (boş bırakılabilir)" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PageSeoList({ rows }: { rows: PageSeoRow[] }) {
  if (rows.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">Sayfa kaydı bulunamadı.</p>;
  }
  return (
    <div className="space-y-5">
      {rows.map((r) => (
        <PageSeoForm key={r.id} row={r} />
      ))}
    </div>
  );
}
