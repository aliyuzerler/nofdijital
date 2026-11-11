"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Image as ImageIcon, Loader2, Pencil, Search, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia, updateMediaMeta, type MediaRow } from "@/features/admin/media/actions";
import { formatTrDateSafe } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function MediaManager({ initialRows }: { initialRows: MediaRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<MediaRow[]>(initialRows);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async (q: string) => {
    const { listMedia } = await import("@/features/admin/media/actions");
    setRows(await listMedia(q));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void refresh(query), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [query, refresh]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setUploadCount(list.length);
    try {
      const form = new FormData();
      for (const f of list) form.append("files", f);
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = (await res.json()) as {
        ok: boolean;
        results?: Array<{ duplicate: boolean }>;
        errors?: string[];
        error?: string;
      };
      if (!data.ok) {
        toast.error(data.error ?? "Yükleme başarısız.");
      } else {
        const dups = data.results?.filter((r) => r.duplicate).length ?? 0;
        const added = (data.results?.length ?? 0) - dups;
        if (added > 0) toast.success(`${added} dosya yüklendi.`);
        if (dups > 0) toast.info(`${dups} dosya zaten mevcut (aynı içerik).`);
        for (const e of data.errors ?? []) toast.warning(e);
        router.refresh();
      }
      await refresh(query);
    } catch {
      toast.error("Yükleme başarısız. Bağlantıyı kontrol edin.");
    } finally {
      setUploading(false);
      setUploadCount(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const [editTarget, setEditTarget] = useState<MediaRow | null>(null);
  const [altText, setAltText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openEdit(row: MediaRow) {
    setEditTarget(row);
    setAltText(row.altText ?? "");
    setEditTitle(row.title ?? "");
  }

  async function saveMeta() {
    if (!editTarget) return;
    const res = await updateMediaMeta({ id: editTarget.id, altText, title: editTitle });
    if (res.ok) {
      toast.success("Medya bilgileri güncellendi.");
      setEditTarget(null);
      await refresh(query);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function remove(row: MediaRow) {
    if (deletingId) return;
    setDeletingId(row.id);
    try {
      const res = await deleteMedia({ id: row.id });
      if (res.ok) {
        toast.success("Medya silindi.");
        await refresh(query);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function copyUrl(row: MediaRow) {
    void navigator.clipboard.writeText(row.publicUrl);
    toast.success("URL kopyalandı.");
  }

  return (
    <div className="space-y-5">
      {/* Yükleme alanı */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Dosya yüklemek için tıklayın veya sürükleyip bırakın"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-[#9335FF] bg-[#9335FF]/5" : "border-neutral-300 bg-white hover:border-[#9335FF]/60"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[#9335FF]" aria-hidden />
            <p className="text-sm font-medium text-neutral-700">{uploadCount} dosya yükleniyor…</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-[#9335FF]" aria-hidden />
            <p className="text-sm font-medium text-neutral-700">Dosyaları buraya sürükleyin veya tıklayın</p>
            <p className="text-xs text-neutral-400">JPEG, PNG, WebP, AVIF · en fazla 10 MB · aynı içerik tekilleştirilir</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />
      </div>

      {/* Arama */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Dosya adı veya alt metin ara…" className="pl-9" aria-label="Medya ara" />
      </div>

      {/* Grid */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-white/60 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9335FF]/10" aria-hidden>
            <ImageIcon className="h-5 w-5 text-[#9335FF]" />
          </div>
          <p className="text-sm font-semibold text-neutral-700">
            {query ? "Aramanızla eşleşen medya bulunamadı." : "Henüz medya yok."}
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-neutral-400">
            {query
              ? "Farklı bir dosya adı veya alt metinle aramayı deneyin."
              : "Yukarıdaki alana dosya sürükleyin veya tıklayarak yükleyin; yüklediğiniz görseller burada listelenir."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((r) => (
            <div key={r.id} className="group overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <div className="relative">
                { }
                <img src={r.publicUrl} alt={r.altText ?? r.originalFilename} className="aspect-video w-full object-cover" loading="lazy" />
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button type="button" size="icon" variant="secondary" className="h-7 w-7" aria-label="Bilgileri düzenle" onClick={() => openEdit(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="secondary" className="h-7 w-7" aria-label="URL kopyala" onClick={() => copyUrl(r)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    aria-label="Sil"
                    disabled={deletingId === r.id}
                    onClick={() => void remove(r)}
                  >
                    {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-0.5 p-3">
                <p className="truncate text-sm font-medium text-neutral-900" title={r.originalFilename}>
                  {r.originalFilename}
                </p>
                <p className="text-xs text-neutral-500">
                  {r.width && r.height ? `${r.width}×${r.height} · ` : ""}
                  {(r.sizeBytes / 1024).toFixed(0)} KB · {formatTrDateSafe(r.createdAt)}
                </p>
                {r.altText ? <p className="truncate text-xs text-neutral-400" title={r.altText}>{r.altText}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Düzenleme diyaloğu */}
      <Dialog open={editTarget !== null} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Medya bilgileri</DialogTitle>
            <DialogDescription className="truncate">{editTarget?.originalFilename}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-alt">Alt metin</Label>
              <Input id="media-alt" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Görselin erişilebilir açıklaması" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-title">Başlık</Label>
              <Input id="media-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="İsteğe bağlı başlık" />
            </div>
            {editTarget ? (
              <div className="space-y-1 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">
                <p className="break-all">URL: {editTarget.publicUrl}</p>
                <p>
                  {editTarget.mimeType} · {editTarget.width}×{editTarget.height} · {(editTarget.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Vazgeç
            </Button>
            <Button className="bg-[#9335FF] text-white hover:bg-[#8426F2]" onClick={() => void saveMeta()}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
