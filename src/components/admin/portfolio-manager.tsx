"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  addGalleryItem,
  removeGalleryItem,
  replaceGalleryMedia,
  updateGalleryItem,
  type GalleryRow,
  type MediaOption,
} from "@/features/admin/portfolio/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Stüdyo duvarı tam 14 görselle çizilir (3 sahne × 7). */
const WALL_SIZE = 14;

type PickerMode = { kind: "add" } | { kind: "replace"; row: GalleryRow } | null;

export function PortfolioManager({ rows, mediaOptions }: { rows: GalleryRow[]; mediaOptions: MediaOption[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<GalleryRow | null>(null);
  const [form, setForm] = useState({ caption: "", altText: "", position: 0, isVisible: true });
  const [saving, setSaving] = useState(false);

  const [picker, setPicker] = useState<PickerMode>(null);
  const [pickedMediaId, setPickedMediaId] = useState<string | null>(null);
  const [pickerCaption, setPickerCaption] = useState("");
  const [pickerAlt, setPickerAlt] = useState("");
  const [pickerBusy, setPickerBusy] = useState(false);

  const [deleting, setDeleting] = useState<GalleryRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const visibleCount = useMemo(() => rows.filter((r) => r.isVisible).length, [rows]);
  const wallOk = visibleCount === WALL_SIZE;

  function openEdit(row: GalleryRow) {
    setTarget(row);
    setForm({ caption: row.caption ?? "", altText: row.altText, position: row.position, isVisible: row.isVisible });
  }

  function openAdd() {
    setPickedMediaId(null);
    setPickerCaption("");
    setPickerAlt("");
    setPicker({ kind: "add" });
  }

  function openReplace(row: GalleryRow) {
    setPickedMediaId(null);
    setPicker({ kind: "replace", row });
  }

  function pickMedia(m: MediaOption) {
    setPickedMediaId(m.id);
    if (picker?.kind === "add") {
      setPickerAlt(m.altText ?? "");
    }
  }

  async function submitPicker() {
    if (!picker || !pickedMediaId || pickerBusy) return;
    setPickerBusy(true);
    try {
      const res =
        picker.kind === "add"
          ? await addGalleryItem({ mediaId: pickedMediaId, caption: pickerCaption, altText: pickerAlt })
          : await replaceGalleryMedia({ id: picker.row.id, mediaId: pickedMediaId });
      if (res.ok) {
        toast.success(picker.kind === "add" ? "Görsel galeriye eklendi." : "Görsel değiştirildi.");
        setPicker(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setPickerBusy(false);
    }
  }

  async function save() {
    if (!target) return;
    setSaving(true);
    try {
      const res = await updateGalleryItem({ id: target.id, ...form });
      if (res.ok) {
        toast.success("Galeri görseli güncellendi.");
        setTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const res = await removeGalleryItem({ id: deleting.id });
      if (res.ok) {
        toast.success("Görsel galeriden çıkarıldı (medya kütüphanede kalır).");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{rows.length} görsel · {visibleCount} görünür</p>
        <Button onClick={openAdd} className="bg-[#9335FF] text-white hover:bg-[#8426F2]" disabled={mediaOptions.length === 0}>
          <ImagePlus className="h-4 w-4" /> Galeriye Görsel Ekle
        </Button>
      </div>

      {!wallOk ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Stüdyo duvarı tam olarak {WALL_SIZE} görünür görselle çizilir (şu an {visibleCount}). Sayı {WALL_SIZE} olmadan
            sitede referans görseller gösterilir. “Galeriye Görsel Ekle” ile sayıyı tamamlayın veya bir görseli gizleyin.
          </span>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700" role="status">
          Duvar tam: {WALL_SIZE} görünür görsel sitede yayında.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead className="w-20">Görsel</TableHead>
                <TableHead className="min-w-40">Caption / Alt</TableHead>
                <TableHead className="hidden md:table-cell">Oran</TableHead>
                <TableHead>Sıra</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-28" aria-label="İşlemler" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    Galeri boş. Önce Medya'ya görsel yükleyin, sonra “Galeriye Görsel Ekle” ile duvara ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <img src={r.publicUrl} alt={r.altText} className="h-10 w-14 rounded-md object-cover" loading="lazy" />
                    </TableCell>
                    <TableCell>
                      <p className="max-w-64 truncate text-sm font-medium text-neutral-900">{r.caption ?? "—"}</p>
                      <p className="max-w-64 truncate text-xs text-neutral-400">{r.altText}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">{r.aspectRatio ?? "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums text-neutral-600">{r.position}</TableCell>
                    <TableCell>
                      {r.isVisible ? (
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                          Görünür
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-neutral-200 text-neutral-400">
                          Gizli
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label="Görseli düzenle" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Görseli değiştir" onClick={() => openReplace(r)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" aria-label="Galeriden çıkar" onClick={() => setDeleting(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Düzenleme diyaloğu */}
      <Dialog open={target !== null} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Galeri görselini düzenle</DialogTitle>
            <DialogDescription>Caption, alt metin, sıra ve görünürlük. Görseli değiştirmek için listedeki yenile simgesini kullanın.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {target ? (
              <img src={target.publicUrl} alt={target.altText} className="max-h-40 w-full rounded-lg object-cover" />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="g-caption">Caption</Label>
              <Input id="g-caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-alt">Alt metin</Label>
              <Input id="g-alt" value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="g-pos">Sıra</Label>
                <Input id="g-pos" type="number" min={0} max={999} value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end justify-between gap-3 pb-1">
                <Label htmlFor="g-vis" className="text-sm font-normal">
                  Görünür
                </Label>
                <Switch id="g-vis" checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Vazgeç
            </Button>
            <Button onClick={() => void save()} disabled={saving} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medya seçici (ekle / değiştir) */}
      <Dialog open={picker !== null} onOpenChange={(v) => !v && setPicker(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{picker?.kind === "replace" ? "Görseli değiştir" : "Galeriye görsel ekle"}</DialogTitle>
            <DialogDescription>
              Medya kütüphanesinden bir görsel seçin. Kütüphane boşsa önce Medya sekmesinden dosya yükleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="admin-scroll grid max-h-72 grid-cols-3 gap-3 overflow-y-auto rounded-lg border border-neutral-200 p-3 sm:grid-cols-4">
              {mediaOptions.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-neutral-500">Galeriye eklenmemiş medya yok.</p>
              ) : (
                mediaOptions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickMedia(m)}
                    aria-pressed={pickedMediaId === m.id}
                    className={`overflow-hidden rounded-lg border-2 p-1 text-left transition-colors ${
                      pickedMediaId === m.id ? "border-[#9335FF] bg-[#9335FF]/5" : "border-transparent hover:border-neutral-200"
                    }`}
                  >
                    <img src={m.publicUrl} alt={m.altText ?? m.originalFilename} className="aspect-video w-full rounded object-cover" loading="lazy" />
                    <span className="block truncate text-xs text-neutral-500">{m.originalFilename}</span>
                  </button>
                ))
              )}
            </div>
            {picker?.kind === "add" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="picker-caption">Caption (isteğe bağlı)</Label>
                  <Input id="picker-caption" value={pickerCaption} onChange={(e) => setPickerCaption(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="picker-alt">Alt metin</Label>
                  <Input id="picker-alt" value={pickerAlt} onChange={(e) => setPickerAlt(e.target.value)} placeholder="Boşsa medya alt metni kullanılır" />
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPicker(null)}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitPicker()} disabled={!pickedMediaId || pickerBusy} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
              {pickerBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {picker?.kind === "replace" ? "Değiştir" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Çıkarma onayı */}
      <AlertDialog open={deleting !== null} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Görsel galeriden çıkarılsın mı?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.caption ?? deleting?.altText}” stüdyo duvarından kaldırılır; dosya medya kütüphanesinde kalır.
              Duvar yalnızca {WALL_SIZE} görünür görselle çizilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Çıkar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
