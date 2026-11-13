"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPressItem,
  deletePressItem,
  setPressItemVisibility,
  updatePressItem,
  type PressRow,
} from "@/features/admin/press/actions";
import { MediaPickerDialog } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Basında Biz yönetimi (14.11.2026): basın haberi kartları — URL + görsel +
 * açıklama + kaynak adı. Görsel Medya kütüphanesinden seçilir; sitede
 * görsele/karta tıklayan ziyaretçi orijinal haber kaynağına gider.
 */

const EMPTY_FORM = { url: "", imageUrl: "", description: "", sourceName: "", isVisible: true };

export function PressManager({ rows }: { rows: PressRow[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [target, setTarget] = useState<PressRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState<PressRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openCreate() {
    setTarget(null);
    setForm({ ...EMPTY_FORM });
    setMode("create");
  }

  function openEdit(row: PressRow) {
    setTarget(row);
    setForm({
      url: row.url,
      imageUrl: row.imageUrl,
      description: row.description,
      sourceName: row.sourceName ?? "",
      isVisible: row.isVisible,
    });
    setMode("edit");
  }

  async function toggleVisible(row: PressRow, isVisible: boolean) {
    const res = await setPressItemVisibility({ id: row.id, isVisible });
    if (res.ok) {
      toast.success(isVisible ? "Haber görünür yapıldı." : "Haber gizlendi.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res =
        mode === "create"
          ? await createPressItem({ ...form })
          : target
            ? await updatePressItem({ id: target.id, ...form })
            : { ok: false as const, error: "Haber bulunamadı." };
      if (res.ok) {
        toast.success(mode === "create" ? "Haber eklendi." : "Haber güncellendi.");
        setMode(null);
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
      const res = await deletePressItem({ id: deleting.id });
      if (res.ok) {
        toast.success("Haber silindi.");
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {rows.length > 0 ? `${rows.length} basın haberi` : "Henüz haber yok."} En yeni eklenen üstte gösterilir.
        </p>
        <Button onClick={openCreate} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
          <Plus className="h-4 w-4" /> Yeni Haber
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead className="min-w-48">Haber</TableHead>
                <TableHead className="hidden md:table-cell">Kaynak</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden lg:table-cell">Eklendi</TableHead>
                <TableHead className="w-20" aria-label="İşlemler" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                    Haber bulunamadı. Sağ üstteki “Yeni Haber” ile ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <img
                          src={r.imageUrl}
                          alt=""
                          className="h-10 w-16 shrink-0 rounded-md border border-neutral-200 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-medium text-neutral-900">{r.description}</p>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="block max-w-72 truncate text-xs text-[#8426F2] hover:underline"
                          >
                            {r.url}
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">
                      {r.sourceName || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.isVisible}
                          onCheckedChange={(v) => void toggleVisible(r, v)}
                          aria-label={`${r.sourceName ?? "Haber"} görünürlüğü`}
                        />
                        {r.isVisible ? (
                          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                            Görünür
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-neutral-200 text-neutral-400">
                            Gizli
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-500 lg:table-cell">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label="Haberi düzenle" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          aria-label="Haberi sil"
                          onClick={() => setDeleting(r)}
                        >
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

      <Dialog open={mode !== null} onOpenChange={(v) => !v && setMode(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Yeni Basın Haberi" : "Haberi düzenle"}</DialogTitle>
            <DialogDescription>
              Haberi yazan sitenin bağlantısını, kart görselini ve kısa açıklamayı girin. Değişiklikler anında yayına yansır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pr-url">Haber URL'si</Label>
              <Input
                id="pr-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://örnek-site.com/haber/nof-digital…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-img">Haber görseli</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pr-img"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/uploads/… veya https://…"
                />
                <Button type="button" variant="outline" onClick={() => setPickerOpen(true)} className="shrink-0">
                  <ImagePlus className="h-4 w-4" /> Seç
                </Button>
              </div>
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="Haber görseli önizleme"
                  className="mt-2 max-h-32 w-full rounded-lg border border-neutral-200 object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-desc">Açıklama</Label>
              <textarea
                id="pr-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                maxLength={600}
                placeholder="NOF Digital'ın haberi bu yayında şöyle anlatıldı…"
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#9335FF]"
              />
              <p className="text-xs text-neutral-400">{form.description.length}/600 karakter</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-src">Kaynak adı (isteğe bağlı)</Label>
              <Input
                id="pr-src"
                value={form.sourceName}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                placeholder="Ör. Hürriyet, Webrazzi…"
                maxLength={80}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pr-vis" className="text-sm font-normal">
                Sitede görünür
              </Label>
              <Switch id="pr-vis" checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)}>
              Vazgeç
            </Button>
            <Button onClick={() => void save()} disabled={saving} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="cover"
        onPick={(row) => setForm((f) => ({ ...f, imageUrl: row.publicUrl }))}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Haber silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.sourceName || deleting?.description.slice(0, 60)}” Basında Biz sayfasından ve ana sayfa
              önizlemesinden kaldırılır. Bu işlem geri alınamaz.
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
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
