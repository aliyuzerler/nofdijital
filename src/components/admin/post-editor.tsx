"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { savePost } from "@/features/admin/blog/actions";
import type { MediaRow } from "@/features/admin/media/actions";
import { slugifyTr } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPickerDialog } from "@/components/admin/media-picker";

export interface PostInitial {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyJson: Record<string, unknown>;
  categoryId: string | null;
  coverMediaId: string | null;
  coverUrl: string | null;
  ogImageId: string | null;
  ogUrl: string | null;
  readingMinutes: number;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  status: "draft" | "scheduled" | "published" | "archived";
}

type PickerMode = "cover" | "og" | "inline" | null;

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn("h-8 w-8 p-0", active && "bg-[#8254D8]/15 text-[#7143C2]")}
    >
      {children}
    </Button>
  );
}

export function PostEditor({
  categories,
  initial,
}: {
  categories: Array<{ id: string; name: string }>;
  initial: PostInitial | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [cover, setCover] = useState<{ id: string; url: string } | null>(
    initial?.coverMediaId && initial?.coverUrl ? { id: initial.coverMediaId, url: initial.coverUrl } : null,
  );
  const [og, setOg] = useState<{ id: string; url: string } | null>(
    initial?.ogImageId && initial?.ogUrl ? { id: initial.ogImageId, url: initial.ogUrl } : null,
  );
  const [readingMinutes, setReadingMinutes] = useState(initial?.readingMinutes ?? 5);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonicalUrl ?? "");
  const [robotsIndex, setRobotsIndex] = useState(initial?.robotsIndex ?? true);
  const [robotsFollow, setRobotsFollow] = useState(initial?.robotsFollow ?? true);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: initial?.bodyJson ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class: "nof-editor-content focus:outline-none",
        "aria-label": "Yazı gövdesi",
      },
    },
  });

  useEffect(() => {
    if (!slugEdited) setSlug(slugifyTr(title));
  }, [title, slugEdited]);

  function onPick(row: MediaRow) {
    if (pickerMode === "cover") setCover({ id: row.id, url: row.publicUrl });
    else if (pickerMode === "og") setOg({ id: row.id, url: row.publicUrl });
    else editor?.chain().focus().setImage({ src: row.publicUrl, alt: row.altText ?? row.originalFilename }).run();
  }

  function addLink() {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
     
    const url = window.prompt("Bağlantı adresi (https://…)", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
  }

  async function persist(status: PostInitial["status"]) {
    if (!editor) return;
    if (title.trim().length < 2) {
      toast.error("Başlık en az 2 karakter olmalı.");
      return;
    }
    if (slug.trim().length < 1) {
      toast.error("Slug boş olamaz.");
      return;
    }
    if (excerpt.trim().length < 1) {
      toast.error("Spot metni gerekli.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: initial?.id ?? undefined,
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        bodyJson: editor.getJSON() as Record<string, unknown>,
        categoryId: categoryId || null,
        coverMediaId: cover?.id ?? null,
        ogImageId: og?.id ?? null,
        readingMinutes,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        canonicalUrl: canonicalUrl.trim() || null,
        robotsIndex,
        robotsFollow,
        status,
      };
      const res = await savePost(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(status === "published" ? "Yazı yayınlandı." : "Yazı kaydedildi.");
      if (!initial) {
        router.push(`/admin/blog/${res.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const isPublished = initial?.status === "published";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {initial ? "Yazıyı düzenle" : "Yeni yazı"}
          </h1>
          {initial ? (
            <p className="mt-1 text-sm text-neutral-500">
              Durum: {isPublished ? "Yayında" : initial.status === "draft" ? "Taslak" : initial.status === "scheduled" ? "Zamanlanmış" : "Arşiv"} · Revizyon geçmişi her kayıtta tutulur.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={saving} onClick={() => void persist(isPublished ? "published" : "draft")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {initial ? "Kaydet" : "Taslak olarak kaydet"}
          </Button>
          {!isPublished ? (
            <Button disabled={saving} className="bg-[#8254D8] text-white hover:bg-[#7143C2]" onClick={() => void persist("published")}>
              Yayınla
            </Button>
          ) : (
            <>
              <Button variant="outline" disabled={saving} onClick={() => void persist("draft")}>
                Yayından kaldır
              </Button>
              <Button variant="outline" disabled={saving} onClick={() => void persist("archived")}>
                Arşivle
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Sol: içerik */}
        <div className="space-y-5">
          <Card className="border-neutral-200">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Yazı başlığı" className="text-lg font-semibold" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="hidden shrink-0 text-sm text-neutral-400 sm:inline">/blog/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(slugifyTr(e.target.value));
                    }}
                    placeholder="yazi-slug"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Spot (excerpt)</Label>
                <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Liste kartlarında görünen kısa özet" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Gövde</CardTitle>
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
                <ToolbarButton label="Kalın" onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} disabled={!editor?.can().toggleBold()}>
                  <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="İtalik" onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} disabled={!editor?.can().toggleItalic()}>
                  <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Başlık 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })}>
                  <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Başlık 3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })}>
                  <Heading3 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Madde listesi" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")}>
                  <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Numaralı liste" onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")}>
                  <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Alıntı" onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")}>
                  <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Yatay çizgi" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
                  <Minus className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Bağlantı" onClick={addLink} active={editor?.isActive("link")}>
                  <Link2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Görsel ekle" onClick={() => setPickerMode("inline")}>
                  <ImageIcon className="h-4 w-4" />
                </ToolbarButton>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <ToolbarButton label="Geri al" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
                  <Undo2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Yinele" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
                  <Redo2 className="h-4 w-4" />
                </ToolbarButton>
              </div>
            </CardHeader>
            <CardContent>
              {editor ? (
                <EditorContent editor={editor} className="nof-editor max-w-none" />
              ) : (
                <div className="flex h-64 items-center justify-center text-neutral-400">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ: meta */}
        <div className="space-y-5">
          <Card className="border-neutral-200">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#8254D8]"
                >
                  <option value="">Kategori seçilmedi</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reading">Okuma süresi (dk)</Label>
                <Input
                  id="reading"
                  type="number"
                  min={1}
                  max={180}
                  value={readingMinutes}
                  onChange={(e) => setReadingMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-2">
                <Label>Kapak görseli</Label>
                {cover ? (
                  <div className="relative overflow-hidden rounded-lg border border-neutral-200">
                    { }
                    <img src={cover.url} alt="Kapak görseli" className="aspect-video w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7"
                      aria-label="Kapağı kaldır"
                      onClick={() => setCover(null)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setPickerMode("cover")}>
                  <ImageIcon className="h-4 w-4" /> {cover ? "Kapağı değiştir" : "Kapak seç"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO başlığı</Label>
                <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Boşsa yazı başlığı kullanılır" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDesc">SEO açıklaması</Label>
                <Textarea id="seoDesc" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} placeholder="Boşsa spot metni kullanılır" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonical">Canonical URL</Label>
                <Input id="canonical" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label>OG görseli</Label>
                {og ? (
                  <div className="relative overflow-hidden rounded-lg border border-neutral-200">
                    { }
                    <img src={og.url} alt="OG görseli" className="aspect-video w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7"
                      aria-label="OG görselini kaldır"
                      onClick={() => setOg(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setPickerMode("og")}>
                  <ImageIcon className="h-4 w-4" /> {og ? "OG görselini değiştir" : "OG görseli seç"}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="robotsIndex" className="text-sm font-normal">
                  Arama motorlarında göster (index)
                </Label>
                <Switch id="robotsIndex" checked={robotsIndex} onCheckedChange={setRobotsIndex} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="robotsFollow" className="text-sm font-normal">
                  Bağlantıları takip et (follow)
                </Label>
                <Switch id="robotsFollow" checked={robotsFollow} onCheckedChange={setRobotsFollow} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaPickerDialog open={pickerMode !== null} onOpenChange={(v) => !v && setPickerMode(null)} onPick={onPick} mode={pickerMode ?? "inline"} />
    </div>
  );
}
