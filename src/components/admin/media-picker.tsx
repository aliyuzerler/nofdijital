"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { listMedia, type MediaRow } from "@/features/admin/media/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaPickerMode = "cover" | "og" | "inline";

/** Medya kütüphanesinden görsel seçme diyaloğu (kapak/OG/editör içi). */
export function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (row: MediaRow) => void;
  mode: MediaPickerMode;
}) {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const list = await listMedia(q);
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void fetchRows(query), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, query, fetchRows]);

  const title = mode === "inline" ? "Editöre görsel ekle" : mode === "cover" ? "Kapak görseli seç" : "OG görseli seç";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Medya kütüphanesinden seçin. Yeni dosyalar Medya sayfasından yüklenir.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dosya adı veya alt metin ara…"
            className="pl-9"
            aria-label="Medya ara"
          />
        </div>
        <div className="admin-scroll grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {loading && rows.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-10 text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            </div>
          ) : rows.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-neutral-500">Medya bulunamadı.</p>
          ) : (
            rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onPick(r);
                  onOpenChange(false);
                }}
                className={cn(
                  "group overflow-hidden rounded-lg border border-neutral-200 text-left transition-colors hover:border-[#9335FF]",
                  "focus-visible:outline-2 focus-visible:outline-[#9335FF]",
                )}
              >
                { }
                <img src={r.publicUrl} alt={r.altText ?? r.originalFilename} className="aspect-video w-full object-cover" />
                <span className="block truncate px-2 py-1.5 text-xs text-neutral-600">{r.originalFilename}</span>
              </button>
            ))
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
