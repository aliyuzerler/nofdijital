"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveHomeSection, type HomeSectionRow } from "@/features/admin/home/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const SECTION_LABEL: Record<string, string> = {
  hero: "Hero (Kapak)",
  services: "Hizmetler",
  gallery: "Galeri",
  about: "Hakkımızda",
  process: "Süreç",
  "blog-preview": "Blog Önizleme",
  contact: "İletişim",
};

function CtaFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { label: string; href: string };
  onChange: (v: { label: string; href: string }) => void;
}) {
  return (
    <fieldset className="space-y-2 rounded-lg border border-neutral-200 p-3">
      <legend className="px-1 text-xs font-medium text-neutral-500">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} placeholder="Buton metni" aria-label={`${label} metni`} />
        <Input value={value.href} onChange={(e) => onChange({ ...value, href: e.target.value })} placeholder="/#hedef" aria-label={`${label} hedefi`} />
      </div>
    </fieldset>
  );
}

function SectionForm({ section }: { section: HomeSectionRow }) {
  const router = useRouter();
  const [eyebrow, setEyebrow] = useState(section.eyebrow ?? "");
  const [title, setTitle] = useState(section.title ?? "");
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [lead, setLead] = useState(section.lead ?? "");
  const [chip, setChip] = useState(section.chip ?? "");
  const [accent, setAccent] = useState(section.accent ?? "");
  const [ctaPrimary, setCtaPrimary] = useState(section.ctaPrimary ?? { label: "", href: "" });
  const [ctaSecondary, setCtaSecondary] = useState(section.ctaSecondary ?? { label: "", href: "" });
  const [cta, setCta] = useState(section.cta ?? { label: "", href: "" });
  const [saving, setSaving] = useState(false);

  const hasCtaPrimary = section.ctaPrimary !== null;
  const hasCtaSecondary = section.ctaSecondary !== null;
  const hasCta = section.cta !== null;

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { sectionId: section.id, eyebrow, title, isVisible };
      if (section.lead !== null) payload.lead = lead;
      if (section.chip !== null) payload.chip = chip;
      if (section.accent !== null) payload.accent = accent;
      if (hasCtaPrimary) payload.ctaPrimary = ctaPrimary;
      if (hasCtaSecondary) payload.ctaSecondary = ctaSecondary;
      if (hasCta) payload.cta = cta;
      const res = await saveHomeSection(payload);
      if (res.ok) {
        toast.success("Bölüm kaydedildi.");
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
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-neutral-900">{SECTION_LABEL[section.sectionKey] ?? section.sectionKey}</CardTitle>
          <p className="text-xs text-neutral-400">
            anahtar: {section.sectionKey} · tip: {section.sectionType} · sıra: {section.position}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`vis-${section.id}`} className="text-sm font-normal text-neutral-500">
            Görünür
          </Label>
          <Switch id={`vis-${section.id}`} checked={isVisible} onCheckedChange={setIsVisible} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`eyebrow-${section.id}`}>Eyebrow (üst etiket)</Label>
            <Input id={`eyebrow-${section.id}`} value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`title-${section.id}`}>Başlık</Label>
            <Input id={`title-${section.id}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        {section.lead !== null ? (
          <div className="space-y-2">
            <Label htmlFor={`lead-${section.id}`}>Lead (tanıtım metni)</Label>
            <textarea
              id={`lead-${section.id}`}
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#8254D8]"
            />
          </div>
        ) : null}

        {section.chip !== null ? (
          <div className="space-y-2">
            <Label htmlFor={`chip-${section.id}`}>Chip (küçük rozet metni)</Label>
            <Input id={`chip-${section.id}`} value={chip} onChange={(e) => setChip(e.target.value)} />
          </div>
        ) : null}

        {section.accent !== null ? (
          <div className="space-y-2">
            <Label htmlFor={`accent-${section.id}`}>Vurgulu kelime</Label>
            <Input id={`accent-${section.id}`} value={accent} onChange={(e) => setAccent(e.target.value)} />
          </div>
        ) : null}

        {hasCtaPrimary ? <CtaFields label="Ana buton (ctaPrimary)" value={ctaPrimary} onChange={setCtaPrimary} /> : null}
        {hasCtaSecondary ? <CtaFields label="İkincil buton (ctaSecondary)" value={ctaSecondary} onChange={setCtaSecondary} /> : null}
        {hasCta ? <CtaFields label="Buton (cta)" value={cta} onChange={setCta} /> : null}

        <Separator />
        <div className="flex justify-end">
          <Button onClick={() => void save()} disabled={saving} className="bg-[#8254D8] text-white hover:bg-[#7143C2]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomeSections({
  pageId,
  sections,
}: {
  pageId: string;
  sections: HomeSectionRow[];
}) {
  if (!pageId || sections.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">Ana sayfa bölümleri bulunamadı. Önce seed çalıştırılmış olmalı.</p>;
  }
  return (
    <div className="space-y-5">
      {sections.map((s) => (
        <SectionForm key={s.id} section={s} />
      ))}
    </div>
  );
}
